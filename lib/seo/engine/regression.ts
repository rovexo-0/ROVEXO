import { flattenCategoryPaths } from "@/lib/categories/queries";
import { runSeoAudit, sitemapIndexUrls } from "@/lib/seo/audit";
import { resolveCollectionPage, getAllCollectionSlugs } from "@/lib/seo/engine/collections";
import { SEO_ENGINE_VERSION, PERFORMANCE_TARGETS } from "@/lib/seo/engine/config";
import { resolveDiscoveryPage, getStaticDiscoverySlugs } from "@/lib/seo/engine/discovery";
import { isPrivatePath } from "@/lib/seo/engine/index-control";
import { resolveLongTailPage, getLongTailSlugCandidates } from "@/lib/seo/engine/long-tail";
import { buildOrganicGrowthContext } from "@/lib/seo/engine/platform";
import { resolveProgrammaticPage } from "@/lib/seo/programmatic/resolver";
import { validateSitemapConfiguration } from "@/lib/seo/engine/sitemap-engine";
import {
  validateJsonLdGraph,
  buildWebSiteSearchAction,
  hasCriticalStructuredDataErrors,
} from "@/lib/seo/engine/structured-data";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { getAppUrl } from "@/lib/supabase/env";

export type SeoRegressionIssue = {
  id: string;
  severity: "critical" | "warning";
  category: string;
  message: string;
  path?: string;
};

export type SeoRegressionReport = {
  passed: boolean;
  criticalCount: number;
  warningCount: number;
  issues: SeoRegressionIssue[];
  checkedAt: string;
};

