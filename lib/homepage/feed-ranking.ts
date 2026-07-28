import { computeTimeDecayPromotionScore } from "@/lib/promotions/boost-time-decay-v1";
import type { Product } from "@/lib/products/types";

/** Canonical homepage priority weights — promotions rank inside All Listings only. */
export const HOMEPAGE_PRIORITY_WEIGHTS = {
  premium: 100,
  boost: 80,
  featured: 60,
  verifiedBusiness: 50,
  recommended: 40,
  new: 30,
  verifiedSeller: 20,
  organic: 0,
} as const;

export type HomepagePromotionBadgeTone =
  | "premium"
  | "boost"
  | "featured"
  | "new"
  | "verified"
  | "business";

export type HomepagePromotionBadge = {
  label: string;
  tone: HomepagePromotionBadgeTone;
};

const NEW_LISTING_WINDOW_MS = 1000 * 60 * 60 * 24 * 14;

function isPremiumListing(product: Product): boolean {
  return product.sellerTier === "premium" || product.listingType === "premium";
}

function isBusinessListing(product: Product): boolean {
  return product.sellerTier === "business" || product.listingType === "business";
}

function isRecommendedListing(product: Product): boolean {
  return product.sections?.includes("recommended") ?? false;
}

function isNewListing(product: Product): boolean {
  if (product.sections?.includes("new")) return true;
  if (!product.createdAt) return false;
  return Date.now() - new Date(product.createdAt).getTime() <= NEW_LISTING_WINDOW_MS;
}

/** Computes the unified homepage feed priority score for a listing. */
export function computeHomepagePriorityScore(product: Product): number {
  let score = HOMEPAGE_PRIORITY_WEIGHTS.organic;

  if (isPremiumListing(product)) score += HOMEPAGE_PRIORITY_WEIGHTS.premium;
  if (product.isBumped) score += HOMEPAGE_PRIORITY_WEIGHTS.boost;
  if (product.isFeatured) score += HOMEPAGE_PRIORITY_WEIGHTS.featured;
  if (isBusinessListing(product)) score += HOMEPAGE_PRIORITY_WEIGHTS.verifiedBusiness;
  if (isRecommendedListing(product)) score += HOMEPAGE_PRIORITY_WEIGHTS.recommended;
  if (isNewListing(product)) score += HOMEPAGE_PRIORITY_WEIGHTS.new;
  if (product.sellerVerified) score += HOMEPAGE_PRIORITY_WEIGHTS.verifiedSeller;

  return score;
}

/** Highest-priority badge to display on a listing card (badges never create sections). */
export function resolveHomepagePromotionBadge(product: Product): HomepagePromotionBadge | null {
  if (isPremiumListing(product)) return { label: "Premium", tone: "premium" };
  if (product.isBumped) return { label: "Boost", tone: "boost" };
  if (product.isFeatured) return { label: "Featured", tone: "featured" };
  if (isNewListing(product)) return { label: "New", tone: "new" };
  if (isBusinessListing(product) && product.sellerVerified) {
    return { label: "Verified Store", tone: "verified" };
  }
  if (isBusinessListing(product)) return { label: "Verified Store", tone: "verified" };
  if (product.sellerVerified) return { label: "Verified Store", tone: "verified" };
  return null;
}

export function compareHomepageFeedProducts(a: Product, b: Product): number {
  const scoreDelta = computeHomepagePriorityScore(b) - computeHomepagePriorityScore(a);
  if (scoreDelta !== 0) return scoreDelta;

  const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  if (createdB !== createdA) return createdB - createdA;

  return (b.views ?? 0) - (a.views ?? 0);
}

/** DB-backed promotion score — Promotions Final Freeze (Owner 0–100 × SCALE). */
export function computeStoredPromotionScore(input: {
  bumpCount?: number;
  bumpedUntil: string | null;
  featuredUntil: string | null;
  lastBumpedAt?: string | null;
  featuredStartedAt?: string | null;
  bumpDurationHours?: number | null;
  featureDurationHours?: number | null;
  now?: Date;
}): number {
  void input.bumpCount;
  return computeTimeDecayPromotionScore({
    bumpedUntil: input.bumpedUntil,
    featuredUntil: input.featuredUntil,
    lastBumpedAt: input.lastBumpedAt,
    featuredStartedAt: input.featuredStartedAt,
    bumpDurationHours: input.bumpDurationHours,
    featureDurationHours: input.featureDurationHours,
    now: input.now,
  });
}
