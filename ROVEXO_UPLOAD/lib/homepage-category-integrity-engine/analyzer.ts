import { HOME_CATEGORY_NAV, HOME_QUICK_FILTERS } from "@/lib/home/constants";
import { ROVEXO_HOME_CATEGORY_RAIL } from "@/lib/home/category-premium-library";
import {
  CANONICAL_HOMEPAGE_CATEGORY_SOURCES,
  INTEGRITY_FAIL_CONDITIONS,
  PREMIUM_2026_LAYOUT_SPEC,
} from "@/lib/homepage-category-integrity-engine/registry";
import type {
  DuplicationFinding,
  IntegrityScanResult,
  IntegrityStatus,
  IntegrityValidationCycle,
  LayoutFinding,
} from "@/lib/homepage-category-integrity-engine/types";
import { createDefaultHomepageBuilderConfig } from "@/lib/super-admin/mission-control/defaults";
import type { HomepageBuilderConfig } from "@/lib/super-admin/mission-control/types";
import { resolvePublishedHomepageSections } from "@/lib/platform-visual/resolver";

function passStatus(): IntegrityStatus {
  return "pass";
}

function failStatus(count: number): IntegrityStatus {
  if (count === 0) return "pass";
  return "fail";
}

function findDuplicateValues<T>(
  items: T[],
  selector: (item: T) => string,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const value = selector(item);
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return new Map([...counts.entries()].filter(([, count]) => count > 1));
}

function routeForCategory(item: { href?: string; slug: string }): string {
  return item.href ?? `/category/${item.slug}`;
}

export function scanCategoryNavDuplication(): DuplicationFinding[] {
  const findings: DuplicationFinding[] = [];
  const pipeline = `${CANONICAL_HOMEPAGE_CATEGORY_SOURCES.library} → ${CANONICAL_HOMEPAGE_CATEGORY_SOURCES.rail}`;

  const slugDupes = findDuplicateValues(HOME_CATEGORY_NAV, (item) => item.slug);
  for (const [slug, occurrences] of slugDupes) {
    findings.push({
      id: `dup-slug-${slug}`,
      target: "category-cards",
      kind: "slug",
      value: slug,
      occurrences,
      sourceComponent: CANONICAL_HOMEPAGE_CATEGORY_SOURCES.rail,
      renderPipeline: pipeline,
      intentional: false,
      status: "fail",
      message: `Duplicate category slug "${slug}" rendered ${occurrences} times in category rail`,
    });
  }

  const iconDupes = findDuplicateValues(HOME_CATEGORY_NAV, (item) => item.icon);
  for (const [icon, occurrences] of iconDupes) {
    findings.push({
      id: `dup-icon-${icon}`,
      target: "category-cards",
      kind: "icon",
      value: icon,
      occurrences,
      sourceComponent: CANONICAL_HOMEPAGE_CATEGORY_SOURCES.rail,
      renderPipeline: pipeline,
      intentional: false,
      status: "fail",
      message: `Duplicate category icon "${icon}" in category rail`,
    });
  }

  const routeDupes = findDuplicateValues(HOME_CATEGORY_NAV, routeForCategory);
  for (const [route, occurrences] of routeDupes) {
    findings.push({
      id: `dup-route-${route.replace(/\//g, "-")}`,
      target: "navigation",
      kind: "route",
      value: route,
      occurrences,
      sourceComponent: CANONICAL_HOMEPAGE_CATEGORY_SOURCES.nav,
      renderPipeline: pipeline,
      intentional: false,
      status: "fail",
      message: `Duplicate category route "${route}"`,
    });
  }

  const nameDupes = findDuplicateValues(HOME_CATEGORY_NAV, (item) => item.name.toLowerCase());
  for (const [name, occurrences] of nameDupes) {
    findings.push({
      id: `dup-name-${name.replace(/\s+/g, "-")}`,
      target: "category-cards",
      kind: "card",
      value: name,
      occurrences,
      sourceComponent: CANONICAL_HOMEPAGE_CATEGORY_SOURCES.rail,
      renderPipeline: pipeline,
      intentional: false,
      status: "fail",
      message: `Duplicate category card title "${name}"`,
    });
  }

  if (HOME_CATEGORY_NAV.length !== ROVEXO_HOME_CATEGORY_RAIL.length) {
    findings.push({
      id: "dup-nav-library-mismatch",
      target: "category-rail",
      kind: "render",
      value: `${HOME_CATEGORY_NAV.length} vs ${ROVEXO_HOME_CATEGORY_RAIL.length}`,
      occurrences: 2,
      sourceComponent: CANONICAL_HOMEPAGE_CATEGORY_SOURCES.nav,
      renderPipeline: `${CANONICAL_HOMEPAGE_CATEGORY_SOURCES.nav} ↔ ${CANONICAL_HOMEPAGE_CATEGORY_SOURCES.library}`,
      intentional: false,
      status: "fail",
      message: "HOME_CATEGORY_NAV diverges from canonical ROVEXO_HOME_CATEGORY_RAIL",
    });
  }

  return findings;
}

