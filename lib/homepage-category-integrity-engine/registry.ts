export const INTEGRITY_VALIDATION_CYCLES = [
  "homepage-validation",
  "category-validation",
  "full-platform-scan",
  "enterprise-qa",
  "launch-readiness",
  "enterprise-certification",
] as const;

export const DUPLICATION_SCAN_TARGETS = [
  "category-rail",
  "category-grid",
  "homepage-sections",
  "featured-categories",
  "navigation",
  "search-suggestions",
  "category-cards",
] as const;

export const LAYOUT_OPTIMIZATION_TARGETS = [
  "header",
  "safe-area",
  "search-bar",
  "category-rail",
  "category-grid",
  "banner",
  "featured-listings",
  "recommended-listings",
  "bottom-navigation",
] as const;

export const INTEGRITY_FAIL_CONDITIONS = [
  "duplicated-categories",
  "duplicated-homepage-widgets",
  "duplicated-featured-sections",
  "empty-space-above-search-bar",
  "unused-layout-containers",
  "broken-alignment",
  "inconsistent-spacing",
  "unnecessary-scrolling",
  "visual-regressions",
] as const;

/** Premium 2026 homepage layout thresholds — mirrors styles/rovexo/header-premium.css */
export const PREMIUM_2026_LAYOUT_SPEC = {
  headerPaddingTop: "env(safe-area-inset-top)",
  headerPaddingBottom: 0,
  headerInnerPaddingBlock: 0,
  searchBarTopGapMaxPx: 0,
  searchBarHeightMobilePx: 48,
  searchBarHeightDesktopPx: 52,
  categoryRailCanonicalComponent: "HomeCategoryRail",
  retiredComponents: ["CategoryGridSection"],
} as const;

export const CANONICAL_HOMEPAGE_CATEGORY_SOURCES = {
  nav: "HOME_CATEGORY_NAV",
  rail: "HomeCategoryRail",
  library: "ROVEXO_HOME_CATEGORY_RAIL",
} as const;

export const INTEGRITY_OMEGA_SCORES = ["visual-integrity", "homepage-integrity"] as const;
