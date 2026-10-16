import "server-only";
import { unavailable, type RecommendationService } from "@/contracts";

/** Member 5 replaces this adapter with catalog-grounded model recommendations. */
export const recommendationService: RecommendationService = {
  async recommend() { return unavailable("Recommendations"); },
};
