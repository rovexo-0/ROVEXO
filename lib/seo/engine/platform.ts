/**
 * ROVEXO Organic Growth Platform v4.0 — unified orchestrator (SSOT).
 *
 * Every organic page MUST pass through this pipeline before render/index.
 */
import type { Metadata } from "next";
import type { Product } from "@/lib/products/types";
import type { OrganicLandingPage } from "@/lib/seo/engine/types";
import { classifySearchIntent, applyIntentToDescription, applyIntentToTitle } from "@/lib/seo/engine/intent";
import { generatePageFaq, pageFaqJsonLd } from "@/lib/seo/engine/faq";
import { computeListingFreshness } from "@/lib/seo/engine/freshness";
import { evaluateZeroResults } from "@/lib/seo/engine/zero-results";
import { buildDynamicOgImageUrl } from "@/lib/seo/engine/social";
import { deduplicateProductList, detectDuplicateClusters } from "@/lib/seo/engine/deduplication";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { categoryJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { demandFromProducts, computeSearchDemand } from "@/lib/seo/engine/search-demand";
import { evaluateFacetIndexing } from "@/lib/seo/engine/faceted-seo";
import { computeSeoQualityScore } from "@/lib/seo/engine/quality";
import { evaluateLongTailExpansion } from "@/lib/seo/engine/long-tail-expansion";
import { assignCrawlBudget } from "@/lib/seo/engine/crawl-budget";
import { buildPageLinkGraph } from "@/lib/seo/engine/link-graph";
import {
  buildLinkPrioritiesFromContext,
  optimizeInternalLinks,
} from "@/lib/seo/engine/link-optimizer";
import { safeStructuredDataJson, validateJsonLdGraph } from "@/lib/seo/engine/structured-data";
import type { InternalLinkGroup } from "@/lib/seo/internal-links";
import type { CrawlBudgetAssignment } from "@/lib/seo/engine/crawl-budget";
import type { SeoQualityScore } from "@/lib/seo/engine/quality";
import type { FacetEvaluation } from "@/lib/seo/engine/faceted-seo";
import type { SearchDemandScore } from "@/lib/seo/engine/search-demand";

export type OrganicGrowthPageContext = {
  page: OrganicLandingPage;
  products: Product[];
  total: number;
  metadata: Metadata;
  jsonLd: unknown[];
  faq: ReturnType<typeof generatePageFaq>;
  internalLinks: InternalLinkGroup[];
  demand: SearchDemandScore;
  facet: FacetEvaluation;
  quality: SeoQualityScore;
  crawlBudget: CrawlBudgetAssignment;
  structuredDataValid: boolean;
  indexable: boolean;
};

/** Full v4 organic growth pipeline for any landing page. */
export function buildOrganicGrowthContext(
  page: OrganicLandingPage,
  products: Product[],
  total: number,
): OrganicGrowthPageContext {
  const deduped = deduplicateProductList(products);
  const duplicateClusters = detectDuplicateClusters(deduped);
  const duplicateRisk = duplicateClusters.length / Math.max(1, deduped.length);

  const intent = classifySearchIntent(page);
  const enrichedPage = { ...page, intent };
  const freshness = computeListingFreshness(deduped);
  const demand = computeSearchDemand(demandFromProducts(deduped, total));
  const linkGraph = buildPageLinkGraph({ page: enrichedPage, products: deduped, total });

  const facet = evaluateFacetIndexing({
    page: enrichedPage,
    listingCount: total,
    demand,
    qualityScore: 70,
    duplicateRisk,
    internalLinkCount: linkGraph.linkCount,
  });

  const faq = generatePageFaq(enrichedPage, total);
  const provisionalJsonLd = [
    categoryJsonLd(enrichedPage.title, enrichedPage.search.categorySlugPath ?? [], enrichedPage.description),
    breadcrumbJsonLd(enrichedPage.breadcrumbs),
    pageFaqJsonLd(faq),
  ].filter(Boolean);

  const quality = computeSeoQualityScore({
    page: enrichedPage,
    listingCount: total,
    products: deduped,
    demand,
    facetEvaluation: facet,
    internalLinkCount: linkGraph.linkCount,
    hasStructuredData: provisionalJsonLd.length >= 2,
    duplicateRisk,
  });

  const longTailDecision = evaluateLongTailExpansion({
    page: enrichedPage,
    listingCount: total,
    qualityScore: quality.score,
    demand,
    duplicateRisk,
  });

  const zeroDecision = evaluateZeroResults(enrichedPage, total);
  const structuredDataIssues = validateJsonLdGraph(provisionalJsonLd);
  const structuredDataValid = !structuredDataIssues.some((issue) => issue.severity === "critical");

  const indexable =
    quality.indexable &&
    zeroDecision.indexable &&
    facet.decision === "index" &&
    structuredDataValid &&
    (!longTailDecision.eligible || longTailDecision.indexable);

  const linkPriorities = buildLinkPrioritiesFromContext(linkGraph.groups, demand, quality);
  const internalLinks = optimizeInternalLinks(linkGraph.groups, linkPriorities);

  const title = applyIntentToTitle(enrichedPage.title.replace(/ \| ROVEXO$/, ""), intent);
  const description = applyIntentToDescription(enrichedPage.description, intent, title);
  const canonicalPath =
    facet.decision === "canonical" && facet.canonicalTarget
      ? facet.canonicalTarget
      : longTailDecision.action === "canonical" && enrichedPage.canonicalPath
        ? enrichedPage.canonicalPath
        : enrichedPage.path;

  const metadata = buildPageMetadata({
    title: title.includes("ROVEXO") ? title : `${title} | ROVEXO`,
    description,
    path: canonicalPath,
    imageUrl: buildDynamicOgImageUrl({ title, path: enrichedPage.path }),
    noIndex: !indexable,
  });

  const itemList =
    indexable && deduped.length
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: enrichedPage.title,
          numberOfItems: total,
          itemListElement: deduped.slice(0, 12).map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: product.title,
            url: `/listing/${product.slug}`,
          })),
        }
      : null;

  const jsonLd = safeStructuredDataJson([...provisionalJsonLd, itemList]);
  const validationIssues = validateJsonLdGraph(jsonLd);
  const crawlBudget = assignCrawlBudget({ page: enrichedPage, quality, freshness });

  return {
    page: enrichedPage,
    products: deduped,
    total,
    metadata,
    jsonLd,
    faq,
    internalLinks,
    demand,
    facet,
    quality,
    crawlBudget,
    structuredDataValid: !validationIssues.some((issue) => issue.severity === "critical"),
    indexable,
  };
}

/** @deprecated Use buildOrganicGrowthContext — alias for backwards compatibility. */
export const buildOrganicPageContext = buildOrganicGrowthContext;

export function organicPageNoIndex(total: number, qualityScore = 70): boolean {
  return total < 3 || qualityScore < 55;
}

export type OrganicPageRenderContext = OrganicGrowthPageContext;
