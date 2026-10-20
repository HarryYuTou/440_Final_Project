import "server-only";
import { type ApiFailure, type ApiResult, type RecommendationResponse, type RecommendationService, success } from "@/contracts";
import { type AiFailure, type GenerateStructured, generateStructured } from "@/lib/server/ai-client";
import { checkReferences, hasUsablePreferences, selectCandidates } from "@/modules/recommendations/lib/candidates";
import { modelOutputSchema, validateModelOutput } from "@/modules/recommendations/lib/model-output";
import { buildRecommendationPrompt, RECOMMENDATION_SYSTEM } from "@/modules/recommendations/lib/prompt";
import { loadRecommendationCatalog, type RecommendationCatalog } from "./catalog-source";

const fail = (code: ApiFailure["error"]["code"], message: string, retryable: boolean): ApiFailure =>
  ({ ok: false, error: { code, message, retryable } });

function aiFailure(failure: AiFailure): ApiFailure {
  switch (failure.kind) {
    case "not-configured":
      return fail("SERVICE_UNAVAILABLE", "AI recommendations aren’t configured on this server yet.", false);
    case "provider":
      return failure.retryable
        ? fail("SERVICE_UNAVAILABLE", "The recommendation service is busy or unreachable. Please try again in a moment.", true)
        : fail("SERVICE_UNAVAILABLE", "The recommendation service can’t be used right now.", false);
    case "refused":
      return fail("INTERNAL_ERROR", "We couldn’t produce recommendations for this request. Try rewording your notes.", false);
    case "invalid-output":
      return fail("INTERNAL_ERROR", "The AI answer couldn’t be checked against the catalog. Please try again.", true);
  }
}

/** One retry when the model's answer fails validation; then an error, never an unchecked result. */
const MAX_ATTEMPTS = 2;

export function createRecommendationService(deps: {
  loadCatalog: () => Promise<RecommendationCatalog>;
  generate: GenerateStructured;
}): RecommendationService {
  return {
    // Not a paid feature yet. If the team makes it the paid benefit, check
    // services.accounts.getAccess(request) here before calling the model.
    async recommend(_request, input): Promise<ApiResult<RecommendationResponse>> {
      const catalog = await deps.loadCatalog();
      if (catalog.status === "unavailable") return fail("SERVICE_UNAVAILABLE", "The coffee catalog isn’t connected yet.", false);
      if (catalog.status === "error") return fail("INTERNAL_ERROR", "We couldn’t load the coffee catalog right now.", true);

      const problem = checkReferences(catalog.snapshot, input);
      if (problem) return fail("INVALID_INPUT", problem, false);

      if (!hasUsablePreferences(input.preferences)) {
        return success({
          status: "no-match",
          reason: "We need at least one preference to choose for you.",
          suggestions: [
            "Pick a flavor you enjoy, such as chocolate or fruity.",
            "Tell us whether you drink coffee with milk.",
            "Describe your usual coffee in the notes.",
          ],
        });
      }

      const set = selectCandidates(catalog.snapshot, input);
      if (set.candidates.length === 0) {
        const suggestions: string[] = [];
        if (input.geography.scope === "selected") suggestions.push("Search all supported locations instead of this one.");
        if (input.itemType !== "both") suggestions.push(`Include ${input.itemType === "bean" ? "drinks" : "beans"} as well.`);
        const wanted = input.itemType === "both" ? "beans or drinks" : `${input.startingItem ? "other " : ""}${input.itemType}s`;
        return success({
          status: "no-match",
          reason: `The catalog has no ${wanted} for ${set.areaLabel} yet.`,
          suggestions,
        });
      }

      let retryProblem: string | undefined;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const answer = await deps.generate({
          system: RECOMMENDATION_SYSTEM,
          prompt: buildRecommendationPrompt(input, set, retryProblem),
          schema: modelOutputSchema,
        });
        if (!answer.ok) {
          if (answer.failure.kind === "invalid-output") continue;
          return aiFailure(answer.failure);
        }
        const checked = validateModelOutput(answer.data, set.candidates, input.limit);
        if (checked.ok) return success(checked.response);
        retryProblem = checked.problem;
      }
      return aiFailure({ kind: "invalid-output" });
    },
  };
}

export const recommendationService: RecommendationService = createRecommendationService({
  loadCatalog: loadRecommendationCatalog,
  generate: generateStructured,
});
