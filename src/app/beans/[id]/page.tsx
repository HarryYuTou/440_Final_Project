import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { stableIdSchema } from "@/contracts";
import { DetailScreen } from "@/modules/map-experience/ui/detail-screen";

export const metadata: Metadata = { title: "Coffee bean" };

export default async function BeanPage({ params }: { params: Promise<{ id: string }> }) {
  if (!stableIdSchema.safeParse((await params).id).success) notFound();
  return <DetailScreen kind="bean" />;
}
