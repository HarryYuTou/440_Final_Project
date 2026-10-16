import { unavailable } from "@/contracts";
import { respond } from "@/lib/server/http";

/** Member 4 must verify the raw body/signature and persist idempotently before returning success. */
export function POST(): Response {
  return respond(unavailable("Stripe webhook verification"));
}
