import { z } from "zod";
import { itemReferenceSchema } from "./common";

export const preferencesSchema = z.strictObject({
  acidity: z.enum(["low", "medium", "high", "any"]),
  sweetness: z.enum(["low", "medium", "high", "any"]),
  roast: z.enum(["light", "medium", "dark", "any"]),
  milk: z.enum(["none", "dairy", "plant", "any"]),
  flavors: z.array(z.string().trim().min(1).max(60)).max(12),
  preparationMethods: z.array(z.enum(["espresso", "filter", "immersion", "cold"])).max(4),
  notes: z.string().trim().max(1000),
});
export type Preferences = z.infer<typeof preferencesSchema>;

export interface SessionUser {
  id: string;
  displayName: string | null;
  email: string | null;
}

export type SessionState =
  | { status: "signed-in"; user: SessionUser }
  | { status: "signed-out"; user: null }
  | { status: "unavailable"; user: null };

export const savedItemInputSchema = itemReferenceSchema;
export interface SavedItem {
  itemType: "bean" | "drink";
  itemId: string;
  savedAt: string;
}

/** Reserved integration name. The team must agree on a real paid benefit before enabling it. */
export const PAID_CAPABILITY = "personalized-discovery" as const;
export type PaidAccess = {
  capability: typeof PAID_CAPABILITY;
} & (
  | { status: "granted"; allowed: true }
  | { status: "denied" | "unavailable"; allowed: false }
);

/** No client-supplied user, price, entitlement, or redirect can authorize a purchase. */
export const checkoutInputSchema = z.strictObject({ capability: z.literal(PAID_CAPABILITY) });
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
export interface CheckoutSession { url: string }
