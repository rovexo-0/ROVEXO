import { getAppUrl } from "@/lib/supabase/env";
import { sitemapIndexUrls } from "@/lib/seo/audit";

/** Google Search Console / Bing Webmaster Tools integration hooks (v1 prep). */
export type SearchConsoleConfig = {
  siteUrl: string;
  sitemapUrls: string[];
  pingEnabled: boolean;
};

export function getSearchConsoleConfig(): SearchConsoleConfig {
  return {
    siteUrl: getAppUrl(),
    sitemapUrls: [ `${getAppUrl()}/sitemap.xml`, ...sitemapIndexUrls() ],
    pingEnabled: process.env.SEO_SITEMAP_PING_ENABLED === "true",
  };
}

export function googleSitemapPingUrl(sitemapUrl: string): string {
  return `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
}

export function bingSitemapPingUrl(sitemapUrl: string): string {
  return `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
}

export async function pingSearchEngineSitemaps(): Promise<{ google?: number; bing?: number }> {
  const config = getSearchConsoleConfig();
  if (!config.pingEnabled) return {};

  const indexUrl = `${config.siteUrl}/sitemap.xml`;
  const results: { google?: number; bing?: number } = {};

  try {
    const [googleRes, bingRes] = await Promise.all([
      fetch(googleSitemapPingUrl(indexUrl), { method: "GET" }),
      fetch(bingSitemapPingUrl(indexUrl), { method: "GET" }),
    ]);
    results.google = googleRes.status;
    results.bing = bingRes.status;
  } catch {
    // Ping is best-effort; indexing still works via robots.txt sitemap declaration.
  }

  return results;
}
