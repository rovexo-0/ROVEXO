/**
 * ROVEXO v1.0 — ABSOLUTE AUTHORITY VIEW ENGINE LOCK
 *
 * STATUS: SPRING 1 · OWNER APPROVED · FROZEN · LOCKED
 * Absolute Functional Law: localhost:3000 + Owner click + visual proof PASS
 *
 * Post-freeze changes require Level 8 Owner approval
 * (critical security / production bugs / legal only).
 */

export const VIEW_ENGINE_LOCK = "ABSOLUTE_AUTHORITY_v1.0" as const;
export const VIEW_SYSTEM_VERSION = "1.0" as const;
export const VIEW_SYSTEM_LEVEL = 8 as const;
export const VIEW_SYSTEM_STATUS = "SPRING_1_OWNER_FROZEN_LOCKED" as const;
export const VIEW_SYSTEM_FREEZE = true as const;
export const VIEW_SYSTEM_PRODUCTION_READY = false as const;

export const VIEW_SSOT = {
  table: "product_view_events",
  counter: "products.views",
  rpc: "record_unique_product_view",
  commit: "commitUniqueProductView",
  api: "POST /api/views",
  beacon: "features/product-detail/RecordProductViewBeacon.tsx",
  engine: "lib/views/record-product-view.ts",
  liveSync: "lib/views/view-live-sync.ts",
  liveHook: "lib/views/use-live-product-views.ts",
  authority: "products.views DATABASE ONLY",
} as const;

/** Master Spec v1.0 — ≤2s click→1 View; 1s dwell = PERFECT. */
export const VIEW_DWELL_MS = 1000 as const;
export const VIEW_WINDOW = "24 hours" as const;

/** 1 PRODUCT = 1 REAL VIEW */
export const VIEW_EQUATION = {
  oneProduct: "1 REAL VIEW",
  countOnlyIf: [
    "Product page opened",
    "Visible on screen",
    "Dwell time PASS",
    "Unique viewer PASS",
    "Anti spam PASS",
    "Sync PASS",
  ] as const,
} as const;

export const VIEW_DO_NOT_COUNT = [
  "Homepage",
  "Search",
  "Saved",
  "Stores",
  "Similar products",
  "Related products",
  "Recommendations",
  "Hover",
  "Scroll",
  "Refresh",
  "Owner spam",
  "Bots",
  "Cache reload",
  "Background tabs",
] as const;

/**
 * OWNER PROTECTION (permanent)
 * Owner opens 1…10000 times → +0 views
 * Refresh 1…1000 → +0
 * Login/logout cycles → +0
 */
export const VIEW_OWNER_PROTECTION = {
  ownerOpens: "+0 VIEWS",
  ownerRefresh: "+0 VIEWS",
  ownerLoginLogout: "+0 VIEWS",
  bypassForbidden: true,
} as const;

export const VIEW_MULTI_USER = {
  userA: "1 VIEW",
  userB: "2 VIEWS",
  userC: "3 VIEWS",
  userD: "4 VIEWS",
  rule: "ONLY UNIQUE USERS MAY COUNT",
} as const;

export const VIEW_SYNC_ENGINE = [
  "POST /api/views",
  "commitUniqueProductView()",
  "product_view_events",
  "products.views",
  "publishViewLive()",
  "LIVE SYNC",
] as const;

export const VIEW_PRODUCTION_FORBIDDEN = [
  "fake views",
  "manual counters",
  "temporary counters",
  "javascript counters",
  "hidden counters",
  "cache counters",
  "UI only counters",
  "admin bypass",
  "owner bypass",
  "forced increments",
] as const;

export const VIEW_DEPLOYMENT_FORBIDDEN_IF = [
  "SQL FAIL",
  "API FAIL",
  "RPC FAIL",
  "SYNC FAIL",
  "QA FAIL",
  "OWNER QA FAIL",
  "GALAXY QA FAIL",
  "ANTI SPAM FAIL",
] as const;

/** Owner visual chain — Master Engineering Spec v1.0 (Absolute Functional Law). */
export const VIEW_LEVEL_8_OWNER_QA = [
  "Homepage 0 Views",
  "Owner click product",
  "≤2s Product Page = 1 View",
  "Back → Homepage = 1 View",
  "Same user again → still 1",
  "Other user → 2 Views",
  "Bot → BLOCKED → still 2",
  "Seller → BLOCKED → still 2",
  "VISUAL OWNER PROOF → FREEZE",
] as const;

/** Protected surfaces — require Level 8 Owner approval to modify. */
export const VIEW_PROTECTED_ENGINES = [
  "View Engine",
  "Anti Spam Engine",
  "Sync Engine",
  "Owner Protection",
  "Refresh Protection",
  "Production Lock",
] as const;

export const VIEW_ANTI_SPAM = {
  maxUniqueProductViewsPerHour: 60,
  botsSkipped: true,
  /** Listing seller only — not ROVEXO Product Owner / admin browsing. */
  ownerExcluded: true,
  adminExcluded: false,
  superAdminExcluded: false,
  staffExcluded: false,
  unpublishedExcluded: true,
  apiRateLimitPerMinute: 30,
  refreshProtection: true,
} as const;

export const VIEW_RULES = {
  onlyRoute: "/listing/[slug]",
  dwellMs: VIEW_DWELL_MS,
  viewWindow: VIEW_WINDOW,
  /** Listing seller opens own product. */
  ownerOpen: "+0 VIEWS (canonical)",
  /** Product Owner / admin may count when not listing seller. */
  adminOpen: "+1 WHEN NOT LISTING SELLER",
  superAdminOpen: "+1 WHEN NOT LISTING SELLER",
  staffOpen: "+1 WHEN NOT LISTING SELLER",
  botOpen: "+0 VIEWS",
  unpublished: "+0 VIEWS",
  f5: "+0 VIEWS",
  refresh1000: "+0 VIEWS",
  authority: "DATABASE ONLY",
  localStorage: false,
  sessionStorage: false,
  clientSideCounting: false,
} as const;

export const VIEW_FORBIDDEN_SURFACES = VIEW_DO_NOT_COUNT;
export const VIEW_PRODUCTION_ALLOWED = [
  "Product Views",
  "DB synchronization",
  "Anti spam",
  "Anti bot",
  "Owner protection",
  "Live synchronization",
] as const;

export const VIEW_VISIBLE_UI = {
  examples: [
    "1 View",
    "12 Views",
    "154 Views",
    "1.1K Views",
    "25K Views",
    "1.2M Views",
  ] as const,
  forbidden: [
    "Today",
    "Weekly",
    "Monthly",
    "Analytics",
    "Countries",
    "Traffic",
    "Devices",
    "Heat Maps",
    "Graphs",
  ] as const,
} as const;

export const VIEW_COUNT_FLOW = VIEW_SYNC_ENGINE;
export const VIEW_PRODUCTION_EQUATION = VIEW_EQUATION;
export const VIEW_LEVEL_8_REQUIRES = VIEW_LEVEL_8_OWNER_QA;
export const VIEW_FORBIDDEN = VIEW_PRODUCTION_FORBIDDEN;
export const VIEW_PRODUCTION_FORBIDDEN_LIST = VIEW_PRODUCTION_FORBIDDEN;
export const VIEW_DISPLAY_SURFACES = [
  "Homepage",
  "Search",
  "Saved",
  "Store",
  "Product Page",
] as const;
