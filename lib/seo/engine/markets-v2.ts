import { getActiveMarket, MARKET_REGIONS } from "@/lib/seo/markets";
import { getAppUrl } from "@/lib/supabase/env";

export type HreflangAlternate = {
  hreflang: string;
  href: string;
};

/** UK-first. Do not emit hreflang until a second active market exists. */
export function hasAlternateHreflangMarkets(): boolean {
  return MARKET_REGIONS.filter((region) => region.active).length > 1;
}

/**
 * Alternate-market URLs only. UK-only → empty (no fake locale prefixes).
 * Pages must not call this until hasAlternateHreflangMarkets() is true.
 */
export function buildHreflangAlternates(path: string): HreflangAlternate[] {
  if (!hasAlternateHreflangMarkets()) {
    return [];
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = getAppUrl();

  return MARKET_REGIONS.filter((region) => region.active).map((region) => ({
    hreflang: region.locale.replace("_", "-").toLowerCase(),
    href: region.code === "uk" ? `${base}${normalizedPath}` : `${base}/${region.code}${normalizedPath}`,
  }));
}

export function getMarketSeoConfig() {
  const active = getActiveMarket();
  return {
    activeMarket: active.code,
    locale: active.locale,
    currency: active.currency,
    regions: MARKET_REGIONS,
    hreflangReady: hasAlternateHreflangMarkets(),
    regionalDomainsReady: false,
  };
}

export function regionalSitemapPath(regionCode: string): string {
  return regionCode === "uk" ? "/sitemap.xml" : `/sitemap/${regionCode}.xml`;
}
