import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stableIdSchema } from "@/contracts";
import { ExploreScreen } from "@/modules/map-experience/ui/explore-screen";

export const metadata: Metadata = { title: "Explore a region" };

export default async function RegionPage({ params }: { params: Promise<{ countryId: string; regionId: string }> }) {
  const { countryId, regionId } = await params;
  if (!stableIdSchema.safeParse(countryId).success || !stableIdSchema.safeParse(regionId).success) notFound();
  return <ExploreScreen level="region" />;
}
