import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stableIdSchema } from "@/contracts";
import { ExploreScreen } from "@/modules/map-experience/ui/explore-screen";

export const metadata: Metadata = { title: "Explore a country" };

export default async function CountryPage({ params }: { params: Promise<{ countryId: string }> }) {
  if (!stableIdSchema.safeParse((await params).countryId).success) notFound();
  return <ExploreScreen level="country" />;
}
