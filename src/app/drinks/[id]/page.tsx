import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stableIdSchema } from "@/contracts";
import { DetailScreen } from "@/modules/map-experience/ui/detail-screen";

export const metadata: Metadata = { title: "Regional drink" };

export default async function DrinkPage({ params }: { params: Promise<{ id: string }> }) {
  if (!stableIdSchema.safeParse((await params).id).success) notFound();
  return <DetailScreen kind="drink" />;
}
