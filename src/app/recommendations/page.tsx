import type { Metadata } from "next";
import { RecommendationScreen } from "@/modules/recommendations/ui/recommendation-screen";
import { getRecommendationContext, type RecommendationSearchParams } from "@/modules/recommendations/ui/search-context";

export const metadata: Metadata = { title: "Find your coffee" };

export default async function RecommendationsPage({ searchParams }: { searchParams: Promise<RecommendationSearchParams> }) {
  return <RecommendationScreen context={getRecommendationContext(await searchParams)} />;
}
