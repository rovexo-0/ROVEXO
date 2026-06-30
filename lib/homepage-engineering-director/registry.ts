export const HOMEPAGE_FULL_SCAN_COMPONENTS = [
  "premium-header",
  "safe-area",
  "search-bar",
  "category-rail",
  "category-grid",
  "bring-items",
  "featured-listings",
  "recommended-listings",
  "new-listings",
  "latest-listings",
  "community-section",
  "trending-listings",
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
  "PremiumHero",
  "ImportListingBanner",
  "InfiniteCategoryRail",
  "FeaturedListings",
  "RecommendedListings",
  "NewListings",
  "TrendingListings",
  "BusinessSection",
  "LatestListings",
  "DealsSection",
  "BenefitsSection",
] as const;

export const LEGACY_HOME_IMPORTS = [
  "HomePromoBanner",
  "HomeHero",
  "HomeHeroBanner",
  "HomeHeroBannerEngine",
  "HomeContent",
  "CategoryGridSection",
  "PopularListingsGrid",
  "QuickFiltersRail",
  "HomeTrendingSearchesSection",
  "ProductSection",
  "HomeHeroSearch",
  "HomeBenefitsRail",
  "HomeSecondaryBanners",
  "AppStoreButtons",
  "BringYourItemsBanner",
  "HomeCategoryRail",
] as const;

export const HOMEPAGE_SOURCE_FILES = {
  page: "app/page.tsx",
  homeContent: "components/premium/PremiumHomePage.tsx",
  categoryRail: "components/premium/InfiniteCategoryRail.tsx",
  header: "components/premium/PremiumHeader.tsx",
  betaShell: "components/beta/BetaAppShell.tsx",
  categoryGrid: "components/premium/InfiniteCategoryRail.tsx",
} as const;
