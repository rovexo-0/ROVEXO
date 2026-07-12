import type { PromotionCatalogId } from "@/lib/promotions/catalog";
import type { ResolvedPromotionCatalog, ResolvedPromotionCatalogEntry } from "@/lib/promotions/catalog";

/** Canonical Promotion Tools — the only account-hub promotion surfaces in v1.0. */
export const CANONICAL_PROMOTION_TOOL_IDS = ["bump", "store_featured", "boost"] as const;

export type CanonicalPromotionToolId = (typeof CANONICAL_PROMOTION_TOOL_IDS)[number];

export type BoostPackageTier = {
  id: "7d" | "14d" | "28d";
  label: string;
  days: number;
  priceCents: number;
};

export const BOOST_PACKAGE_TIERS: BoostPackageTier[] = [
  { id: "7d", label: "7 Days", days: 7, priceCents: 1200 },
  { id: "14d", label: "14 Days", days: 14, priceCents: 2200 },
  { id: "28d", label: "28 Days", days: 28, priceCents: 4000 },
];

export function isCanonicalPromotionToolId(id: string): id is CanonicalPromotionToolId {
  return (CANONICAL_PROMOTION_TOOL_IDS as readonly string[]).includes(id);
}

export function getCanonicalPromotionEntries(
  catalog: ResolvedPromotionCatalog,
): ResolvedPromotionCatalogEntry[] {
  return catalog.entries.filter((entry) => isCanonicalPromotionToolId(entry.id));
}

export function resolveBoostPackageTier(id: string): BoostPackageTier | null {
  return BOOST_PACKAGE_TIERS.find((tier) => tier.id === id) ?? null;
}

export function catalogIdForToolSlug(slug: string): PromotionCatalogId | null {
  const map: Record<string, PromotionCatalogId> = {
    bump: "bump",
    "store-featured": "store_featured",
    boost: "boost",
  };
  return map[slug] ?? null;
}