export function runSeoRegressionSuite(): SeoRegressionReport {
  const issues: SeoRegressionIssue[] = [];

  // Duplicate titles across category pages
  const titleSet = new Set<string>();
  for (const path of flattenCategoryPaths()) {
    const title = `${path.segments.map((segment) => segment.name).join(" › ")} for Sale UK | ROVEXO`;
    if (titleSet.has(title)) {
      issues.push({
        id: `dup-title-${path.segments.map((s) => s.slug).join("-")}`,
        severity: "critical",
        category: "duplicate_title",
        message: `Duplicate title: ${title}`,
        path: `/category/${path.segments.map((s) => s.slug).join("/")}`,
      });
    }
    titleSet.add(title);
  }

  // Duplicate descriptions across discovery pages
  const descriptionSet = new Set<string>();
  for (const slug of getStaticDiscoverySlugs().slice(0, 50)) {
    const page = resolveDiscoveryPage(slug);
    if (!page) continue;
    if (descriptionSet.has(page.description)) {
      issues.push({
        id: `dup-desc-${slug}`,
        severity: "warning",
        category: "duplicate_description",
        message: `Duplicate description on discovery page: ${slug}`,
        path: page.path,
      });
    }
    descriptionSet.add(page.description);
  }

  // Broken canonical paths on discovery pages
  for (const slug of getStaticDiscoverySlugs().slice(0, 50)) {
    const page = resolveDiscoveryPage(slug);
    if (!page?.path.startsWith("/discover/")) {
      issues.push({
        id: `bad-discover-path-${slug}`,
        severity: "critical",
        category: "broken_canonical",
        message: `Discovery page missing canonical path: ${slug}`,
      });
    }
  }

  // Collection pages resolve
  for (const slug of getAllCollectionSlugs()) {
    const page = resolveCollectionPage(slug);
    if (!page) {
      issues.push({
        id: `missing-collection-${slug}`,
        severity: "critical",
        category: "orphan_page",
        message: `Collection slug does not resolve: ${slug}`,
      });
    }
  }

  // Programmatic browse samples
  const browseSamples = [
    ["cars", "london"],
    ["phones", "apple"],
    ["laptops", "under-500"],
    ["furniture", "used"],
  ];
  for (const segments of browseSamples) {
    const page = resolveProgrammaticPage(segments);
    if (!page) {
      issues.push({
        id: `browse-unresolved-${segments.join("-")}`,
        severity: "warning",
        category: "broken_link",
        message: `Browse page failed to resolve: /browse/${segments.join("/")}`,
        path: `/browse/${segments.join("/")}`,
      });
    }
  }

  // Sitemap engine validation
  const sitemapValidation = validateSitemapConfiguration();
  if (!sitemapValidation.valid) {
    for (const msg of sitemapValidation.issues) {
      issues.push({
        id: `sitemap-${msg.slice(0, 30).replace(/\s+/g, "-")}`,
        severity: "critical",
        category: "sitemap_conflict",
        message: msg,
      });
    }
  }

  if (sitemapIndexUrls().length < 12) {
    issues.push({
      id: "sitemap-segment-count",
      severity: "critical",
      category: "sitemap",
      message: `Expected 12 sitemap segments, found ${sitemapIndexUrls().length}`,
    });
  }

  // Robots conflicts — private paths must not appear indexable
  const privateSamples = ["/account", "/checkout", "/seller", "/admin"];
  for (const path of privateSamples) {
    if (!isPrivatePath(path)) {
      issues.push({
        id: `robots-leak-${path}`,
        severity: "critical",
        category: "robots_conflict",
        message: `Private path not blocked: ${path}`,
        path,
      });
    }
  }

  // Audit score gate
  const audit = runSeoAudit();
  if (audit.score < 80) {
    issues.push({
      id: "audit-score-low",
      severity: "critical",
      category: "sitemap",
      message: `SEO audit score ${audit.score} below minimum 80`,
    });
  }

  // Engine version gate
  if (SEO_ENGINE_VERSION !== "4.0.0") {
    issues.push({
      id: "engine-version",
      severity: "critical",
      category: "sitemap",
      message: `Expected SEO engine v4.0.0, got ${SEO_ENGINE_VERSION}`,
    });
  }

  // Performance targets configured
  if (PERFORMANCE_TARGETS.seo < 95) {
    issues.push({
      id: "performance-target-seo",
      severity: "warning",
      category: "performance",
      message: `SEO performance target below 95: ${PERFORMANCE_TARGETS.seo}`,
    });
  }

  // Structured data validation — WebSite + SearchAction
  const siteSchema = buildWebSiteSearchAction(getAppUrl());
  if (hasCriticalStructuredDataErrors([siteSchema])) {
    issues.push({
      id: "structured-data-website",
      severity: "critical",
      category: "structured_data_failure",
      message: "WebSite/SearchAction structured data has critical errors",
    });
  }

  // Structured data on sample collection page
  const sampleCollection = resolveCollectionPage("best-deals");
  if (sampleCollection) {
    const ctx = buildOrganicGrowthContext(sampleCollection, [], 0);
    if (!ctx.structuredDataValid) {
      issues.push({
        id: "structured-data-collection",
        severity: "critical",
        category: "structured_data_failure",
        message: "Collection page structured data validation failed",
      });
    }
  }

  // Long-tail resolution samples
  for (const slug of getLongTailSlugCandidates(10)) {
    const page = resolveLongTailPage(slug);
    if (!page) {
      issues.push({
        id: `longtail-unresolved-${slug}`,
        severity: "warning",
        category: "orphan_page",
        message: `Long-tail slug failed to resolve: ${slug}`,
      });
    }
  }

  // Quality pipeline — empty inventory must not index
  const collection = resolveCollectionPage("best-deals");
  if (collection) {
    const ctx = buildOrganicGrowthContext(collection, [], 0);
    if (ctx.indexable) {
      issues.push({
        id: "empty-page-indexable",
        severity: "critical",
        category: "robots_conflict",
        message: "Empty collection page marked indexable",
      });
    }
  }

  // Breadcrumb structured data must validate
  const breadcrumbIssues = validateJsonLdGraph([
    breadcrumbJsonLd([
      { name: "Home", href: "/" },
      { name: "Test", href: "/test" },
    ]),
  ]);
  if (breadcrumbIssues.some((issue) => issue.severity === "critical")) {
    issues.push({
      id: "structured-data-breadcrumb",
      severity: "critical",
      category: "structured_data_failure",
      message: "BreadcrumbList structured data validation failed",
    });
  }

  // Orphan prevention — every collection must have breadcrumbs
  for (const slug of getAllCollectionSlugs()) {
    const page = resolveCollectionPage(slug);
    if (page && page.breadcrumbs.length < 2) {
      issues.push({
        id: `orphan-breadcrumbs-${slug}`,
        severity: "warning",
        category: "orphan_page",
        message: `Collection missing breadcrumb trail: ${slug}`,
      });
    }
  }

  const criticalCount = issues.filter((issue) => issue.severity === "critical").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;

  return {
    passed: criticalCount === 0,
    criticalCount,
    warningCount,
    issues,
    checkedAt: new Date().toISOString(),
  };
}
