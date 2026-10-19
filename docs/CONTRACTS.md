# Shared Contracts and API Routes

The source of truth is `src/contracts/`. Import shared types and Zod schemas from `@/contracts`; keep server implementation imports out of client components. Any contract change after handoff is coordinated by Member 3 with its producers and consumers.

## Common response and identifiers

Service responses use `ApiResult<T>`:

```ts
{ ok: true, data: T }
// or
{ ok: false, error: { code, message, retryable } }
```

Error codes are `INVALID_INPUT`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `SERVICE_UNAVAILABLE`, and `INTERNAL_ERROR`. An unavailable foundation adapter reports `SERVICE_UNAVAILABLE` with `retryable: false`: retrying cannot connect a feature that has not been implemented.

The shared HTTP helper maps these errors to 400, 401, 403, 404, 503, and 500 respectively; success returns 200. Responses use `Cache-Control: no-store`. Invalid JSON, unknown input fields, and repeated query parameters are rejected. Unexpected exceptions produce a generic error without exposing provider details or stack traces.

Session/access routes use `StateApiResult<T>`: when unavailable they return HTTP 503 with the normal failure envelope **plus a top-level `state`**. For example, access returns `state: { capability: "personalized-discovery", status: "unavailable", allowed: false }`. Consumers must check `ok`; the presence of state is not a successful service response.

Catalog IDs match `^[a-z][a-z0-9-]{1,79}$`. Treat them as stable opaque identifiers, not as a way to infer names or geography. An item reference is `{ itemType: "bean" | "drink", itemId: string }`.

## Catalog

`CatalogService` exposes `list(filter)`, `getBean(id)`, and `getDrink(id)`. The snapshot contains `countries`, `regions`, `beans`, `drinks`, `pairings`, and `sources`.

| Record | Shared fields and relationships |
|---|---|
| Source | `id`, `title`, absolute HTTP/HTTPS `url`, nullable `publisher`, `accessedAt` as `YYYY-MM-DD` |
| Country | `id`, `name`, nullable two-letter uppercase `isoCode`, nullable `center`, `summary`, `sourceIds` |
| Region | `id`, parent `countryId`, `name`, nullable `center`, `summary`, `sourceIds` |
| Bean | `id`, `name`, `description`, `origin`, flavor/variety/processing arrays, nullable roast/growing descriptions, `sourceIds` |
| Drink | `id`, `name`, `description`, `associatedLocations`, flavor/ingredient arrays, nullable preparation/cultural descriptions, `sourceIds` |
| Pairing | `id`, `beanId`, `drinkId`, `relationship: "documented" | "suggested"`, `explanation`, `sourceIds` |

A location reference contains `countryId` and a **nullable** `regionId`. Nullable fields must be present with `null` when unknown; they are not silently omitted. Empty descriptive arrays indicate no recorded values. All content records require at least one source reference.

Country and region `center` values provide an optional map focus as `{ latitude, longitude }` in decimal degrees. Latitude must be within `[-90, 90]` and longitude within `[-180, 180]`; both must be finite numbers. Use `center: null` when coordinates are unknown. The map must keep the location accessible through its list/detail views, skip coordinate-based markers or automatic zoom for that record, and never substitute `(0, 0)` for missing coordinates. Centers are navigation aids, not growing-area boundaries. The synthetic fixtures use `null`; Member 3 supplies sourced geographic values and Member 2 determines viewport behavior. No viewport bounds are prescribed by this foundation.

Bean origin means where the bean grows. A drink's associated locations describe cultural association. A suggested pairing describes compatibility; it does not establish an origin or tradition. The foundation schemas validate record shapes, not full referential integrity. Real catalog ingestion must check unique IDs, that referenced countries, regions, beans, drinks, and sources exist, and that region/country relationships agree.

Catalog filtering accepts optional `countryId` and `regionId`; supplying a region requires a country. A filtered snapshot must retain the reference records needed to interpret its returned content.

## Accounts, preferences, saves, and paid access

