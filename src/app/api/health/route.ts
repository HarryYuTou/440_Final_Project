import { success } from "@/contracts";
import { respond } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export function GET(): Response {
  return respond(success({ status: "foundation", ready: false, services: "not-connected" }));
}
