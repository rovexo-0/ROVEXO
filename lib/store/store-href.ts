/**
 * ROVEXO Store href helpers — client-safe SSOT (no server imports).
 *
 * PRODUCT.seller_id → store_id → store_slug → /store/...
 */

import {
  isSafeRouteSegment,
  isValidHomepageStoreHref,
} from "@/lib/homepage/homepage-final-freeze-v1";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isStoreId(value: string | null | undefined): boolean {
  return Boolean(value && UUID_RE.test(value.trim()));
}

export function isStoreSlug(value: string | null | undefined): boolean {
  return isSafeRouteSegment(value) && !isStoreId(value);
}

/**
 * Canonical store href from product chain:
 * seller_id → store_id → store_slug (when present) → /store/...
 */
export function resolveStoreHrefFromSeller(input: {
  sellerId?: string | null;
  storeSlug?: string | null;
}): string | null {
  const sellerId = input.sellerId?.trim() || null;
  const slug = input.storeSlug?.trim().toLowerCase() || null;

  if (slug && isStoreSlug(slug)) {
    const href = `/store/${slug}`;
    return isValidHomepageStoreHref(href) ? href : null;
  }

  if (sellerId && isStoreId(sellerId)) {
    const href = `/store/${sellerId}`;
    return isValidHomepageStoreHref(href) ? href : null;
  }

  return null;
}
