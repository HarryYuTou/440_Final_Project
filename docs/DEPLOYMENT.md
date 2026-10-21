# Deployment (Member 3)

The recommended setup is **Vercel** for the Next.js app and **Turso** for the user database. Both have free tiers, and Stripe stays in test mode. All three need accounts that the team creates; this guide lists the exact steps. No secret value belongs in Git or in this file.

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

1. Import the GitHub repository in Vercel (framework: Next.js, default build command).
2. Project → Settings → Environment Variables (Production):

| Name | Value |
|---|---|
| `DATABASE_URL` | Turso URL |
| `DATABASE_AUTH_TOKEN` | Turso token |
| `AUTH_SECRET` | `openssl rand -hex 32` |
| `APP_URL` | `https://<your-domain>` |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` | from step 2 |
| `MODEL_API_KEY`, `MODEL_NAME` (optional) | from Member 5 |

Leave `ENABLE_DEV_FIXTURES` unset.

3. Deploy, then add the webhook (step 2.4) and redeploy.

## 4. Check the live site

1. `GET /api/health` shows `catalog: "ready"` and `accounts`, `payments` and `ai` as `"configured"`. This only checks that configuration is present.
2. Walk the journey: sign up → explore a country → save a bean → set preferences and get a recommendation (counts down from 3) → Plans → pay with `4242 4242 4242 4242` → the checkout page turns to "unlocked" once the webhook arrives → recommendations keep working after the free ones are used.
3. In Stripe → Webhooks, the deliveries show `200`. Use "Resend" on one: the response says `"duplicate"` and nothing is granted twice.

Any host that runs Next.js on Node.js 22+ works the same way. On a host with a persistent disk, `DATABASE_URL=file:/data/coffee-atlas.db` also works without Turso.
