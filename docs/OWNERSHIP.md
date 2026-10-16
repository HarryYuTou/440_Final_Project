# File and Route Ownership

This guide applies **after the main foundation is handed off**. Member 1 creates the common baseline and does not depend on any feature branch to finish it. Member 3 becomes the integration coordinator; each feature owner fixes issues in their own work.

## Primary ownership

| Owner and branch | Owned implementation | Responsibility |
|---|---|---|
| Member 1 — `main` | Initial shared scaffold, contracts, placeholder modules, example data, and documentation | Deliver the independently runnable foundation |
| Member 2 — `codex/map-experience` | `src/modules/map-experience/ui/` and assigned exploration/detail page entry points | Map, location browsing, bean/drink details, and recommendation links |
| Member 3 — `codex/catalog-data` | `src/modules/catalog/server/`, catalog route handlers, real content/imports, catalog storage | Sourced records and reads; later integration, hosting, and final documentation |
| Member 4 — `codex/accounts-payments` | `src/modules/accounts/`, account/payment page entry points, account/payment route handlers | Authentication, preferences and saves persistence, Stripe test flow, and server access decisions |
| Member 5 — `codex/ai-recommendations` | `src/modules/recommendations/`, recommendation page and route handler | Preference questionnaire, model integration, recommendations, explanations, and feature-side access enforcement |

## Page routes

| Route | Owner |
|---|---|
| `/` | Member 3 coordinates shared landing-page changes |
| `/explore` | Member 2 |
| `/explore/[countryId]` | Member 2 |
| `/explore/[countryId]/[regionId]` | Member 2 |
| `/beans/[id]` | Member 2 |
| `/drinks/[id]` | Member 2 |
| `/recommendations` | Member 5 |
| `/login`, `/signup`, `/account`, `/saved` | Member 4 |
| `/upgrade`, `/checkout/result` | Member 4 |

## API routes

| Route | Owner |
|---|---|
| `/api/health`, `/api/dev/fixtures` | Member 3 coordinates shared maintenance |
| `/api/catalog`, `/api/catalog/beans/[id]`, `/api/catalog/drinks/[id]` | Member 3 |
| `/api/session`, `/api/preferences`, `/api/saved`, `/api/access` | Member 4 |
| `/api/checkout`, `/api/webhooks/stripe` | Member 4 |
| `/api/recommendations` | Member 5 |

## Shared files and integration rules

After handoff, Member 3 coordinates changes to `src/contracts/`, `src/components/`, `src/lib/server/`, `src/dev/`, the global layout/styles, package and lock files, environment templates, build/test configuration, and documentation. This is coordination ownership, not a requirement for Member 3 to implement every feature.

- Keep feature-specific UI and service code inside the assigned module.
- Agree on contract changes with all consumers before making them. Update schemas, affected callers, examples, and tests together.
- Add dependencies with npm and include the corresponding lockfile change. Coordinate concurrent dependency edits.
- Member 4 owns preference storage; Member 5 owns the questionnaire. Do not create duplicate preference formats or saved-item stores.
- Member 3 and Member 4 coordinate database schema and migration changes before merging.
- Map and AI consume the catalog contract rather than maintaining independent production copies of coffee data.
- The paid feature owner enforces the server access decision supplied by Member 4. The coordinator and relevant owners agree on the real paid benefit first.

The complete task descriptions and final submission responsibilities remain in [TEAM_BRANCH_PLAN.md](../TEAM_BRANCH_PLAN.md).
