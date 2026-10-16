import type { Metadata } from "next";
import { ExploreScreen } from "@/modules/map-experience/ui/explore-screen";

export const metadata: Metadata = { title: "Explore" };

export default function ExplorePage() {
  return <ExploreScreen />;
}
