# Main Handoff and Feature Extension Guide

## What main delivers

Main contains the application shell, all feature page entry points, shared contracts, safe server boundaries, configuration template, development examples, and verification commands. It starts without database, authentication, AI, Stripe, or hosting credentials.

The baseline is complete locally when a fresh installation can run the checks, build, and open all documented routes. Preparing this code does not itself create a Git commit, push a branch, set repository permissions, or deploy a website.

## Share the baseline

1. Review the working changes and run `npm run verify`.
2. In GitHub Desktop, confirm the current branch is `main`, commit the reviewed foundation, and push it to the team's repository.
3. Share the exact baseline commit with all four members. Confirm repository access and that Member 3 can manage the later merges.
4. Each member clones into their own working directory, checks out that same baseline on `main`, and creates only their assigned branch. No teammate needs another feature branch to begin.

The branch names are:

```text
codex/map-experience
codex/catalog-data
codex/accounts-payments
codex/ai-recommendations
```

For example, after fetching the shared baseline in their own clone, Member 2 can use:

```sh
git switch main
git pull --ff-only
git rev-parse HEAD
git switch -c codex/map-experience
npm ci
npm run dev
```

Confirm the printed commit matches the shared baseline before creating the branch. These are handoff instructions, not a statement that branches or remote commits already exist.

## Extension recipe

All feature owners should first read [CONTRACTS.md](CONTRACTS.md), [OWNERSHIP.md](OWNERSHIP.md), and their assignment in [TEAM_BRANCH_PLAN.md](../TEAM_BRANCH_PLAN.md).

### Member 2 — Map and exploration

- Extend the existing map-experience UI module and exploration/detail page entry points.
- Build against the catalog schemas and explicitly labeled development examples while Member 3 implements storage.
- Preserve stable IDs in detail and recommendation links. Check that a selected region belongs to its country.
- Connect Member 4's shared saving behavior and Member 5's documented recommendation context rather than duplicating those features.
- Retain readable empty/error states and a basic browsing route when the map cannot load.

### Member 3 — Catalog and integration

- Replace the catalog server boundary's unavailable behavior with validated reads from sourced records.
- Keep bean origin, drink associations, source references, and pairing types consistent with the shared contracts.
- Add real data and a reproducible import process; development fixtures remain examples.
- Coordinate shared-file changes and the four pull requests, then own final hosting and documentation assembly.

### Member 4 — Accounts and payments

- Implement authentication and the account server boundary before enabling user-specific persistence.
- Obtain identity from the server's session; never accept a browser-supplied user ID as authorization.
- Implement preference/save operations, the corresponding pages, and a reusable save action.
- Agree on a concrete paid benefit with the coordinator and feature owner, then connect Stripe **test** checkout, verified webhooks, and persisted access state.
- Keep access denied when identity, entitlement, or payment verification is unavailable. Handle duplicate events and delayed updates.

### Member 5 — AI and preferences

- Extend the preference and recommendation UI using the existing request schema.
- Connect real catalog candidates and a server-side model provider; validate output against existing IDs and sources.
- Return explanations, trade-offs, and honest no-match/clarification/failure states.
- Use Member 4's preference persistence and save interface. If the agreed paid benefit belongs here, enforce access on the server before running it.

## Configuration and service provisioning

No external service variables are required by the foundation. `.env.example` documents the optional fixture flag and reserved names for future integrations. `DATABASE_URL`, `AUTH_SECRET`, the Stripe variables, and `MODEL_API_KEY`/`MODEL_NAME` do not connect anything by themselves; `APP_URL` is also reserved for later integration. Feature owners may refine these names when selecting providers, keep example secrets empty, and document which values are server-only.

| Setup | Later owner |
|---|---|
| Catalog store, data import, hosting and deployment configuration | Member 3 |
| Authentication provider, user storage and Stripe test credentials/webhook setup | Member 4, coordinating storage changes with Member 3 |
| Model provider, model credentials and recommendation configuration | Member 5 |
| Map library/provider, if needed | Member 2, coordinating dependencies with Member 3 |

Any key that can authorize a provider call must stay out of client bundles and public environment variables. The coordinator collects configuration names and setup instructions, not secrets in documentation or pull requests.

## Decisions that continue after handoff

| Decision | Owner |
|---|---|
| Country/region coverage and researched content | Member 3 with Members 2 and 5 |
| Storage, identity, model and hosting providers | The relevant service owner, coordinated by Member 3 |
| Concrete paid benefit and payment model | Member 4, Member 3, and the paid feature owner |
| Final map design and geographic navigation | Member 2 |
| Recommendation interpretation, grounding and failure behavior | Member 5 |

These decisions are part of the feature work and do not require Member 1 to return before others can progress.

## Integration and submission

Member 3 integrates catalog/account capabilities early, then connects map and recommendations, payment/access, and the public deployment. Each author supplies checks and fixes for their own module. As a service is implemented, replace its foundation-only unavailable assertions in unit tests and `scripts/smoke.mjs` with checks for real behavior; keep input validation, identity/access protection, error handling, and production fixture isolation covered. Run the checks after integration.

The final hosted demonstration must use real catalog content, registration/login, grounded AI recommendations, saved state, Stripe test payment, and the agreed paid benefit. Update the architecture and README to match that system. Complete the remaining write-up sections from actual implementation and results, keeping the professor's 4–5-page limit.
