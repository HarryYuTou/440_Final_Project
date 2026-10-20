# AI trip map (Member 4, `codex/ai-trip-map`)

Routes: `/trip` (page) and `POST /api/trip` (route handler → `services.trips.plan`).
Member 5 recommends **what coffee to drink**; this module plans **where to go to drink it**.

## How a trip is planned

1. **Access (optional)** (`server/service.ts`): when `TRIP_REQUIRES_ACCESS=true`, `services.accounts.getAccess(request)` must allow the call first; `denied` → `FORBIDDEN` (the page links to `/upgrade`), `unavailable` → `SERVICE_UNAVAILABLE`. Off by default until the team picks the paid benefit.
2. **Catalog**: the same loader as recommendations (`recommendations/server/catalog-source.ts`), including the labeled development preview fallback.
3. **Account data**: preferences and saved items are read **on the server** through `AccountsService` for a verified signed-in session. The client never sends saved items (the contract rejects them). Preferences in the request (the page's form) win over saved ones; empty form answers are left out so the account's preferences apply.
4. **Checks in code, no model call**: nothing usable to plan from → `no-trip` asking for a preference (and "sign in" when signed out); fewer than two places with content → `no-trip` ("the atlas doesn't cover enough places yet").
5. **Destinations** (`lib/destinations.ts`): every country and region with at least one bean or drink. A country stop offers every bean grown in it; a region stop offers only beans recorded there, plus drinks associated with the region or its whole country. Saved items are marked so the model can prefer their places.
6. **Model** (`lib/prompt.ts`, shared `src/lib/server/ai-client.ts`): Claude selects and orders stops **only** from that list and picks one listed item per stop with one to three reasons. User notes are wrapped in `<user_notes>` and treated as data.
7. **Validation** (`lib/model-output.ts`): rejected (then retried once with the problem stated, then `INTERNAL_ERROR`, retryable) when a stop is an unknown country, a region outside its country or without content, an item not available at that stop, a repeated place or item, a country together with one of its own regions, a stop without a reason, or fewer than two stops. Repaired: text trimmed, extra stops cut to the requested count, empty title/summary defaulted. Sources and the "from your saved list" flag come from the catalog, never from the model.

Errors: missing `MODEL_API_KEY` → `SERVICE_UNAVAILABLE` (not retryable); rate limit / outage → `SERVICE_UNAVAILABLE` (retryable); refusal → `INTERNAL_ERROR`; unconnected catalog → `SERVICE_UNAVAILABLE`.

## Contract

`src/contracts/trips.ts`: `tripRequestSchema` (`preferences?`, `stopCount` 2–6 default 4, `useSavedItems` default true) and `tripResponseSchema` (`itinerary` with ordered stops `{ order, countryId, regionId | null, recommendation: ItemReference, reasons, fromSaved, sourceIds }`, `title`, `summary`, `basis`; or `no-trip` with `reason` and `suggestions`). `TripService` is in `src/contracts/services.ts`. Documented in `docs/CONTRACTS.md`.

## The globe

`ui/trip-globe.tsx` reuses Member 2's map building blocks rather than a new map design: `loadMapLibre`, `loadCountries` (the same bundled Natural Earth outlines), `buildMapStyle` (same layers and colors; stop countries use the curated tint) and `webglSupported`. On top it adds a great-circle route (`lib/route.ts`, drawn in over 1.6 s unless reduced motion) and numbered pins. Pins and list cards highlight each other; clicking a pin scrolls to its card and the map eases to the active stop.

It is a separate MapLibre instance on `/trip`, not the explore page's kept-alive map, because that map's markers and listeners are bound to `/explore` navigation (`map-experience/ui/map/keep-alive.ts`). **Agreed with Member 2 (2026-10-20):** the trip keeps its own map instance on `/trip`, built from the map module's shared style and loaders, so the explore map stays unchanged. If the route is ever wanted on `/explore` too, `routeLine`/`tripCamera` are pure and the layers are two `line` layers on one GeoJSON source, so they can move into `ui/map/style.ts` as an optional overlay.

A stop's pin uses its region's `center`, else its country's (the card then says "pin shows the country"); with neither it stays list-only and the caption lists it. Never `(0, 0)`. If WebGL or the map fails, a notice shows and the stop list is unaffected.

## Configuration

| Variable | Meaning |
|---|---|
| `MODEL_API_KEY`, `MODEL_NAME` | Shared with recommendations (server only). |
| `TRIP_REQUIRES_ACCESS` | `true` makes the trip map a paid feature (server-side check). Default `false`. |

Local try-out: `ENABLE_DEV_FIXTURES=true` and `MODEL_API_KEY=...` in `.env.local`, `npm run dev`, open `/trip` (or "Plan a trip" in the header).

## Integration notes

- **Member 3:** nothing to change here when accounts land; the service already reads `getSession`, `getPreferences`, `listSaved` and `getAccess`. Replace the stand-in `SaveButton` import in `ui/trip-planner.tsx` along with the others. Shared files touched by this branch: `src/contracts/{trips,index,services}.ts`, `src/lib/server/services.ts`, the header nav link, `.env.example`, `scripts/smoke.mjs`, `docs/CONTRACTS.md`.
- **Prompt size:** the full preview catalog (60 countries) makes a prompt of about 66 KB. If the real catalog grows a lot, pre-filter destinations (for example by flavor overlap and saved items) in `buildDestinations` before the model call.

## Tests and evidence

`tests/unit/trip-map.test.ts` (fake model, no network): destination rules, saved-item resolution, prompt data tags, every rejection case, repairs, the retry, the no-model `no-trip` cases, account-based planning, failure mapping, the paid-access switch, the contract, route geometry (great circle, antimeridian, camera) and the lookup's coordinate fallback.

End-to-end check (2026-10-20), `npm run dev` with the preview catalog and a local stand-in for the Messages API (`ANTHROPIC_BASE_URL`) so no real key was used:

| Case | Result |
|---|---|
| Fruity + sweet, espresso, 4 stops | 200 `itinerary`: Harar (Harar Natural) → Haraz (Haraz Natural) → Türkiye (Turkish coffee) → Italy (Espresso), route and pins drawn, links and sources shown |
| First model answer names a place not in the catalog | Rejected, re-asked with the problem, second answer accepted (two model calls) |
| Empty request, accounts not connected | 200 `no-trip` asking for a preference, no model call |
| `stopCount: 9` / client-sent `savedItems` | 400 `INVALID_INPUT` |
| Real key not set (production smoke) | 503 `SERVICE_UNAVAILABLE`; `/trip` shows "The coffee catalog isn’t connected yet." |

Still to record with a real `MODEL_API_KEY`: a live run of the normal case and a conflicting-preferences case (as in `recommendations/EVIDENCE.md`).
