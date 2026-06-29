export const HOMEPAGE_CERTIFICATION_ROUTES = [
  { id: "dashboard", label: "Certification Board", href: "/super-admin/homepage-certification" },
  { id: "sections", label: "Sections", href: "/super-admin/homepage-certification/sections" },
  { id: "buttons", label: "Buttons", href: "/super-admin/homepage-certification/buttons" },
  { id: "search", label: "Search", href: "/super-admin/homepage-certification/search" },
  { id: "categories", label: "Categories", href: "/super-admin/homepage-certification/categories" },
  { id: "listings", label: "Listings", href: "/super-admin/homepage-certification/listings" },
  { id: "responsive", label: "Responsive", href: "/super-admin/homepage-certification/responsive" },
  { id: "performance", label: "Performance", href: "/super-admin/homepage-certification/performance" },
  { id: "accessibility", label: "Accessibility", href: "/super-admin/homepage-certification/accessibility" },
  { id: "seo", label: "SEO", href: "/super-admin/homepage-certification/seo" },
  { id: "integrity", label: "Integrity", href: "/super-admin/homepage-certification/integrity" },
  { id: "reports", label: "Reports", href: "/super-admin/homepage-certification/reports" },
] as const;

export const HOMEPAGE_SECTIONS = [
  "premium-header",
  "search-bar",
  "top-category-bar",
  "category-rail",
  "bring-items",
  "featured-listings",
  "recommended-listings",
  "new-listings",
  "latest-listings",
  "popular-categories",
  "auction-preview",
  "recently-viewed",
  "trending-searches",
  "footer",
  "bottom-navigation",
] as const;

export const BUTTON_INTERACTION_CHECKS = [
  "tap",
  "hover",
  "focus",
  "keyboard-navigation",
  "redirect",
  "permission",
  "animation",
  "loading-state",
  "success-state",
  "error-state",
  "empty-state",
  "offline-state",
] as const;

export const SEARCH_VALIDATION_CHECKS = [
  "search-input",
  "suggestions",
  "autocomplete",
  "recent-searches",
  "popular-searches",
  "filters",
  "sorting",
  "ai-assistance",
  "result-routing",
] as const;

export const CATEGORY_VALIDATION_CHECKS = [
  "category-icons",
  "subcategories",
  "navigation",
  "images",
  "descriptions",
  "listing-counts",
  "routing",
  "performance",
] as const;

export const LISTING_VALIDATION_CHECKS = [
  "image",
  "price",
  "title",
  "location-rules",
  "seller-badge",
  "business-badge",
  "trust-indicators",
  "wishlist",
  "share",
  "quick-preview",
  "open-listing",
] as const;

export const RESPONSIVE_BREAKPOINTS = [
  "mobile",
  "tablet",
  "desktop",
  "large-desktop",
  "landscape",
  "portrait",
  "safe-areas",
] as const;

export const PERFORMANCE_METRICS = [
  "largest-contentful-paint",
  "cumulative-layout-shift",
  "interaction-to-next-paint",
  "interaction-latency",
  "image-optimization",
  "bundle-size",
  "lazy-loading",
  "infinite-scrolling",
  "memory-usage",
] as const;

export const ACCESSIBILITY_CHECKS = [
  "aria",
  "keyboard",
  "screen-readers",
  "focus-order",
  "contrast",
  "font-scaling",
  "reduced-motion",
] as const;

export const SEO_CHECKS = [
  "metadata",
  "structured-data",
  "open-graph",
  "twitter-cards",
  "canonical-urls",
  "robots",
  "sitemap-references",
  "internal-linking",
] as const;

export const OMEGA_CERTIFICATION_SCORES = [
  "ux",
  "ui",
  "performance",
  "seo",
  "accessibility",
  "security",
  "architecture",
  "business-logic",
  "responsiveness",
  "visual-integrity",
  "homepage-integrity",
  "enterprise",
] as const;

export const CERTIFICATION_STAGES = [
  "section-validation",
  "button-validation",
  "search-validation",
  "category-validation",
  "homepage-integrity-scan",
  "layout-optimization-scan",
  "listing-validation",
  "responsive-validation",
  "performance-validation",
  "accessibility-validation",
  "seo-validation",
  "omega-score-review",
  "governance-approval",
  "certification-grant",
] as const;

export const PROTECTED_AREAS = [
  "marketplace-business-logic",
  "payments",
  "wallet",
  "authentication",
  "orders",
  "shipping",
  "production-database",
  "deployment-pipeline",
] as const;

export const REPORT_TYPES = ["certification", "sections", "buttons", "search", "integrity", "performance", "accessibility", "seo", "omega-scores"] as const;
export const EXPORT_FORMATS = ["pdf", "excel", "csv", "json"] as const;

export const HOMEPAGE_CERTIFICATION_API = {
  snapshot: "/api/super-admin/homepage-certification",
  action: "/api/super-admin/homepage-certification/action",
  validate: "/api/super-admin/homepage-certification/validate",
  certify: "/api/super-admin/homepage-certification/certify",
  analyze: "/api/super-admin/homepage-certification/analyze",
  export: "/api/super-admin/homepage-certification/export",
  v1Snapshot: "/api/v1/super-admin/homepage-certification",
} as const;
