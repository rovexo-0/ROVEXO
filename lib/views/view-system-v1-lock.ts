/**
 * ROVEXO v1.0 — ABSOLUTE AUTHORITY VIEW ENGINE LOCK
 *
 * STATUS: PERMANENTLY LOCKED · OWNER CONTROLLED · LEVEL 8 PROTECTED
 * Production Ready: NO until Level 8 Owner QA PASS (Owner only)
 *
 * Authority: Owner Absolute Authority Lock v1.0
 * No View Engine / Anti-Spam / Sync / Owner / Refresh changes
 * without Level 8 Owner approval.
 */

export const VIEW_ENGINE_LOCK = "ABSOLUTE_AUTHORITY_v1.0" as const;
export const VIEW_SYSTEM_VERSION = "1.0" as const;
export const VIEW_SYSTEM_LEVEL = 8 as const;
export const VIEW_SYSTEM_STATUS = "PERMANENTLY_LOCKED_NOT_PRODUCTION_READY" as const;
export const VIEW_SYSTEM_FREEZE = true as const;
export const VIEW_SYSTEM_PRODUCTION_READY = false as const;

export const VIEW_SSOT = {
  table: "product_view_events",
  counter: "products.views",
  rpc: "record_unique_product_view",
  api: "POST /api/views",
  beacon: "features/product-detail/RecordProductViewBeacon.tsx",
  engine: "lib/views/record-product-view.ts",
  liveSync: "lib/views/view-live-sync.ts",
  liveHook: "lib/views/use-live-product-views.ts",
  authority: "products.views DATABASE ONLY",
} as const;

export const VIEW_DWELL_MS = 1500 as const;
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
  "RPC record_unique_product_view()",
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

export const VIEW_LEVEL_8_OWNER_QA = [
  "0 → OWNER OPEN → 0",
  "USER A → 1",
  "USER A REFRESH x100 → 1",
  "USER B → 2",
  "USER C → 3",
  "ADMIN / SUPER_ADMIN / BOT → 3",
  "24H → USER A → 4",
  "ANTI SPAM PASS",
  "SYNC PASS",
  "OWNER = 0 PASS",
  "LEVEL 8 PASS",
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
  ownerExcluded: true,
  adminExcluded: true,
  superAdminExcluded: true,
  staffExcluded: true,
  unpublishedExcluded: true,
  apiRateLimitPerMinute: 30,
  refreshProtection: true,
} as const;

export const VIEW_RULES = {
  onlyRoute: "/listing/[slug]",
  dwellMs: VIEW_DWELL_MS,
  viewWindow: VIEW_WINDOW,
  ownerOpen: "+0 VIEWS (canonical)",
  adminOpen: "+0 VIEWS",
  superAdminOpen: "+0 VIEWS",
  staffOpen: "+0 VIEWS",
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
