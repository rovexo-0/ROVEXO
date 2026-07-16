export const HOMEPAGE_FULL_SCAN_COMPONENTS = [
  "premium-header",
  "safe-area",
  "search-bar",
  "category-rail",
  "category-grid",
  "all-listings",
  "footer",
  "bottom-navigation",
] as const;

export const HOMEPAGE_UI_INTEGRITY_CHECKS = [
  "duplicate-categories",
  "duplicate-sections",
  "duplicate-widgets",
  "duplicate-cards",
  "duplicate-banners",
  "duplicate-icons",
  "duplicate-buttons",
  "unused-containers",
  "hidden-placeholders",
  "legacy-ui",
  "dead-components",
  "broken-premium-styling",
] as const;

export const HOMEPAGE_LAYOUT_TARGETS = [
  "empty-space-above-search",
  "empty-space-below-header",
  "section-spacing",
  "card-spacing",
  "category-spacing",
  "banner-spacing",
  "viewport-utilisation",
  "safe-areas",
  "responsive-spacing",
  "vertical-rhythm",
] as const;

export const BANNER_VALIDATION_CHECKS = [
  "marketplace-sources",
  "cta-buttons",
  "links",
  "responsive-behaviour",
  "lazy-loading",
] as const;

export const HOMEPAGE_ENGINEERING_SCORES = [
  "homepage-health",
  "homepage-completion",
  "visual-integrity",
  "navigation-integrity",
  "ux",
  "ui",
  "performance",
  "accessibility",
  "seo",
  "architecture",
  "enterprise",
] as const;

export const HOMEPAGE_PRODUCTION_GATES = [
  "typecheck",
  "homepage-tests",
  "ui-integrity",
  "navigation",
  "performance",
  "accessibility",
  "seo",
  "security",
  "qa",
  "governance",
  "e2e",
  "enterprise-certification",
] as const;

export const PREMIUM_HOME_STACK = [
  "RovexoHeaderV2",
  "RovexoHomePage",
] as const;

export const LEGACY_HOME_IMPORTS = [
  "HomePromoBanner",
  "HomeHero",
  "HomeHeroBanner",
  "HomeHeroBannerEngine",
  "CategoryGridSection",
  "PopularListingsGrid",
  "QuickFiltersRail",
  "HomeTrendingSearchesSection",
  "ProductSection",
  "HomeHeroSearch",
  "HomeBenefitsRail",
  "HomeSecondaryBanners",
  "AppStoreButtons",
] as const;

export const HOMEPAGE_SOURCE_FILES = {
  page: "app/page.tsx",
  homeContent: "components/home/RovexoHomePage.tsx",
  categoryRail: "components/homepage/canonical/CanonicalCategoryRail.tsx",
  header: "components/header/RovexoHeaderV2.tsx",
  betaShell: "components/beta/BetaAppShell.tsx",
  categoryGrid: "components/home/CategoryGridSection.tsx",
} as const;
