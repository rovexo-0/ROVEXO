import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MarketplaceConnectorsPage } from "@/features/seller/marketplace/components/MarketplaceConnectorsPage";
import { isMarketplaceConnectorsEnabled } from "@/lib/seller/marketplace/config";
import { getProfile } from "@/lib/profile/data";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Marketplace Connectors",
  description: "Connect marketplaces and manage import sources for your ROVEXO store.",
  path: "/seller/connectors",
  noIndex: true,
});

export default async function SellerMarketplaceConnectorsRoute() {
  if (!isMarketplaceConnectorsEnabled()) {
    redirect("/seller/dashboard");
  }

  const profile = await getProfile();
  if (!profile.isSeller) {
    redirect("/account");
  }

  return <MarketplaceConnectorsPage />;
}