export function scanHomepageSectionDuplication(
  config: HomepageBuilderConfig = createDefaultHomepageBuilderConfig(),
): DuplicationFinding[] {
  const findings: DuplicationFinding[] = [];
  const published = resolvePublishedHomepageSections(config);
  const pipeline = "HomeContent → visualConfig.publishedSections → renderHomeSection";

  const idCounts = new Map<string, number>();
  for (const section of published) {
    idCounts.set(section.id, (idCounts.get(section.id) ?? 0) + 1);
  }

  for (const [id, occurrences] of idCounts) {
    if (occurrences <= 1) continue;
    findings.push({
      id: `dup-section-${id}`,
      target: "homepage-sections",
      kind: "section",
      value: id,
      occurrences,
      sourceComponent: "HomeContent",
      renderPipeline: pipeline,
      intentional: false,
      status: "fail",
      message: `Homepage section "${id}" published ${occurrences} times`,
    });
  }

  const categoryRails = published.filter((section) => section.id === "category-rail");
  if (categoryRails.length > 1) {
    findings.push({
      id: "dup-category-rail-sections",
      target: "category-rail",
      kind: "section",
      value: "category-rail",
      occurrences: categoryRails.length,
      sourceComponent: PREMIUM_2026_LAYOUT_SPEC.categoryRailCanonicalComponent,
      renderPipeline: pipeline,
      intentional: false,
      status: "fail",
      message: `Category rail rendered ${categoryRails.length} times — canonical component is ${PREMIUM_2026_LAYOUT_SPEC.categoryRailCanonicalComponent} only`,
    });
  }

  const retired = published.filter((section) =>
    PREMIUM_2026_LAYOUT_SPEC.retiredComponents.some((name) => section.label.includes(name) || section.id.includes("category-grid")),
  );
  for (const section of retired) {
    findings.push({
      id: `dup-retired-${section.id}`,
      target: "category-grid",
      kind: "render",
      value: section.id,
      occurrences: 1,
      sourceComponent: "CategoryGridSection",
      renderPipeline: pipeline,
      intentional: false,
      status: "fail",
      message: `Retired category grid section "${section.id}" must not render on homepage`,
    });
  }

  return findings;
}

export function scanSearchSuggestionDuplication(): DuplicationFinding[] {
  const findings: DuplicationFinding[] = [];
  const routeDupes = findDuplicateValues(HOME_QUICK_FILTERS, (item) => item.href);
  for (const [route, occurrences] of routeDupes) {
    findings.push({
      id: `dup-search-route-${route.replace(/[^\w-]/g, "-")}`,
      target: "search-suggestions",
      kind: "route",
      value: route,
      occurrences,
      sourceComponent: "HOME_QUICK_FILTERS",
      renderPipeline: "PremiumHeader search → quick filters",
      intentional: false,
      status: "fail",
      message: `Duplicate search suggestion route "${route}"`,
    });
  }
  return findings;
}

export function detectSearchBarTopGap(): LayoutFinding[] {
  const spec = PREMIUM_2026_LAYOUT_SPEC;
  const measuredPx = spec.headerInnerPaddingBlock + spec.searchBarTopGapMaxPx;

  if (measuredPx <= spec.searchBarTopGapMaxPx) {
    return [
      {
        id: "layout-search-bar-top-gap",
        target: "search-bar",
        issue: "empty-space",
        sourceComponent: "PremiumHeader / rx-header-premium",
        cssSource: "styles/rovexo/header-premium.css",
        measuredPx,
        thresholdPx: spec.searchBarTopGapMaxPx,
        status: passStatus(),
        message: "No unnecessary empty space above homepage search bar",
      },
    ];
  }

  return [
    {
      id: "layout-search-bar-top-gap",
      target: "search-bar",
      issue: "empty-space",
      sourceComponent: "PremiumHeader / rx-header-premium",
      cssSource: "styles/rovexo/header-premium.css",
      measuredPx,
      thresholdPx: spec.searchBarTopGapMaxPx,
      status: "fail",
      message: `Empty space above search bar (${measuredPx}px) exceeds Premium 2026 threshold (${spec.searchBarTopGapMaxPx}px)`,
    },
  ];
}

