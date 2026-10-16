# Coffee Atlas

A five-person capstone project for discovering coffee beans and regional drinks through geography and personal preferences.

This repository currently provides the **independently runnable main foundation**. It includes application pages, shared contracts, server entry points, and explicit unavailable states. Interactive maps, researched catalog content, real authentication, AI recommendations, Stripe test checkout, and hosting belong to the four feature branches. They are not required to run this foundation.

## Run locally

Use Node.js 22.12 or newer within the 22.x release line, or Node.js 24.x/26.x, and npm. The repository's `.nvmrc` selects Node.js 22; use an up-to-date patch release.

```sh
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No environment variables, database, external account, or credentials are needed. Copying `.env.example` to `.env.local` is optional. Never commit `.env.local` or credentials.

## Check the foundation

```sh
npm run check
npm run build
npm run test:smoke
```

`check` runs TypeScript, lint, and automated tests. `test:smoke` starts its own local production server, checks the built application, and stops that server afterward; it requires a successful build first. To run the whole sequence, use `npm run verify`.

The included GitHub Actions workflow runs `npm ci` and `npm run verify` on pull requests and pushes to `main` once this baseline is pushed to GitHub.

For a production-style local run:

```sh
npm run build
npm start
```

A successful local build does not mean the final product is deployed or that feature integrations are complete.

## Development examples

The normal app shows honest empty or unavailable states. Example data is available only through the opt-in development fixture endpoint. Set `ENABLE_DEV_FIXTURES=true` in `.env.local`, restart `npm run dev`, and visit `/api/dev/fixtures`.

The endpoint returns 404 unless both development mode and the opt-in flag are active. It remains unavailable in a production build even if the flag is set. Fixtures do not create a session, payment, paid access, or AI response.

## Team documentation

- [Business question and PRD](WRITEUP_DRAFT.md)
- [Five-person branch plan](TEAM_BRANCH_PLAN.md)
- [Architecture and design decisions](docs/ARCHITECTURE.md)
- [Shared contracts and API routes](docs/CONTRACTS.md)
- [File and route ownership](docs/OWNERSHIP.md)
- [Main handoff and feature extension guide](docs/HANDOFF.md)

Member 1 completes the local baseline first. The other four members create their branches from that baseline after it is committed and pushed. Member 3 coordinates subsequent integration, deployment, and final documentation.
