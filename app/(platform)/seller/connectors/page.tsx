import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MarketplaceConnectorsPage } from "@/features/seller/marketplace/components/MarketplaceConnectorsPage";
import { isMarketplaceConnectorsEnabled, MARKETPLACE_CONNECTORS_PATH } from "@/lib/seller/marketplace/config";
import { getProfile } from "@/lib/profile/data";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Connectors",
  description: "Connect marketplace import sources for your ROVEXO store.",
  path: MARKETPLACE_CONNECTORS_PATH,
  noIndex: true,
});

export default async function SellerConnectorsRoute() {
  if (!isMarketplaceConnectorsEnabled()) {
    redirect("/seller");
  }

  await getProfile();

  return <MarketplaceConnectorsPage />;
}
