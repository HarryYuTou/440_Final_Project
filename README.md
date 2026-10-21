# Coffee Atlas

A five-person capstone project for discovering coffee beans and regional drinks through geography and personal preferences.

The app runs with no configuration: the map and the sourced catalog work out of the box. Accounts, saved items, AI recommendations and Stripe test payments switch on when their environment variables are set (see `.env.example`); until then they say they are not connected.

## Current status (October 21, 2026)

- The team split is final: Member 2 map, Member 3 catalog/data + accounts, saved items and Stripe payments + integration, Member 4 AI trip map (`codex/ai-trip-map`), Member 5 AI recommendations. [TEAM_BRANCH_PLAN.md](TEAM_BRANCH_PLAN.md) is the source of truth.
- Merged into `main`: geographic exploration, the real catalog, accounts and saved items, AI recommendations, the AI trip map, and Stripe test payment integration. Catalog/accounts and trips were integrated through PRs #4 and #5.
- The catalog contains 60 countries, 54 regions, 61 beans, 27 drinks, 33 pairings, and 135 sources. **Paid benefit:** 3 free AI recommendations per account, then a one-time **USD $5.00 test payment** unlocks unlimited ones. Setting `TRIP_REQUIRES_ACCESS=true` includes trips in the same unlock; trips do not consume recommendation credits. The trip gate is off by default. Details: [catalog](src/modules/catalog/README.md), [accounts and payments](src/modules/accounts/README.md), [trip map](src/modules/trip-map/README.md).
- Public browsing and accounts are live at [coffee-atlas-phi.vercel.app](https://coffee-atlas-phi.vercel.app), backed by Turso. Hosted checks verify signup/login/logout, secure sessions, persistent preferences and saved items, user isolation, and three free credits; browser signup also succeeds. Earlier public checks covered 14 pages, the catalog, and map data.
- **Hosted acceptance completed:** on October 21, the team completed the public-site walkthrough and reported browsing, signup, saving, preference persistence, AI recommendations, trip generation, sandbox checkout, and retained data/access after re-login all working, including a recommendation after payment. Separately verified Stripe checks confirmed that a $5.00 test checkout triggered a verified webhook and retained the entitlement after logout/login. No real funds were charged. Hosted failure/delayed-payment cases and systematic AI quality evaluation were not part of this manual pass.
- Integrated local verification passes: 441 tests across 24 files, TypeScript, lint, production build, and 14-page smoke checks. See [deployment](docs/DEPLOYMENT.md) and the [write-up](writeup.md) for the separate hosted acceptance results.

## Run locally

Use Node.js 22.12 or newer within the 22.x release line, or Node.js 24.x/26.x, and npm. The repository's `.nvmrc` selects Node.js 22; use an up-to-date patch release.

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables are needed to browse the atlas. To try accounts, saving and the recommendation quota locally, create `.env.local` with:

```sh
DATABASE_URL=file:./data/coffee-atlas.db
AUTH_SECRET=<output of: openssl rand -hex 32>
```

The database file and its tables are created on first use. Stripe and the AI model have their own variables in `.env.example`. Never commit `.env.local` or credentials.

## Check the foundation

```sh
npm run check
npm run build
npm run test:smoke
```

`check` runs TypeScript, lint, and automated tests (including the catalog integrity tests also available through `npm run catalog:check`). `test:smoke` starts three local production servers: one unconfigured, one with a fresh database for the account journey, and one reusing that database with paid trips enabled. It checks the built application and stops the servers afterward; it requires a successful build first. To run the whole sequence, use `npm run verify`.

The included GitHub Actions workflow runs `npm ci` and `npm run verify` on pull requests and pushes to `main`. Vercel is connected to [HarryYuTou/440_Final_Project](https://github.com/HarryYuTou/440_Final_Project): pushes or merges into `main` trigger a build and, when successful, publish to the existing [production URL](https://coffee-atlas-phi.vercel.app). The production release checked on October 21 is Git-source `main` commit `f3536d6`, with Ready status and the public domain assigned. Its GitHub push trigger and matching commit were verified.

For a production-style local run:

```sh
npm run build
npm start
```

Passing local checks alone does not verify provider-connected hosted flows.

## Development examples

Synthetic contract examples are available only through the opt-in development fixture endpoint. Set `ENABLE_DEV_FIXTURES=true` in `.env.local`, restart `npm run dev`, and visit `/api/dev/fixtures`.

The endpoint returns 404 unless both development mode and the opt-in flag are active. It remains unavailable in a production build even if the flag is set. Fixtures do not create a session, payment, paid access, or AI response.

## Team documentation

- [Final write-up: problem, product, architecture, and next steps](writeup.md)
- [Five-person branch plan](TEAM_BRANCH_PLAN.md)
- [Architecture and design decisions](docs/ARCHITECTURE.md)
- [Shared contracts and API routes](docs/CONTRACTS.md)
- [File and route ownership](docs/OWNERSHIP.md)
- [Main handoff and feature extension guide](docs/HANDOFF.md)
- [Deployment](docs/DEPLOYMENT.md)

Member 1 established the shared foundation; Member 2 implemented the map; Member 3 implemented the catalog, accounts, saved items, and Stripe integration; Member 4 implemented the AI trip map; and Member 5 implemented AI recommendations. Their feature branches are integrated in `main`. The team reports the complete hosted functional walkthrough passed, including both AI features and Stripe sandbox payment.
