/**
 * ROVEXO Preferred Marketplace Stores Engine v1.0
 *
 * STATUS: CANONICAL SSOT · SUPER-ADMIN ONLY CONFIG
 *
 * A Preferred Store is a normal seller with configurable homepage slot privileges.
 * Never expose Admin / Platform / Official badges to buyers.
 * Never hardcode seller emails in Homepage.
 */
import type { Product } from "@/lib/products/types";

export const PREFERRED_MARKETPLACE_STORES_ENGINE_V1 = {
  id: "preferred-marketplace-stores-engine-v1",
  version: "1.0.0",
  status: "CANONICAL",
  table: "preferred_marketplace_stores",
  superAdminRoute: "/super-admin/preferred-marketplace-stores",
  api: "/api/super-admin/preferred-marketplace-stores",
  defaults: {
    minPosition: 10,
    maxPosition: 15,
    maxSimultaneousListings: 1,
    promotionPriority: 100,
    homepageVisibility: true,
    enabled: true,
  },
  forbiddenUiLabels: [
    "Admin",
    "Platform",
    "Official",
    "Owner",
    "Internal",
    "Preferred",
    "Promoted Store",
  ] as const,
  equation:
    "PREFERRED_STORE = NORMAL_SELLER + HOMEPAGE_SLOT_CONFIG · ZERO_SPECIAL_BUYER_UI",
} as const;

export type PreferredMarketplaceStoreConfig = {
  id: string;
  sellerId: string;
  sellerEmail?: string | null;
  sellerUsername?: string | null;
  sellerName?: string | null;
  enabled: boolean;
  homepageVisibility: boolean;
  promotionPriority: number;
  /** 1-based homepage feed position (inclusive). */
  minPosition: number;
  /** 1-based homepage feed position (inclusive). */
  maxPosition: number;
  startAt: string | null;
  endAt: string | null;
  maxSimultaneousListings: number;
  createdAt: string;
  updatedAt: string;
};

export type PreferredMarketplaceStoreInput = {
  sellerId: string;
  enabled?: boolean;
  homepageVisibility?: boolean;
  promotionPriority?: number;
  minPosition?: number;
  maxPosition?: number;
  startAt?: string | null;
  endAt?: string | null;
  maxSimultaneousListings?: number;
};

export function isPreferredStoreActiveNow(
  store: Pick<
    PreferredMarketplaceStoreConfig,
    "enabled" | "homepageVisibility" | "startAt" | "endAt"
  >,
  now = new Date(),
): boolean {
  if (!store.enabled || !store.homepageVisibility) return false;
  const ts = now.getTime();
  if (store.startAt) {
    const start = Date.parse(store.startAt);
    if (Number.isFinite(start) && ts < start) return false;
  }
  if (store.endAt) {
    const end = Date.parse(store.endAt);
    if (Number.isFinite(end) && ts > end) return false;
  }
  return true;
}

/**
 * Inject preferred-store listings into a ranked homepage feed.
 * - At most one listing per preferred store (capped by maxSimultaneousListings).
 * - Position clamped into each store's [minPosition, maxPosition] (1-based).
 * - Remaining order preserved from the existing ranking algorithm.
 * - No special badges / labels on products.
 */
export function injectPreferredMarketplaceStoreSlots(
  rankedItems: Product[],
  stores: PreferredMarketplaceStoreConfig[],
  now = new Date(),
): Product[] {
  if (rankedItems.length === 0 || stores.length === 0) return rankedItems;

  const active = stores
    .filter((store) => isPreferredStoreActiveNow(store, now))
    .sort((a, b) => b.promotionPriority - a.promotionPriority || a.minPosition - b.minPosition);

  if (active.length === 0) return rankedItems;

  const working = [...rankedItems];
  const placedIds = new Set<string>();

  for (const store of active) {
    const maxListings = Math.max(1, store.maxSimultaneousListings);
    const candidates = working.filter(
      (product) =>
        product.sellerId === store.sellerId &&
        !placedIds.has(product.id),
    );
    if (candidates.length === 0) continue;

    const pick = candidates.slice(0, maxListings);
    for (const listing of pick) {
      const fromIndex = working.findIndex((item) => item.id === listing.id);
      if (fromIndex < 0) continue;
      working.splice(fromIndex, 1);

      const minIdx = Math.max(0, store.minPosition - 1);
      const maxIdx = Math.max(minIdx, store.maxPosition - 1);
      const target = Math.min(maxIdx, Math.max(minIdx, working.length));
      working.splice(target, 0, listing);
      placedIds.add(listing.id);
    }
  }

  return working;
}
