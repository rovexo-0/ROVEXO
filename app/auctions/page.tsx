import type { Metadata } from "next";
import { AuctionsPage } from "@/features/auctions/components/AuctionsPage";
import { getAuctionsPageData } from "@/lib/auctions/queries";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Auctions",
  description: "Browse live auctions on ROVEXO. Bid on verified listings from trusted sellers across Europe.",
  path: "/auctions",
});

export default async function AuctionsRoutePage() {
  const initialData = await getAuctionsPageData();
  return <AuctionsPage initialData={initialData} />;
}
