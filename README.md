# Coffee Atlas

A five-person capstone project for discovering coffee beans and regional drinks through geography and personal preferences.

The app runs with no configuration: the map and the sourced catalog work out of the box. Accounts, saved items, AI recommendations and Stripe test payments switch on when their environment variables are set (see `.env.example`); until then they say they are not connected.

## Current status (October 20, 2026)

- The team split is final: Member 2 map, Member 3 catalog/data + accounts, saved items and Stripe payments + integration, Member 4 AI trip map (`codex/ai-trip-map`), Member 5 AI recommendations. [TEAM_BRANCH_PLAN.md](TEAM_BRANCH_PLAN.md) is the source of truth.
- Merged into `main`: the map (Member 2) and AI recommendations (Member 5).
- `codex/catalog-data` (Member 3) adds the real catalog (60 countries, sourced and integrity-checked), registration and sign-in, preferences and saved-item storage, the shared save action, and Stripe test checkout with verified webhooks. **Paid benefit:** 3 free AI recommendations per account, then a one-time payment unlocks unlimited ones. Details: [catalog](src/modules/catalog/README.md), [accounts and payments](src/modules/accounts/README.md), [deployment](docs/DEPLOYMENT.md).
- Not done yet: the AI trip map (Member 4) and the hosted deployment (needs the team's Vercel, Turso and Stripe test accounts; see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)).

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

`check` runs TypeScript, lint, and automated tests (including `npm run catalog:check`, the catalog integrity checks). `test:smoke` starts its own local production servers (one unconfigured, one with a fresh database for the account journey), checks the built application, and stops them afterward; it requires a successful build first. To run the whole sequence, use `npm run verify`.

The included GitHub Actions workflow runs `npm ci` and `npm run verify` on pull requests and pushes to `main` once this baseline is pushed to GitHub.

For a production-style local run:

```sh
npm run build
npm start
```

A successful local build does not mean the final product is deployed or that feature integrations are complete.

## Development examples

Synthetic contract examples are available only through the opt-in development fixture endpoint. Set `ENABLE_DEV_FIXTURES=true` in `.env.local`, restart `npm run dev`, and visit `/api/dev/fixtures`.

The endpoint returns 404 unless both development mode and the opt-in flag are active. It remains unavailable in a production build even if the flag is set. Fixtures do not create a session, payment, paid access, or AI response.

## Team documentation

- [Business question and PRD](WRITEUP_DRAFT.md)
- [Five-person branch plan](TEAM_BRANCH_PLAN.md)
- [Architecture and design decisions](docs/ARCHITECTURE.md)
- [Shared contracts and API routes](docs/CONTRACTS.md)
- [File and route ownership](docs/OWNERSHIP.md)
- [Main handoff and feature extension guide](docs/HANDOFF.md)
- [Deployment](docs/DEPLOYMENT.md)

Member 1 completes the local baseline first. The other four members create their branches from that baseline after it is committed and pushed. Member 2 builds the map, Member 3 owns the catalog, accounts and Stripe payments and coordinates integration, deployment, and final documentation, Member 4 builds the AI trip map, and Member 5 builds the AI recommendations.
