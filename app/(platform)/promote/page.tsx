import { PromotionToolsV1 } from "@/features/account-module/components/PromotionToolsV1";
import { getCanonicalPromotionEntries } from "@/lib/promotions/canonical-tools";
import { getResolvedPromotionCatalog } from "@/lib/promotions/catalog";
import { resolvePromotionSuccessMessage } from "@/lib/promotions/success-copy";
import { fetchSellerListings } from "@/lib/seller/listings-queries";
import { getStoreShowcasePersistenceStatus } from "@/lib/promote/store-showcase-status";
import { getAppSettings } from "@/lib/settings/store";
import { getAuthContext } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Canonical Promote page — single SSOT route `/promote`.
 * P0.4 — light cached auth (not heavy getProfile) + parallel independent fetches
 * so loading.tsx shell is replaced as soon as possible (Balance/Orders pattern).
 */
export default async function PromotePage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const promotion = typeof params.promotion === "string" ? params.promotion : null;
  const type = typeof params.type === "string" ? params.type : null;
  const initialSuccessMessage =
    promotion === "success" ? resolvePromotionSuccessMessage(type) : null;

  /* Auth + catalog + listings are independent — parallel like Orders buyer/seller lists. */
  const [auth, catalog, listingsData] = await Promise.all([
    getAuthContext(),
    getResolvedPromotionCatalog(),
    fetchSellerListings("published"),
  ]);

  if (!auth?.user.id) {
    redirect("/login?next=/promote");
  }

  const sellerId = auth.user.id;
  const [showcaseStatus, settings] = await Promise.all([
    getStoreShowcasePersistenceStatus(sellerId),
    getAppSettings(sellerId).catch(() => null),
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
