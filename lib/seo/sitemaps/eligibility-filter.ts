/**
 * Phase 1 — Indexation Safety.
 * Sitemap emission gate. Reuses Wave 0 `evaluateSeoEligibility` only.
 * Not a second eligibility engine. Not a robots rewrite.
 */

import {
  evaluateListingSeoEligibility,
  evaluateSeoEligibility,
  type SeoEligibilityPageType,
} from "@/lib/seo/engine/eligibility";
import { isSeoIndexExcludedPath } from "@/lib/seo/engine/protection";
import { AUTH_PROTECTED_PREFIXES, AUTH_PUBLIC_PREFIXES } from "@/lib/auth/protected-routes";
import { isForbiddenMarketplaceSlug } from "@/lib/listings/forbidden-marketplace-inventory";
import type { ProductStatus } from "@/lib/supabase/types/database";

export type SitemapEligibilitySignals = {
  pageType?: SeoEligibilityPageType;
  listingCount?: number;
  productFound?: boolean;
  productStatus?: ProductStatus | null;
  softUnavailable?: boolean;
};

/** Extra robots.txt Disallow prefixes that are not AUTH_PROTECTED_PREFIXES. */
const ROBOTS_EXTRA_DISALLOW = ["/api/", "/staff/", "/auctions"] as const;

export function pathFromSitemapUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname || "/";
    return path === "" ? "/" : path;
  } catch {
    if (!url) return "/";
    return url.startsWith("/") ? url : `/${url}`;
  }
}

export function sitemapPageTypeForPath(path: string): SeoEligibilityPageType {
  const normalized = path === "" ? "/" : path;
  if (normalized === "/") return "homepage";
  if (normalized === "/search" || normalized.startsWith("/search/")) return "search";
  if (normalized.startsWith("/listing/")) return "product";
  if (normalized.startsWith("/category/")) return "category";
  if (normalized.startsWith("/browse/")) return "browse";
  if (normalized.startsWith("/brand/")) return "brand";
  if (normalized.startsWith("/store/")) return "store";
  if (normalized.startsWith("/user/")) return "seller";
  if (normalized.startsWith("/discover/")) return "discovery";
  if (normalized.startsWith("/collections/")) return "collection";
  if (normalized.startsWith("/trends/")) return "trend";
  if (normalized.startsWith("/l/")) {
    const rest = normalized.slice(3).split("/").filter(Boolean);
    return rest.length > 1 ? "location-category" : "location";
  }
  if (normalized.startsWith("/api")) return "api";
  if (AUTH_PUBLIC_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))) {
    return "auth";
  }
  if (isSeoIndexExcludedPath(normalized)) return "private";
  return "static";
}

/**
 * Mirrors `app/robots.ts` Disallow policy for sitemap exclusion only.
 * Does not change robots.txt.
 */
export function isBlockedByExistingRobotsPolicy(path: string): boolean {
  const normalized = path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;

  for (const prefix of AUTH_PROTECTED_PREFIXES) {
    const withSlash = prefix.endsWith("/") ? prefix : `${prefix}/`;
    if (normalized === prefix || normalized === withSlash.slice(0, -1) || normalized.startsWith(withSlash)) {
      return true;
    }
  }

  for (const prefix of AUTH_PUBLIC_PREFIXES) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return true;
    }
  }

  for (const prefix of ROBOTS_EXTRA_DISALLOW) {
    if (normalized === prefix.slice(0, -1) || normalized.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

export function isSitemapPathEligible(path: string, signals: SitemapEligibilitySignals = {}): boolean {
  try {
    if (isBlockedByExistingRobotsPolicy(path)) {
      return false;
    }

    const pageType = signals.pageType ?? sitemapPageTypeForPath(path);

    if (pageType === "product") {
      const slug = path.replace(/^\/listing\//, "").split("/")[0] ?? "";
      if (!slug) return false;
      if (isForbiddenMarketplaceSlug(slug)) return false;
      if (signals.productFound === false || signals.softUnavailable) {
        return false;
      }
      const listing = evaluateListingSeoEligibility({
        slug,
        productFound: true,
        status: signals.productStatus ?? "published",
      });
      return listing.eligible && listing.sitemapEligible && listing.indexation === "INDEX";
    }

    const result = evaluateSeoEligibility({
      pageType,
      path,
      listingCount: signals.listingCount,
      productFound: signals.productFound,
      productStatus: signals.productStatus,
      softUnavailable: signals.softUnavailable,
    });

    return result.eligible && result.sitemapEligible && result.indexation === "INDEX";
  } catch {
    return false;
  }
}

export function filterSitemapEntries<T extends { url: string }>(
  entries: T[],
  signalsFor?: (entry: T, path: string) => SitemapEligibilitySignals | undefined,
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];

  for (const entry of entries) {
    if (!entry.url || seen.has(entry.url)) continue;
    const path = pathFromSitemapUrl(entry.url);
    const signals = signalsFor?.(entry, path);
    if (!isSitemapPathEligible(path, signals)) continue;
    seen.add(entry.url);
    out.push(entry);
  }

  return out;
}
