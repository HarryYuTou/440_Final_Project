# AI recommendations (Member 5, `codex/ai-recommendations`)

Route: `/recommendations` (page) and `POST /api/recommendations` (unchanged route, real `recommendationService` behind it).

## How a recommendation is made

1. **Catalog** (`server/catalog-source.ts`): reads the whole snapshot from the catalog service. Like the map, only when that service is unavailable *and* `NODE_ENV=development` with `ENABLE_DEV_FIXTURES=true` does the map's preview catalog stand in, and the page shows the "Development preview" notice.
2. **Checks in code** (`lib/candidates.ts`): the requested country, region and starting item must exist (region inside its country), else `INVALID_INPUT`. All-"any" preferences with no flavors, methods or notes get a `no-match` that asks for one preference, with no model call.
3. **Candidates in code**: `selected` scope keeps beans grown in the area (a country-level bean is not counted for a region) and drinks associated with it (a country-level association covers its regions). `global` keeps everything and only tells the model where the user was browsing. The starting item is excluded and described separately. No candidates → `no-match` with "search all locations" / "include beans or drinks" suggestions, with no model call.
4. **Model** (`lib/prompt.ts`, `src/lib/server/ai-client.ts`): Claude ranks and explains *only* the candidates, citing only their source IDs. User notes go inside `<user_notes>` and are treated as data. Output is structured JSON (`lib/model-output.ts`).
5. **Validation**: every recommended item must be an offered candidate, unique and with a reason; unknown source IDs are dropped (falling back to the item's own sources); results are cut to `limit`. An invalid answer is retried once with the problem stated, then reported as `INTERNAL_ERROR` (retryable). Never shown unchecked.

Errors: no key → `SERVICE_UNAVAILABLE` (not retryable); rate limit / outage / timeout → `SERVICE_UNAVAILABLE` (retryable); model refusal → `INTERNAL_ERROR`. Provider failures never become a `no-match`.

## Shared AI client (also for Member 4)

`src/lib/server/ai-client.ts` exports `generateStructured({ system, prompt, schema, effort? })` → `{ ok: true, data }` or `{ ok: false, failure: { kind: "not-configured" | "provider" | "refused" | "invalid-output" } }`. It uses the official `@anthropic-ai/sdk` (exact pin `0.131.0`), structured outputs from a plain Zod object schema (validate refinements yourself afterwards), a 60 s timeout with one SDK retry, and the server-side refusal fallback (`fallbacks: "default"`). The trip map should call the same function rather than create a second client.

## Configuration (server environment only)

| Variable | Meaning |
|---|---|
| `MODEL_API_KEY` | Anthropic API key. Without it the page works but answers "AI recommendations aren’t configured". Never prefix with `NEXT_PUBLIC_`, never commit. |
| `MODEL_NAME` | Optional. Defaults to `claude-opus-5-5`. |

Local try-out: put `ENABLE_DEV_FIXTURES=true` and `MODEL_API_KEY=...` in `.env.local`, run `npm run dev`, open `/explore`, pick a place or bean and use "Get recommendations like this".

## Page

`ui/recommendation-form.tsx` (client): item type, search area (asked explicitly when the link carries a place but no `scope`), starting item (removable), acidity / sweetness / roast / milk, flavor chips plus free-text flavors, preparation methods and free-text notes. It pre-fills from `GET /api/preferences` when accounts are connected and can save via `PUT /api/preferences` (401 → sign-in hint, 503 → "isn't available yet"). Results link to the bean/drink pages, list reasons, trade-offs and sources, and use the map module's stand-in `SaveButton`.

## Integration notes

- **Member 3:** when the shared save action lands, replace the `SaveButton` import in `ui/recommendation-form.tsx` too. Nothing else here needs to change when the real catalog and accounts are connected. The SDK is a new dependency in `package.json`.
- **Paid benefit:** not enforced. If the team makes recommendations the paid feature, check `services.accounts.getAccess(request)` at the top of `recommend` in `server/service.ts`.

## Tests

`tests/unit/recommendations-service.test.ts` (fake model, no network): candidate selection, reference checks, the no-model `no-match` cases, validation and source filtering, the retry, failure mapping, the missing-key path, deep-link defaults and the display lookup.
