import { flattenCategoryPaths } from "@/lib/categories/queries";
import { categoryTree } from "@/lib/categories/tree";
import { collectLeafPaths } from "@/lib/categories/navigation";
import { ALL_UK_LOCATIONS } from "@/lib/seo/locations/uk";
import { CATEGORY_ALIASES } from "@/lib/seo/programmatic/aliases";
import { getAppUrl } from "@/lib/supabase/env";

export type SeoAuditIssue = {
  id: string;
  severity: "critical" | "warning" | "info";
  category:
    | "missing_metadata"
    | "duplicate_title"
    | "missing_schema"
    | "broken_link"
    | "missing_alt"
    | "sitemap"
    | "redirect";
  message: string;
  path?: string;
};

export type SeoAuditReport = {
  generatedAt: string;
  score: number;
  issues: SeoAuditIssue[];
  stats: {
    categoryPages: number;
    browsePages: number;
    locationPages: number;
    sitemapSegments: number;
    indexableRoutes: number;
  };
};

export function runSeoAudit(): SeoAuditReport {
  const issues: SeoAuditIssue[] = [];
  const leafPaths = collectLeafPaths(categoryTree);
  const flatPaths = flattenCategoryPaths();
  const browsePages = Object.keys(CATEGORY_ALIASES).length;
  const locationPages = ALL_UK_LOCATIONS.length;
  const sitemapSegments = 8;

  if (categoryTree.length < 50) {
    issues.push({
      id: "taxonomy-primary-count",
      severity: "warning",
      category: "sitemap",
      message: `Primary category count is ${categoryTree.length}; enterprise target is 50–70.`,
    });
  }

  if (leafPaths.length < 1000) {
    issues.push({
      id: "taxonomy-leaf-count",
      severity: "warning",
      category: "sitemap",
      message: `Leaf category count is ${leafPaths.length}; enterprise target is 1,000–2,000.`,
    });
  }

  const titleSet = new Set<string>();
  for (const path of flatPaths) {
    const title = `${path.segments.map((segment) => segment.name).join(" › ")} for Sale UK | ROVEXO`;
    if (titleSet.has(title)) {
      issues.push({
        id: `duplicate-title-${path.segments.map((segment) => segment.slug).join("-")}`,
        severity: "warning",
        category: "duplicate_title",
        message: `Duplicate SEO title detected: ${title}`,
        path: `/category/${path.segments.map((segment) => segment.slug).join("/")}`,
      });
    }
    titleSet.add(title);
  }

  for (const root of categoryTree) {
    if (!root.slug) {
      issues.push({
        id: `missing-slug-${root.id}`,
        severity: "critical",
        category: "missing_metadata",
        message: `Category ${root.name} is missing a slug.`,
      });
    }
  }

  const criticalCount = issues.filter((issue) => issue.severity === "critical").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;
  const score = Math.max(0, Math.min(100, 100 - criticalCount * 15 - Math.min(warningCount, 10) * 2));

  return {
    generatedAt: new Date().toISOString(),
    score,
    issues,
    stats: {
      categoryPages: leafPaths.length,
      browsePages,
      locationPages,
      sitemapSegments,
      indexableRoutes: leafPaths.length + browsePages + locationPages,
    },
  };
}

export function sitemapIndexUrls(): string[] {
  const base = getAppUrl();
  return [
    `${base}/sitemap/static.xml`,
    `${base}/sitemap/categories.xml`,
    `${base}/sitemap/locations.xml`,
    `${base}/sitemap/products.xml`,
    `${base}/sitemap/sellers.xml`,
    `${base}/sitemap/business.xml`,
    `${base}/sitemap/blog.xml`,
    `${base}/sitemap/images.xml`,
  ];
}
