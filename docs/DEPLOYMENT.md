# Deployment (Member 3)

The application is hosted on **Vercel**; **Turso** is the planned user database, and Stripe stays in test mode. The remaining setup below enables the account, AI, and payment flows. No secret value belongs in Git or in this file.

## Current deployment — October 20, 2026

- **Public URL:** [coffee-atlas-phi.vercel.app](https://coffee-atlas-phi.vercel.app)
- **Vercel project:** `harry-918a/coffee-atlas`
- **Release:** merged `main` at `1db47d0` plus local delivery documentation and deployment preparation. Source was uploaded with the Vercel CLI; no Git push or GitHub deployment integration was performed.
- **Verified publicly:** unauthenticated HTTPS access to 14 pages, catalog counts of 60 countries / 54 regions / 61 beans / 27 drinks / 33 pairings / 135 sources, bundled map data, and production fixture isolation (404).
- **Service state:** `/api/health` reports catalog `ready`, and accounts, payments, and AI `not-configured`. Account endpoints return the expected 503. The user chose to publish browsing first while credentials are being prepared.
- **Acceptance still required:** enable database/authentication, Anthropic, and Stripe test configuration; then complete the hosted account → AI → actual Stripe test checkout → verified webhook unlock journey. Local verification passed 441 tests across 24 files and the 14-page production smoke, but does not certify a real hosted payment.

## 1. Database (Turso)

```sh
turso db create coffee-atlas
turso db show coffee-atlas --url        # → DATABASE_URL (libsql://…)
turso db tokens create coffee-atlas     # → DATABASE_AUTH_TOKEN
```

The tables are created automatically on the first request (`src/modules/accounts/server/db.ts`). A fresh database needs no migration command.

## 2. Stripe (test mode)

1. Switch the Stripe dashboard to **Test mode**.
2. Products → add "Coffee Atlas: Unlimited recommendations", with a **one-time** price (the team picks the amount). Copy the `price_…` ID → `STRIPE_PRICE_ID`.
3. Developers → API keys → the `sk_test_…` secret key → `STRIPE_SECRET_KEY`. Live keys are refused by the app.
4. After the first deploy (step 3): Developers → Webhooks → add endpoint `https://<your-domain>/api/webhooks/stripe` with the events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` and `checkout.session.expired`. Copy its signing secret (`whsec_…`) → `STRIPE_WEBHOOK_SECRET`, then redeploy.

## 3. Hosting (Vercel)

1. Use the existing Vercel project `harry-918a/coffee-atlas` (framework: Next.js). GitHub integration can be connected later if automatic deployment is desired.
2. Project → Settings → Environment Variables (Production):

| Name | Value |
|---|---|
| `DATABASE_URL` | Turso URL |
| `DATABASE_AUTH_TOKEN` | Turso token |
| `AUTH_SECRET` | `openssl rand -hex 32` |
| `APP_URL` | `https://coffee-atlas-phi.vercel.app` |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` | from step 2 |
| `MODEL_API_KEY`, optional `MODEL_NAME` | shared Anthropic configuration |
| `TRIP_REQUIRES_ACCESS` | `true` to include trips in the same one-time unlock; `false` or unset keeps trips open |

Leave `ENABLE_DEV_FIXTURES` unset.

3. Deploy, then add the webhook (step 2.4) and redeploy.

## 4. Check the live site

1. After configuring the remaining services, `GET /api/health` should show `catalog: "ready"` and `accounts`, `payments` and `ai` as `"configured"`. This only checks that configuration is present; the current browsing release reports those three services as `"not-configured"`.
2. Walk the journey: sign up → explore a country → save a bean → set preferences and get a recommendation (counts down from 3) → Plans → pay with `4242 4242 4242 4242` → the checkout page turns to "unlocked" once the webhook arrives → recommendations keep working after the free ones are used.
3. In Stripe → Webhooks, the deliveries show `200`. Use "Resend" on one: the response says `"duplicate"` and nothing is granted twice.
4. With `TRIP_REQUIRES_ACCESS=true`, open `/trip` before paying: an unpaid account sees the plans link. After the same verified payment, it can plan routes and save recommendations; no separate Stripe product or purchase is needed. `/upgrade` lists both benefits, and trips do not use the three free recommendation credits. The repository default is `false`; set this server variable explicitly when the team enables paid trips.

Any host that runs Next.js on Node.js 22+ works the same way. On a host with a persistent disk, `DATABASE_URL=file:/data/coffee-atlas.db` also works without Turso.
