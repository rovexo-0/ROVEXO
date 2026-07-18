import { PromotionToolsV1 } from "@/features/account-module/components/PromotionToolsV1";
import { getBusinessProfile } from "@/lib/profile/data";
import { getCanonicalPromotionEntries } from "@/lib/promotions/canonical-tools";
import { getResolvedPromotionCatalog } from "@/lib/promotions/catalog";
import { fetchSellerListings } from "@/lib/seller/listings-queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

/** Business Promotions — one promotions implementation, Business return path. */
export default async function BusinessPromotionsRoute() {
  await getBusinessProfile();
  const [catalog, listingsData] = await Promise.all([
    getResolvedPromotionCatalog(),
    fetchSellerListings("published"),
  ]);

  return (
    <PromotionToolsV1
      entries={getCanonicalPromotionEntries(catalog)}
      trustItems={catalog.trustItems}
      listings={listingsData.listings}
      backHref="/business/dashboard"
      backLabel="Business"
    />
  );
}
