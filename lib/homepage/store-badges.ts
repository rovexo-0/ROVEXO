import type { ShowcaseSellerSection } from "@/lib/homepage/showcase-sellers";

export type StoreBadgeTone = "premium" | "featured" | "verified" | "new";

export type StoreBadge = {
  label: string;
  tone: StoreBadgeTone;
};

const NEW_STORE_WINDOW_MS = 1000 * 60 * 60 * 24 * 30;

function isPremiumStore(section: ShowcaseSellerSection): boolean {
  return section.sellerTier === "premium" || section.listings.some((item) => item.sellerTier === "premium");
}

function isFeaturedStore(section: ShowcaseSellerSection): boolean {
  return section.listings.some((item) => item.isFeatured);
}

function isNewStore(section: ShowcaseSellerSection): boolean {
  const createdAt = section.listings
    .map((item) => item.createdAt)
    .filter(Boolean)
    .sort()[0];
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() <= NEW_STORE_WINDOW_MS;
}

/** Highest-priority store badge — only one visible at a time. */
export function resolveStoreBadge(section: ShowcaseSellerSection): StoreBadge | null {
  if (isPremiumStore(section)) return { label: "Premium", tone: "premium" };
  if (isFeaturedStore(section)) return { label: "Featured", tone: "featured" };
  if (section.sellerVerified) return { label: "Verified", tone: "verified" };
  if (isNewStore(section)) return { label: "New", tone: "new" };
  return null;
}
