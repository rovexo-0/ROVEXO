import { PromotionToolsV1 } from "@/features/account-module/components/PromotionToolsV1";
import { getBusinessProfile } from "@/lib/profile/data";
import { getCanonicalPromotionEntries } from "@/lib/promotions/canonical-tools";
import { getResolvedPromotionCatalog } from "@/lib/promotions/catalog";
import { resolvePromotionSuccessMessage } from "@/lib/promotions/success-copy";
import { fetchSellerListings } from "@/lib/seller/listings-queries";
import { getStoreShowcasePersistenceStatus } from "@/lib/promote/store-showcase-status";
import { getAppSettings } from "@/lib/settings/store";
import { fetchProfile } from "@/lib/profile/queries";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/** Business Promotions — same Promote SSOT, Business return path. */
export default async function BusinessPromotionsRoute({ searchParams }: PageProps) {
  await getBusinessProfile();
  const profile = await fetchProfile();
  const params = (await searchParams) ?? {};
  const promotion = typeof params.promotion === "string" ? params.promotion : null;
  const type = typeof params.type === "string" ? params.type : null;
  const initialSuccessMessage =
    promotion === "success" ? resolvePromotionSuccessMessage(type) : null;

  const [catalog, listingsData, showcaseStatus, settings] = await Promise.all([
    getResolvedPromotionCatalog(),
    fetchSellerListings("published"),
    getStoreShowcasePersistenceStatus(profile.id),
    getAppSettings(profile.id).catch(() => null),
  ]);

  return (
    <PromotionToolsV1
      entries={getCanonicalPromotionEntries(catalog)}
      listings={listingsData.listings}
      activeListingCount={listingsData.listings.length}
      holidayModeEnabled={Boolean(settings?.vacationMode)}
      hasActiveStoreShowcase={showcaseStatus.hasActiveStoreShowcase}
      lastStoreShowcaseExpiredAt={showcaseStatus.lastExpiredAt}
      backHref="/business/dashboard"
      backLabel="Business"
      initialSuccessMessage={initialSuccessMessage}
    />
  );
}
