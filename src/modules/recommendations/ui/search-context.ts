import { stableIdSchema } from "@/contracts";

export type RecommendationSearchParams = Record<string, string | string[] | undefined>;

function safeId(value: string | string[] | undefined): string | undefined {
  const parsed = stableIdSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

/** Display-only context. This neither loads catalog records nor requests recommendations. */
export function getRecommendationContext(params: RecommendationSearchParams) {
  const context: { label: string; value: string }[] = [];
  const countryId = safeId(params.countryId);
  const regionId = countryId ? safeId(params.regionId) : undefined;
  const beanId = safeId(params.beanId);
  const drinkId = safeId(params.drinkId);
  // A URL must identify at most one starting item. Even an invalid second
  // parameter makes the user's intended starting item ambiguous.
  const hasAmbiguousStartingItem = params.beanId !== undefined && params.drinkId !== undefined;

  if (countryId) context.push({ label: "Country reference", value: countryId });
  if (regionId) context.push({ label: "Region reference", value: regionId });
  if (params.scope === "global") context.push({ label: "Search area", value: "All supported locations" });
  if (params.scope === "selected" && countryId) context.push({ label: "Search area", value: "Selected location" });
  if (params.type === "bean" || params.type === "drink" || params.type === "both") {
    context.push({ label: "Looking for", value: params.type === "bean" ? "Coffee beans" : params.type === "drink" ? "Regional drinks" : "Beans and drinks" });
  }
  if (!hasAmbiguousStartingItem && beanId) context.push({ label: "Starting bean reference", value: beanId });
  if (!hasAmbiguousStartingItem && drinkId) context.push({ label: "Starting drink reference", value: drinkId });
  return context;
}
