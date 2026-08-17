/**
 * ROVEXO SEO SSOT v1.0 — Phase 3 contract registry.
 *
 * Not a second engine. Re-exports the existing canonical implementations.
 * Specialized builders remain in their files and must call these contracts.
 */

export {
  absoluteCanonicalFromPath,
  canonicalForBrand,
  canonicalForCategory,
  canonicalForHomepage,
  canonicalForListing,
  canonicalForLocation,
  canonicalForSeller,
  canonicalForStore,
  resolveSeoCanonical,
} from "@/lib/seo/engine/canonical";

export { buildPageMetadata } from "@/lib/seo/metadata";

export {
  evaluateListingSeoEligibility,
  evaluateSeoEligibility,
} from "@/lib/seo/engine/eligibility";

export { filterSitemapEntries, isSitemapPathEligible } from "@/lib/seo/sitemaps/eligibility-filter";

export {
  breadcrumbJsonLd,
  businessStoreJsonLd,
  categoryJsonLd,
  localBusinessJsonLd,
  productJsonLd,
} from "@/lib/seo/json-ld";

export type { InternalLinkGroup } from "@/lib/seo/internal-links";
export {
  homepageSeoLinkGroups,
  popularBrowseLinks,
  relatedCategoryLinks,
  sellerListingLinks,
  similarListingLinks,
} from "@/lib/seo/internal-links";

export { getActiveMarket, MARKET_REGIONS } from "@/lib/seo/markets";
export { buildHreflangAlternates, hasAlternateHreflangMarkets } from "@/lib/seo/engine/markets-v2";

export {
  classifyTaxonomyDepth,
  deriveBrandSeo,
  deriveCategorySeo,
  deriveListingSeo,
  deriveLocationSeo,
  deriveProgrammaticSeo,
  deriveStoreSeo,
  uniqueCanonicalUrls,
  MARKETPLACE_SEO_ENGINE_V1,
} from "@/lib/seo/marketplace-engine-v1";

export {
  ORGANIC_SEO_GROWTH_ENGINE_V1,
  ORGANIC_SEO_THRESHOLDS_V1,
  ORGANIC_FUNNEL_EVENT_MAP,
  aggregateLandingPagePerformance,
  attributeOrganicJourney,
  buildMerchantFeed,
  buildMerchantFeedItem,
  canApplySeoExperiment,
  detectSeoOpportunities,
  evaluatePageEligibilityForGrowth,
  isOrganicAcquisition,
  loadOrganicSearchPerformance,
  normalizeSearchPerformanceRecord,
  resolveGoogleSearchConsoleConnection,
  validateSeoExperiment,
} from "@/lib/seo/organic-growth-engine-v1";

export const SEO_SSOT_V1 = {
  version: "1.0",
  canonical: "lib/seo/engine/canonical.ts#resolveSeoCanonical",
  metadata: "lib/seo/metadata.ts#buildPageMetadata",
  jsonLdListingRuntime: "lib/seo/json-ld.ts#productJsonLd",
  jsonLdValidation: "lib/seo/engine/structured-data.ts#validateJsonLdGraph",
  eligibility: "lib/seo/engine/eligibility.ts#evaluateSeoEligibility",
  sitemapGate: "lib/seo/sitemaps/eligibility-filter.ts#filterSitemapEntries",
  internalLinks: "lib/seo/internal-links.ts#InternalLinkGroup",
  markets: "lib/seo/markets.ts",
  marketplaceEngine: "lib/seo/marketplace-engine-v1.ts",
  organicGrowth: "lib/seo/organic-growth-engine-v1.ts",
} as const;
