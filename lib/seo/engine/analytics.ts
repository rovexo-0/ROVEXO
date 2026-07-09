import { runSeoAudit, sitemapIndexUrls } from "@/lib/seo/audit";
import { getAllCollectionSlugs } from "@/lib/seo/engine/collections";
import { getStaticDiscoverySlugs } from "@/lib/seo/engine/discovery";
import { SEO_ENGINE_VERSION } from "@/lib/seo/engine/config";
import { detectTrendSignals } from "@/lib/seo/engine/trends";
import { flattenCategoryPaths } from "@/lib/categories/queries";
import { CATEGORY_ALIASES } from "@/lib/seo/programmatic/aliases";

export type SeoAnalyticsSnapshot = {
  engineVersion: string;
  generatedAt: string;
  auditScore: number;
  indexedPagesEstimate: number;
  sitemapSegments: number;
  sitemapUrls: number;
  categoryPages: number;
  browseAliases: number;
  discoveryPages: number;
  collectionPages: number;
  trendPages: number;
  structuredDataHealth: "healthy" | "warning" | "critical";
  sitemapHealth: "healthy" | "warning" | "critical";
  topCategories: { name: string; path: string }[];
  topBrands: { name: string; slug: string }[];
  crawlStats: {
    sitemapSegmentCount: number;
    estimatedIndexableRoutes: number;
  };
};

export async function buildSeoAnalyticsSnapshot(): Promise<SeoAnalyticsSnapshot> {
  const audit = runSeoAudit();
  const trends = await detectTrendSignals(20);
  const leafPaths = flattenCategoryPaths();

  const topCategories = leafPaths.slice(0, 10).map((path) => ({
    name: path.segments.map((segment) => segment.name).join(" › "),
    path: `/category/${path.segments.map((segment) => segment.slug).join("/")}`,
  }));

  const topBrands = trends
    .filter((signal) => signal.type === "brand")
    .slice(0, 10)
    .map((signal) => ({ name: signal.label, slug: signal.slug }));

  const discoveryPages = getStaticDiscoverySlugs().length;
  const collectionPages = getAllCollectionSlugs().length;
  const trendPages = trends.length;

  const indexedPagesEstimate =
    audit.stats.categoryPages +
    audit.stats.browsePages +
    audit.stats.locationPages +
    discoveryPages +
    collectionPages +
    trendPages;

  return {
    engineVersion: SEO_ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    auditScore: audit.score,
    indexedPagesEstimate,
    sitemapSegments: audit.stats.sitemapSegments,
    sitemapUrls: sitemapIndexUrls().length,
    categoryPages: audit.stats.categoryPages,
    browseAliases: Object.keys(CATEGORY_ALIASES).length,
    discoveryPages,
    collectionPages,
    trendPages,
    structuredDataHealth: audit.score >= 80 ? "healthy" : audit.score >= 60 ? "warning" : "critical",
    sitemapHealth: sitemapIndexUrls().length >= 12 ? "healthy" : "warning",
    topCategories,
    topBrands,
    crawlStats: {
      sitemapSegmentCount: audit.stats.sitemapSegments,
      estimatedIndexableRoutes: indexedPagesEstimate,
    },
  };
}
