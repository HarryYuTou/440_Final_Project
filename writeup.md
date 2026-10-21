# Coffee Atlas: Personalized Coffee Discovery

**Live product:** [coffee-atlas-phi.vercel.app](https://coffee-atlas-phi.vercel.app)

## 1. Problem and Scoped PRD

Coffee-curious consumers can describe what they enjoy—fruity, chocolatey, creamy, or black—but often lack the origin knowledge and tasting vocabulary to choose an unfamiliar bean or regional drink. Coffee information is scattered across technical descriptions and geographic lists, leaving a practical question unanswered: **“What should I try next, and why?”**

Our idea was to connect personal taste with geographic discovery. The scoped product requirements were to let users explore coffee origins, understand sourced bean and drink descriptions, save preferences and favorites, and receive AI suggestions with understandable reasons. An AI trip map extends discovery into an ordered itinerary of coffee destinations.

The capstone scope also required account registration/login, persistent personal data, Stripe sandbox payments, and a publicly deployed application. A successful user journey therefore runs from browsing and signup through a personalized result, saving, payment, and returning to the same account. Coffee sales, café availability, travel booking, and realistic transport scheduling are outside scope.

## 2. Solution and User Journey

Coffee Atlas combines an interactive globe with a curated catalog of **60 countries, 54 regions, 61 beans, 27 drinks, 33 pairings, and 135 sources**. Users move from a country to its regions and coffee details, follow source links, and save items they want to revisit.

In **Find your coffee**, users describe acidity, sweetness, roast, milk, flavors, preparation methods, and optional notes. AI selects eligible catalog items and explains their fit and trade-offs. **Plan a trip** uses preferences and optionally saved items to produce a 2–6-stop route with numbered map pins, connecting lines, recommendations, and links to the same detail pages.

Each account receives three free successful recommendations. A one-time **USD $5.00 Stripe test payment** unlocks unlimited recommendations without moving real money. Trips currently remain outside the payment gate and do not consume recommendation credits; a server setting can include them in the same paid entitlement. Preferences, saved items, and paid access persist after logout and login.

## 3. Architecture and Key Decisions

The product is a single **Next.js application with React and TypeScript**, deployed on Vercel. Pages and API routes delegate to modules for the map, catalog, accounts/payments, recommendations, and trips. Shared **Zod contracts** validate data crossing module, HTTP, and model boundaries. **MapLibre** renders geographic exploration and trip routes.

Curated catalog records live in Git, where edits can be reviewed and checked for broken references. Personal state lives in **Turso/libSQL** in production and SQLite locally. This separation keeps editorial content consistent across maps and AI results while allowing geographic browsing independently of the user database. Passwords use scrypt hashing; cookie-based sessions identify users, and server queries enforce ownership of preferences and saved items.

Both AI features call **Anthropic through one server-only client**. The server constructs eligible catalog candidates before requesting an answer, then validates returned items, geographic relationships, duplicates, and reasons. Invalid answers receive one corrective retry; a second failure produces an error. Source links come from catalog records. These checks constrain outputs, while recommendation relevance and the accuracy of generated explanations still require evaluation.

Payment access is also controlled by the server. **Stripe Checkout** collects a simulated payment, and a signed, verified webhook grants the entitlement; returning to the website alone does not unlock access. Duplicate events are handled idempotently. Recommendation credits are claimed atomically only for validated results containing matches. Provider credentials remain on the server.

## 4. Implementation, Deployment, and Validation

The delivery path was **idea → scoped PRD → architecture → implementation → deployment**. The discovery problem defined the user journey and boundaries; shared contracts and feature modules supported parallel implementation; integrated features were then connected to hosted accounts, AI, and payments.

The merged application passed the recorded local verification suite: type checking, lint, **441 tests across 24 files**, a production build, and smoke checks covering **14 pages**. Tests cover account persistence, catalog integrity, invalid model output, quota enforcement, and payment events.

The live application uses Vercel, Turso, Anthropic, and Stripe sandbox. GitHub `main` is connected to Vercel: successful builds automatically publish to the existing public URL. The latest checked release, `f3536d6`, was verified as a ready production deployment triggered by a GitHub push.

On October 21, the team completed the public-site walkthrough and reported all steps passing: browsing, signup, saving, preference persistence, AI recommendations, trip generation, sandbox checkout, and retained data/access after re-login, including another recommendation after payment. Separately, a hosted Stripe checkout was verified to unlock access through its webhook. These results establish the working functional journey; broader quality and performance evaluation remains future work.

## 5. Next Steps

- Evaluate recommendation relevance with users and a repeatable preference test set, including contradictory requests.
- Improve trip ordering and overlapping map pins, while making the itinerary's discovery purpose clear.
- Expand sourced tasting information and prefilter candidates as the catalog grows to control AI latency and cost.
- Add account recovery, stronger abuse controls, operational monitoring, and refund/dispute support before wider commercial use.

Implementation details and supporting evidence are available in the [architecture](docs/ARCHITECTURE.md), [deployment record](docs/DEPLOYMENT.md), [recommendation evidence](src/modules/recommendations/EVIDENCE.md), and [trip report](src/modules/trip-map/README.md).
