export const HOMEPAGE_FULL_SCAN_COMPONENTS = [
  "premium-header",
  "safe-area",
  "search-bar",
  "category-rail",
  "category-grid",
  "hero-banner",
  "featured-listings",
  "recommended-listings",
  "latest-listings",
  "business-section",
  "community-section",
  "recently-viewed",
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
  "rotation",
  "timers",
  "links",
  "cta-buttons",
  "images",
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
  "HomeCategoryRail",
  "HomeHeroBannerEngine",
  "FeaturedListingsSection",
  "HomeProductSection",
  "LiveAuctionsSection",
  "BusinessSpotlightSection",
  "HomeContinueBrowsingCarousel",
] as const;

export const LEGACY_HOME_IMPORTS = [
  "HomePromoBanner",
  "HomeHero",
  "CategoryGridSection",
  "PopularListingsGrid",
  "QuickFiltersRail",
  "HomeTrendingSearchesSection",
  "TrendingSearchesSection",
  "ProductSection",
  "HomeHeroSearch",
  "HomeBenefitsRail",
  "HomeSecondaryBanners",
  "HeaderCategoryBar",
] as const;

export const HOMEPAGE_SOURCE_FILES = {
  page: "app/page.tsx",
  homeContent: "components/home/HomeContent.tsx",
  categoryRail: "components/home/HomeCategoryRail.tsx",
  header: "components/Header.tsx",
  betaShell: "components/beta/BetaAppShell.tsx",
  categoryGrid: "components/home/CategoryGridSection.tsx",
} as const;
