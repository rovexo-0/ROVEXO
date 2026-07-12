import { PromotionToolsV1 } from "@/features/account-module/components/PromotionToolsV1";
import { getCanonicalPromotionEntries } from "@/lib/promotions/canonical-tools";
import { getResolvedPromotionCatalog } from "@/lib/promotions/catalog";
import { fetchSellerListings } from "@/lib/seller/listings-queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

export default async function PromotionToolsRoute() {
  const [catalog, listingsData] = await Promise.all([
    getResolvedPromotionCatalog(),
    fetchSellerListings("published"),
  ]);

  const entries = getCanonicalPromotionEntries(catalog);

  return (
    <PromotionToolsV1
      entries={entries}
      trustItems={catalog.trustItems}
      listings={listingsData.listings}
    />
  );
}
