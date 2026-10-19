import { unavailable } from "@/contracts";
import { respond } from "@/lib/server/http";

/** Member 3 must verify the raw body/signature and persist idempotently before returning success. */
export function POST(): Response {
  return respond(unavailable("Stripe webhook verification"));
}
