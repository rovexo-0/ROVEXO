import { getActiveMarket, MARKET_REGIONS } from "@/lib/seo/markets";
import { getAppUrl } from "@/lib/supabase/env";

export type HreflangAlternate = {
  hreflang: string;
  href: string;
};

/** Multi-market SEO scaffolding — UK active; others prepared for future launch. */
export function buildHreflangAlternates(path: string): HreflangAlternate[] {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = getAppUrl();

  return MARKET_REGIONS.filter((region) => region.active || region.code === "uk").map((region) => ({
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
    hreflangReady: true,
    regionalDomainsReady: false,
  };
}

export function regionalSitemapPath(regionCode: string): string {
  return regionCode === "uk" ? "/sitemap.xml" : `/sitemap/${regionCode}.xml`;
}
