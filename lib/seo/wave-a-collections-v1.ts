/**
 * P12 Wave A — Featured / evergreen collections (existing engine slugs only).
 * No new collection system — allowlist + link helpers.
 */

import type { CanonicalRootSlug } from "@/lib/categories/canonical-root-categories-v1";
import type { InternalLinkGroup } from "@/lib/seo/internal-links";
import { getCollectionDefinitions } from "@/lib/seo/engine/collections";

/** Wave A index-priority collection slugs (must exist in collections engine). */
export const WAVE_A_COLLECTION_SLUGS = [
  "newly-listed",
  "best-deals",
  "trending-this-week",
  "verified-sellers",
  "premium-listings",
  "under-50",
  "under-100",
  "electronics-deals",
  "gift-collections",
  "editors-picks",
] as const;

export type WaveACollectionSlug = (typeof WAVE_A_COLLECTION_SLUGS)[number];

const ROOT_COLLECTION_MAP: Partial<Record<CanonicalRootSlug, readonly WaveACollectionSlug[]>> = {
  "womens-fashion": ["newly-listed", "best-deals", "trending-this-week", "gift-collections", "under-50"],
  "mens-fashion": ["newly-listed", "best-deals", "trending-this-week", "under-50", "editors-picks"],
  jewellery: ["premium-listings", "editors-picks", "gift-collections", "verified-sellers", "best-deals"],
  "kids-fashion": ["newly-listed", "best-deals", "under-50", "gift-collections", "trending-this-week"],
  "home-garden": ["newly-listed", "best-deals", "under-100", "editors-picks", "trending-this-week"],
  electronics: ["electronics-deals", "newly-listed", "best-deals", "premium-listings", "verified-sellers"],
  books: ["newly-listed", "best-deals", "under-50", "editors-picks", "trending-this-week"],
  collectibles: ["editors-picks", "premium-listings", "newly-listed", "verified-sellers", "best-deals"],
  sports: ["newly-listed", "best-deals", "trending-this-week", "under-100", "verified-sellers"],
  "vehicle-parts": ["newly-listed", "best-deals", "verified-sellers", "under-100", "trending-this-week"],
};

export function isWaveACollectionSlug(slug: string): slug is WaveACollectionSlug {
  return (WAVE_A_COLLECTION_SLUGS as readonly string[]).includes(slug);
}

export function getWaveACollectionDefinitions() {
  const allow = new Set<string>(WAVE_A_COLLECTION_SLUGS);
  return getCollectionDefinitions().filter((entry) => allow.has(entry.slug));
}

export function waveACollectionLinksForCategory(
  rootSlug: CanonicalRootSlug,
  limit = 5,
): InternalLinkGroup {
  const slugs = ROOT_COLLECTION_MAP[rootSlug] ?? WAVE_A_COLLECTION_SLUGS.slice(0, limit);
  const defs = getCollectionDefinitions();
  const links = slugs
    .slice(0, limit)
    .map((slug) => {
      const def = defs.find((entry) => entry.slug === slug);
      if (!def) return null;
      return { label: def.title.replace(/\s+on ROVEXO$/i, ""), href: `/collections/${def.slug}` };
    })
    .filter((link): link is { label: string; href: string } => Boolean(link));

  return { title: "Featured collections", links };
}

export function waveAFeaturedCollectionLinks(limit = 5): InternalLinkGroup {
  const defs = getWaveACollectionDefinitions().slice(0, limit);
  return {
    title: "Featured collections",
    links: defs.map((def) => ({
      label: def.title.replace(/\s+on ROVEXO$/i, ""),
      href: `/collections/${def.slug}`,
    })),
  };
}
