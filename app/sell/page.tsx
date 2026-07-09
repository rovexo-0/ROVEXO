import type { Metadata } from "next";
import { SellScreen } from "@/features/sell/ui/SellScreen";
import { getProfile } from "@/lib/profile/data";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Sell on ROVEXO",
  description: "List items for sale on the ROVEXO marketplace.",
  path: "/sell",
  noIndex: true,
});

export default async function SellRoute() {
  await getProfile();
  return <SellScreen />;
}
