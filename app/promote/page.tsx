import { PromotionToolsV1 } from "@/features/account-module/components/PromotionToolsV1";
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

/** Canonical Promote page — single SSOT route `/promote`. */
export default async function PromotePage({ searchParams }: PageProps) {
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
      backHref="/account"
      backLabel="Profile"
      initialSuccessMessage={initialSuccessMessage}
      initialSuccessType={promotion === "success" ? type : null}
    />
  );
}