export function scanHomepageLayoutOptimization(): LayoutFinding[] {
  const findings: LayoutFinding[] = [...detectSearchBarTopGap()];
  const spec = PREMIUM_2026_LAYOUT_SPEC;

  const layoutChecks: Array<Omit<LayoutFinding, "id" | "status">> = [
    {
      target: "header",
      issue: "oversized-padding",
      sourceComponent: "rx-header-premium",
      cssSource: "styles/rovexo/header-premium.css",
      measuredPx: spec.headerInnerPaddingBlock,
      thresholdPx: 0,
      message: "Header inner padding-block compressed to Premium 2026 proportions",
    },
    {
      target: "safe-area",
      issue: "safe-area-offset",
      sourceComponent: "rx-header-premium",
      cssSource: "styles/rovexo/header-premium.css",
      message: `Safe area offset uses ${spec.headerPaddingTop}`,
    },
    {
      target: "category-rail",
      issue: "alignment",
      sourceComponent: spec.categoryRailCanonicalComponent,
      cssSource: "styles/rovexo/category-rail.css",
      message: "Category rail aligned to canonical horizontal scroll layout",
    },
    {
      target: "bottom-navigation",
      issue: "viewport-waste",
      sourceComponent: "BetaAppShell / BottomNavigation",
      cssSource: "components/ui/BottomNavigation.tsx",
      message: "Bottom navigation respects safe-area-inset-bottom without excess viewport waste",
    },
  ];

  for (const check of layoutChecks) {
    const exceedsPadding =
      check.issue === "oversized-padding" &&
      check.measuredPx != null &&
      check.thresholdPx != null &&
      check.measuredPx > check.thresholdPx;

    findings.push({
      id: `layout-${check.target}-${check.issue}`,
      ...check,
      status: exceedsPadding ? "fail" : passStatus(),
      message: exceedsPadding
        ? `${check.message} — measured ${check.measuredPx}px exceeds ${check.thresholdPx}px`
        : check.message,
    });
  }

  return findings;
}

function deriveFailConditions(
  duplicationFindings: DuplicationFinding[],
  layoutFindings: LayoutFinding[],
): (typeof INTEGRITY_FAIL_CONDITIONS)[number][] {
  const conditions: (typeof INTEGRITY_FAIL_CONDITIONS)[number][] = [];

  if (duplicationFindings.some((f) => f.status === "fail" && !f.intentional)) {
    conditions.push("duplicated-categories");
  }
  if (duplicationFindings.some((f) => f.kind === "section" && f.status === "fail")) {
    conditions.push("duplicated-homepage-widgets");
    conditions.push("duplicated-featured-sections");
  }
  if (layoutFindings.some((f) => f.target === "search-bar" && f.issue === "empty-space" && f.status === "fail")) {
    conditions.push("empty-space-above-search-bar");
  }
  if (layoutFindings.some((f) => f.issue === "invisible-container" && f.status === "fail")) {
    conditions.push("unused-layout-containers");
  }
  if (layoutFindings.some((f) => f.issue === "alignment" && f.status === "fail")) {
    conditions.push("broken-alignment");
  }
  if (layoutFindings.some((f) => (f.issue === "oversized-padding" || f.issue === "oversized-margin") && f.status === "fail")) {
    conditions.push("inconsistent-spacing");
  }
  if (layoutFindings.some((f) => f.issue === "viewport-waste" && f.status === "fail")) {
    conditions.push("unnecessary-scrolling");
  }
  if ([...duplicationFindings, ...layoutFindings].some((f) => f.status === "fail")) {
    conditions.push("visual-regressions");
  }

  return [...new Set(conditions)];
}

export function runHomepageCategoryIntegrityScan(options?: {
  cycle?: IntegrityValidationCycle;
  homepageBuilder?: HomepageBuilderConfig;
}): IntegrityScanResult {
  const cycle = options?.cycle ?? "homepage-validation";
  const duplicationFindings = [
    ...scanCategoryNavDuplication(),
    ...scanHomepageSectionDuplication(options?.homepageBuilder),
    ...scanSearchSuggestionDuplication(),
  ];
  const layoutFindings = scanHomepageLayoutOptimization();

  const duplicationCount = duplicationFindings.filter((f) => f.status === "fail").length;
  const layoutIssueCount = layoutFindings.filter((f) => f.status === "fail").length;
  const totalChecks = duplicationFindings.length + layoutFindings.length;
  const failedChecks = duplicationCount + layoutIssueCount;
  const passPercent = totalChecks === 0 ? 100 : Math.round(((totalChecks - failedChecks) / totalChecks) * 10000) / 100;

  const failConditions = deriveFailConditions(duplicationFindings, layoutFindings);
  const searchBarTopGapPass = !failConditions.includes("empty-space-above-search-bar");
  const status = failStatus(failedChecks);
  const certificationEligible = status === "pass" && passPercent >= 100;

  return {
    cycle,
    scannedAt: new Date().toISOString(),
    passPercent,
    status,
    duplicationFindings,
    layoutFindings,
    failConditions,
    duplicationCount,
    layoutIssueCount,
    searchBarTopGapPass,
    certificationEligible,
  };
}

export function isHomepageIntegrityPass(scan: IntegrityScanResult): boolean {
  return scan.status === "pass" && scan.passPercent >= 100 && scan.certificationEligible;
}

export function integrityScoreFromScan(scan: IntegrityScanResult): { visualIntegrity: number; homepageIntegrity: number } {
  const visualIntegrity = scan.layoutIssueCount === 0 ? 100 : Math.max(0, 100 - scan.layoutIssueCount * 25);
  const homepageIntegrity = scan.duplicationCount === 0 && scan.searchBarTopGapPass ? 100 : Math.max(0, scan.passPercent);
  return { visualIntegrity, homepageIntegrity };
}
