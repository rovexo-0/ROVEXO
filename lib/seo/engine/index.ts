export {
  SEO_ENGINE_VERSION,
  PLATFORM_NAME,
  MIN_INVENTORY_TO_INDEX,
  MIN_INVENTORY_LONG_TAIL,
  MIN_QUALITY_SCORE_TO_INDEX,
  MIN_DEMAND_FOR_LONG_TAIL,
  SITEMAP_CHUNK_SIZE,
  PERFORMANCE_TARGETS,
  isIndexableInventory,
  isIndexableQuality,
  isFullyIndexable,
} from "@/lib/seo/engine/config";

export type {
  BrandPage,
  LocationCategoryPage,
  OrganicLandingPage,
  DiscoveryPage,
  SeoPageKind,
  SeoRedirect,
} from "@/lib/seo/engine/types";

export { isDiscoveryPage } from "@/lib/seo/engine/types";

export type { FacetIndexDecision } from "@/lib/seo/engine/config";

export {
  isPrivatePath,
  robotsForInventory,
  shouldNoIndexDuplicateFilters,
  shouldNoIndexEmptyInventory,
  shouldNoIndexSearchResults,
} from "@/lib/seo/engine/index-control";

/** v4 unified platform orchestrator */
export {
  buildOrganicGrowthContext,
  buildOrganicPageContext,
  organicPageNoIndex,
  type OrganicGrowthPageContext,
  type OrganicPageRenderContext,
} from "@/lib/seo/engine/platform";

export {
  getStaticDiscoverySlugs,
  isDiscoverySlug,
  resolveDiscoveryPage,
} from "@/lib/seo/engine/discovery";

export {
  getAllCollectionSlugs,
  getCollectionDefinitions,
  resolveCollectionPage,
} from "@/lib/seo/engine/collections";

export {
  detectTrendSignals,
  getActiveTrendSlugs,
  isTrendExpired,
  resolveTrendPage,
} from "@/lib/seo/engine/trends";

export { resolveLongTailPage, getLongTailSlugCandidates } from "@/lib/seo/engine/long-tail";

export {
  classifySearchIntent,
  applyIntentToDescription,
  applyIntentToTitle,
  intentMetadataHints,
} from "@/lib/seo/engine/intent";

export { generatePageFaq, pageFaqJsonLd } from "@/lib/seo/engine/faq";
export { computeListingFreshness, freshnessChangeFrequency, freshnessPriorityBoost } from "@/lib/seo/engine/freshness";
export { computeSearchDemand, demandFromProducts, meetsDemandThreshold, detectHighFrequencySearches, detectEmergingEntities } from "@/lib/seo/engine/search-demand";
export { evaluateFacetIndexing, evaluateSearchFacetDecision } from "@/lib/seo/engine/faceted-seo";
export { computeSeoQualityScore, computeIndexQualityScore } from "@/lib/seo/engine/index-quality";
export { assignCrawlBudget, estimateSitemapChunks, sitemapChunkId } from "@/lib/seo/engine/crawl-budget";
export { computeIndexPriority } from "@/lib/seo/engine/priority";
export { detectDuplicateClusters, deduplicateProductList } from "@/lib/seo/engine/deduplication";
export { evaluateZeroResults } from "@/lib/seo/engine/zero-results";
export { buildPageLinkGraph, ensureNoOrphanLinks } from "@/lib/seo/engine/link-graph";
export { optimizeInternalLinks, buildLinkPrioritiesFromContext, scoreLinkTarget } from "@/lib/seo/engine/link-optimizer";
export { evaluateLongTailExpansion } from "@/lib/seo/engine/long-tail-expansion";
export { runOrganicGrowthOptimization, applyOptimizedLinks } from "@/lib/seo/engine/optimizer";
export { validateSitemapConfiguration, splitSitemapUrls, sitemapChunkFilename } from "@/lib/seo/engine/sitemap-engine";
export { buildPageEntityGraph, graphInternalLinks, entityId } from "@/lib/seo/engine/entity-graph";
export {
  validateJsonLdGraph,
  buildProductStructuredData,
  buildWebSiteSearchAction,
  assertStructuredDataValid,
  hasCriticalStructuredDataErrors,
  safeStructuredDataJson,
} from "@/lib/seo/engine/structured-data";
export { buildProductImageSeo, buildListingGalleryImageSeo, imageSitemapEntry } from "@/lib/seo/engine/image-seo";
export { buildSeoAnalyticsSnapshot } from "@/lib/seo/engine/analytics";
export { buildSeoHealthCenterReport, type SeoHealthCenterReport } from "@/lib/seo/engine/health-center";
export { runSeoRegressionSuite } from "@/lib/seo/engine/regression";

export {
  buildBrandPage,
  fetchBrandBySlug,
  fetchBrandsWithListings,
  resolveBrandPage,
} from "@/lib/seo/engine/brands";

export {
  brandPageMetadata,
  browsePageCanonicalPath,
  browsePageMetadata,
  discoveryPageMetadata,
  locationCategoryMetadata,
  productPageMetadata,
  sellerPageMetadata,
  storePageMetadata,
} from "@/lib/seo/engine/metadata";

export {
  brandPageJsonLd,
  discoveryPageJsonLd,
  productImageAlt,
  productImageTitle,
  sellerProfilePageJsonLd,
  storePageJsonLd,
} from "@/lib/seo/engine/json-ld";

export {
  getLocationCategoryStaticParams,
  resolveLocationCategoryPage,
  resolveLocationFirstRewrite,
  shouldRewriteToDiscover,
} from "@/lib/seo/engine/routing";

export {
  brandPageLinkGroups,
  discoveryPageLinkGroups,
  productDetailLinkGroups,
  storePageLinkGroups,
} from "@/lib/seo/engine/internal-linking";

export { getSeoRedirect, invalidateSeoRedirectCache, listSeoRedirects } from "@/lib/seo/engine/redirects";

export {
  bingSitemapPingUrl,
  getSearchConsoleConfig,
  googleSitemapPingUrl,
  pingSearchEngineSitemaps,
} from "@/lib/seo/engine/search-console";

export {
  buildDynamicOgImageUrl,
  buildSocialPreviews,
  deepLinkUrl,
  nativeShareMetadata,
  platformShareLink,
  qrCodeUrl,
} from "@/lib/seo/engine/social";

export {
  fetchProductReviews,
  fetchSellerReviews,
  productReviewJsonLd,
  sellerAggregateRatingJsonLd,
} from "@/lib/seo/engine/ugc-seo";

export { buildHreflangAlternates, getMarketSeoConfig, regionalSitemapPath } from "@/lib/seo/engine/markets-v2";