`AccountsService` receives the incoming `Request` so its implementation can derive identity from a verified session. Callers never supply a user ID to authorize an operation.

- `getSession(request)` returns one of `signed-in` with a user, `signed-out` with `user: null`, or `unavailable` with `user: null`. An unconnected service is not the same as a confirmed signed-out user.
- `getPreferences(request)` returns `Preferences | null`; `savePreferences(request, input)` writes the entire validated preference object.
- `listSaved`, `saveItem`, and `removeSaved` work on the current user's item references. A saved record includes `savedAt`. Removal returns `{ removed: boolean }`.
- `getAccess(request)` returns the named capability, a status, and an authoritative `allowed` boolean.
- `createCheckout(request, input)` returns a checkout URL only once a real provider implementation is connected.

The preference shape is shared by persistence and recommendation input:

```json
{
  "acidity": "low",
  "sweetness": "any",
  "roast": "medium",
  "milk": "dairy",
  "flavors": ["chocolate"],
  "preparationMethods": ["espresso"],
  "notes": "I want to try something new in milk coffee."
}
```

`acidity` and `sweetness` accept `low`, `medium`, `high`, or `any`. Roast accepts `light`, `medium`, `dark`, or `any`; milk accepts `none`, `dairy`, `plant`, or `any`. There may be up to 12 flavor strings (1–60 characters each), up to four preparation methods from `espresso`, `filter`, `immersion`, and `cold`, and up to 1,000 characters of notes. All fields are required, including arrays and notes when empty.

`PAID_CAPABILITY` is the reserved integration identifier `personalized-discovery`. It does **not** select a price, subscription, or actual paid feature. Owners must agree on that benefit before enabling it. Access can be `granted`/`allowed: true`, `denied`/`allowed: false`, or `unavailable`/`allowed: false`. The baseline is unavailable and denies access. Checkout input is exactly `{ "capability": "personalized-discovery" }`; clients cannot submit a price, user ID, entitlement, or redirect URL to authorize purchase.

## Recommendations

`RecommendationService.recommend(request, input)` accepts:

- The full `preferences` object above.
- `itemType`: `bean`, `drink`, or `both`.
- `geography`: `scope: "global" | "selected"`, with optional country and region IDs. Selected scope requires a country; a region always requires its country. A global request may retain location context, but must not silently be restricted to it.
- Optional `startingItem`, using the shared item-reference shape.
- `limit`, an integer from 1 to 10, defaulting to 3.

The `/recommendations` page accepts exploration context through URL query parameters. These are deep-link names, not the JSON request body's field names:

| Page query parameter | Mapping into a later `POST /api/recommendations` body |
|---|---|
| `type=bean`, `drink`, or `both` | `itemType` |
| `scope=global` or `selected` | `geography.scope` |
| `countryId` | `geography.countryId` |
| `regionId` | `geography.regionId`; requires a valid `countryId` |
| `beanId` | `startingItem: { itemType: "bean", itemId: beanId }` |
| `drinkId` | `startingItem: { itemType: "drink", itemId: drinkId }` |

All IDs use the shared `stableIdSchema`. Use at most one of `beanId` and `drinkId`; conflicting values must not select an arbitrary starting item. The foundation displays valid context only and does not invoke the recommendation service or infer preferences. Member 5 gathers preferences, confirms any missing search settings, and validates the complete API request before submission. For example, `/recommendations?countryId=example-country&type=both&scope=selected&beanId=example-bean` supplies selected-country context and a starting bean; it does not establish that those synthetic IDs exist in the real catalog.

A successful domain response has `status: "matches"` with one or more matches, or `status: "no-match"` with a reason and suggestions. Each match contains `item`, nonempty `reasons`, `tradeOffs`, and nonempty `sourceIds`. This result is wrapped in `ApiResult` for transport.

The AI implementation must validate both the response shape and its references against the real catalog. A syntactically valid ID is not proof that an item or supporting source exists. Provider failures remain errors; they must not become fabricated results or misleading no-match outcomes. If recommendations implement the agreed paid benefit, check `AccountsService.getAccess` on the server before executing it.

