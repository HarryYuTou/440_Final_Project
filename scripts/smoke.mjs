import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { access } from "node:fs/promises";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = fileURLToPath(new URL("../", import.meta.url));
await access(new URL("../.next/BUILD_ID", import.meta.url)).catch(() => {
  throw new Error("Build the application with npm run build before running test:smoke.");
});

// Ask the OS for a free loopback port; never stop or reuse somebody else's server.
const reservation = createServer();
reservation.listen(0, "127.0.0.1");
await once(reservation, "listening");
const { port } = reservation.address();
await new Promise((resolve, reject) => reservation.close((error) => error ? reject(error) : resolve()));
const base = `http://127.0.0.1:${port}`;
const environment = { ...process.env };
for (const key of ["DATABASE_URL", "AUTH_SECRET", "MODEL_API_KEY", "MODEL_NAME", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_ID"]) {
  delete environment[key];
}

const server = spawn(process.execPath, [
  fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url)),
  "start", "--hostname", "127.0.0.1", "--port", String(port),
], {
  cwd: root,
  env: { ...environment, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1", ENABLE_DEV_FIXTURES: "true" },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
let launchError;
for (const stream of [server.stdout, server.stderr]) {
  stream.on("data", (chunk) => { output = `${output}${chunk}`.slice(-12000); });
}
server.on("error", (error) => { launchError = error; });

async function stop() {
  if (server.exitCode !== null || server.signalCode !== null || !server.pid) return;
  const exited = once(server, "exit");
  server.kill("SIGTERM");
  const timer = setTimeout(() => server.kill("SIGKILL"), 5000);
  timer.unref();
  try { await exited; } finally { clearTimeout(timer); }
}
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => { void stop().finally(() => process.exit(1)); });
}

async function request(path, init) {
  return fetch(`${base}${path}`, { ...init, redirect: "manual", signal: AbortSignal.timeout(10000) });
}
async function json(path, status, init) {
  const response = await request(path, init);
  assert.equal(response.status, status, `${init?.method ?? "GET"} ${path}`);
  assert.equal(response.headers.get("cache-control"), "no-store", path);
  return response.json();
}
function mutation(method, body) {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

try {
  const deadline = Date.now() + 30000;
  let ready = false;
  while (Date.now() < deadline) {
    if (launchError) throw launchError;
    if (server.exitCode !== null || server.signalCode !== null) throw new Error(`Server stopped before startup.\n${output}`);
    try { ready = (await request("/api/health")).status === 200; } catch { /* Server is still starting. */ }
    if (ready) break;
    await delay(200);
  }
  assert.ok(ready, `Server did not become ready.\n${output}`);

  const pages = [
    "/", "/explore", "/explore/example-country", "/explore/example-country/example-region",
    "/beans/example-bean", "/drinks/example-drink", "/recommendations", "/trip", "/login", "/signup",
    "/account", "/saved", "/upgrade", "/checkout/result?paid=true&session_id=pretend",
  ];
  // Map and detail pages read the catalog per request; while it is unavailable they say so (HTTP 200).
  const catalogPages = new Set(pages.filter((path) => /^\/(explore|beans|drinks)(\/|$)/.test(path)));
  for (const path of pages) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.ok(html.includes("Coffee Atlas"), `Shared application shell missing at ${path}`);
    assert.ok(!html.includes("NEXT_HTTP_ERROR_FALLBACK;500"), `Server rendering error at ${path}`);
    if (path.startsWith("/checkout/result")) assert.ok(html.includes("No payment has been confirmed."));
    if (path === "/trip") assert.ok(html.includes("The coffee catalog isn’t connected yet."), "Trip page should report the unconnected catalog");
    if (catalogPages.has(path)) {
      assert.ok(html.includes("The coffee catalog isn’t connected yet."), `Unavailable catalog notice missing at ${path}`);
      assert.ok(!html.includes("Development preview data"), `Map preview data leaked into production at ${path}`);
    }
  }
  assert.equal((await request("/this-route-does-not-exist")).status, 404);

  assert.deepEqual(await json("/api/health", 200), {
    ok: true, data: { status: "foundation", ready: false, services: "not-connected" },
  });
  for (const path of ["/api/catalog", "/api/catalog/beans/example-bean", "/api/catalog/drinks/example-drink", "/api/preferences", "/api/saved"]) {
    const result = await json(path, 503);
    assert.equal(result.ok, false, path);
    assert.equal(result.error.code, "SERVICE_UNAVAILABLE", path);
  }
  const session = await json("/api/session?userId=admin", 503, { headers: { cookie: "userId=admin; paid=true" } });
  assert.deepEqual(session.state, { status: "unavailable", user: null });
  const accessState = await json("/api/access?paid=true&session_id=pretend", 503);
  assert.deepEqual(accessState.state, { capability: "personalized-discovery", status: "unavailable", allowed: false });

  const preferences = {
    acidity: "low", sweetness: "any", roast: "medium", milk: "dairy",
    flavors: ["chocolate"], preparationMethods: ["espresso"], notes: "",
  };
  const operations = [
    ["/api/preferences", mutation("PUT", preferences)],
    ["/api/saved", mutation("POST", { itemType: "bean", itemId: "example-bean" })],
    ["/api/saved", mutation("DELETE", { itemType: "drink", itemId: "example-drink" })],
    ["/api/recommendations", mutation("POST", { preferences, itemType: "both", geography: { scope: "global" } })],
    ["/api/trip", mutation("POST", { preferences, stopCount: 3 })],
    ["/api/checkout", mutation("POST", { capability: "personalized-discovery" })],
    ["/api/webhooks/stripe", mutation("POST", { type: "checkout.session.completed" })],
  ];
  for (const [path, init] of operations) {
    const result = await json(path, 503, init);
    assert.equal(result.error.code, "SERVICE_UNAVAILABLE", path);
  }
  for (const [path, init] of [
    ["/api/catalog?regionId=example-region", undefined],
    ["/api/saved", mutation("POST", { itemType: "bean", itemId: "example-bean", userId: "admin" })],
    ["/api/checkout", mutation("POST", { capability: "personalized-discovery", paid: true })],
    ["/api/recommendations", mutation("POST", {})],
    ["/api/trip", mutation("POST", { stopCount: 9 })],
    ["/api/trip", mutation("POST", { savedItems: [{ itemType: "bean", itemId: "example-bean" }] })],
  ]) {
    assert.equal((await json(path, 400, init)).error.code, "INVALID_INPUT", path);
  }
  // Even an explicitly enabled development flag must never expose fixtures in production.
  const fixtures = await json("/api/dev/fixtures", 404);
  assert.equal(fixtures.ok, false);
  assert.equal(fixtures.error.code, "NOT_FOUND");
  console.log(`Production smoke passed: ${pages.length} pages, missing-route handling, API boundaries, and production fixture isolation.`);
} catch (error) {
  console.error(output);
  throw error;
} finally {
  await stop();
}