## Trip itinerary (planned, Member 4)

The AI trip map is added after handoff; its schema is not in `src/contracts/` yet. Member 4 adds it there with Member 3 and keeps it consistent with this description:

- Input comes from the signed-in user's stored preferences and saved item references, read on the server through `AccountsService`. The browser does not supply a user ID.
- The server calls the model with the shared server-side AI client used by recommendations. The model key stays in a server environment variable and is never sent to the client.
- The model may choose stops only from existing catalog country IDs and region IDs. The server validates every stop against the real catalog (the ID exists, and a region belongs to its country) before responding; invalid output is rejected, not shown.
- A successful itinerary contains ordered `stops`. Each stop has a location reference (`countryId`, nullable `regionId`), a recommended catalog item reference, and a nonempty reason tied to the user's preferences.
- The response uses `ApiResult` like other services. Provider failures and invalid model output are errors, not fabricated itineraries.
- The map draws the route between stop `center` values on the existing globe; stops whose `center` is `null` stay in the list without a map point.

## API entry points

These routes are intentionally available before providers are connected. The normal catalog, persistence, recommendation, and checkout endpoints return unavailable errors until their owner replaces the corresponding server implementation. Session and access communicate their explicit unavailable states.

| Method and route | Input / purpose |
|---|---|
| `GET /api/health` | Returns `{ ok: true, data: { status: "foundation", ready: false, services: "not-connected" } }`; does not certify feature providers or deployment |
| `GET /api/catalog` | Optional `countryId` and `regionId` query parameters |
| `GET /api/catalog/beans/[id]` | Stable bean ID |
| `GET /api/catalog/drinks/[id]` | Stable drink ID |
| `GET /api/session` | Current session state |
| `GET /api/preferences` | Current user's stored preferences |
| `PUT /api/preferences` | Full preferences JSON object |
| `GET /api/saved` | Current user's saved records |
| `POST /api/saved` | Item-reference JSON object |
| `DELETE /api/saved` | Item-reference JSON object |
| `POST /api/recommendations` | Recommendation request JSON object |
| `GET /api/access` | Current server-side paid-access decision |
| `POST /api/checkout` | Checkout input JSON object |
| `POST /api/webhooks/stripe` | Future server webhook entry; never accepts events as successful in the foundation |
| `GET /api/dev/fixtures` | Labeled examples only when development mode and the explicit flag are active |

Provider routes should retain their method, request shape, response envelope, and error semantics as their implementations are connected. Authentication-provider-specific routes can be added by Member 3 as needed; the foundation's login/signup pages are not themselves an authentication implementation.

## Development fixture package

`src/dev/fixtures.ts` exports `developmentFixturesEnabled()` and `getDevelopmentFixtures()`. The getter returns `null` unless both gates are enabled, so importing it directly does not bypass the production restriction. The permitted endpoint wraps the package in `ApiResult` with `kind: "synthetic-development-fixtures"`, a notice, `catalog`, `preferences`, and `recommendationRequest`.

The catalog uses `example-country`, `example-region`, `example-bean`, `example-drink`, `example-pairing`, and `example-source`. Its `example.invalid` source URL is deliberately not evidence. There are no sample authenticated sessions, successful payments, entitlements, or generated recommendation results. Normal catalog adapters do not fall back to these records.

## Exact server extension points

| Module file | Export to implement | Interface |
|---|---|---|
| `src/modules/catalog/server/service.ts` | `catalogService` | `CatalogService` |
| `src/modules/accounts/server/service.ts` | `accountsService` | `AccountsService` |
| `src/modules/recommendations/server/service.ts` | `recommendationService` | `RecommendationService` |

`src/lib/server/services.ts` combines these as `services.catalog`, `services.accounts`, and `services.recommendations`. Route handlers use that server-only binding. Keep the exported interface stable so feature implementations can replace unavailable adapters without rewriting their consumers. Member 3 separately replaces `src/app/api/webhooks/stripe/route.ts` with raw-body signature verification and idempotent event processing.
