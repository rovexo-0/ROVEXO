/**
 * ROVEXO Absolute Blood Law XLV — Final Live Production Certification (contract)
 * Client-safe · no server imports.
 *
 * Completeness law: certification continues until every mandatory surface passes.
 * Host: http://localhost:3000 ONLY · Demo Session ONLY · zero production mutation.
 */

export const FINAL_LIVE_CERTIFICATION_V1 = {
  version: "1.0",
  bloodLaw: "XLV",
  name: "Final Live Production Certification",
  host: "http://localhost:3000",
  parentLaws: ["XLII", "XLIII", "XLIV"] as const,
  equation:
    "LIVE_LOCALHOST + DEMO_SESSION + EVERY_SURFACE + EVERY_FLOW + VISUAL_EVIDENCE + PRODUCTION_UNCHANGED = FULLY_CERTIFIED",
  productionReadyRequires: [
    "ALL_MANDATORY_PAGES_VISITED",
    "ALL_INTERACTIVE_COMPONENTS_EXECUTED",
    "ALL_MANDATORY_WORKFLOWS_PASSED",
    "ZERO_CRITICAL_DEFECTS",
    "ZERO_HIGH_DEFECTS",
    "PRODUCTION_UNCHANGED",
    "DEMO_SESSION_CLEANED",
  ] as const,
} as const;

export const XLV_DEMO_WALLETS_GBP = {
  buyer: 100_000,
  seller: 100_000,
  business: 100_000,
  admin: "unlimited",
} as const;

export const XLV_DEMO_ROLES = [
  "guest",
  "buyer",
  "seller",
  "business",
  "admin",
  "super_admin",
] as const;

export type XlvDemoRole = (typeof XLV_DEMO_ROLES)[number];

/** Mandatory certification surfaces (Owner directive). */
export const XLV_MANDATORY_SURFACES = [
  { id: "homepage", path: "/", roles: ["guest", "buyer", "seller"] },
  { id: "search", path: "/search", roles: ["guest", "buyer"] },
  { id: "categories", path: "/categories", roles: ["guest", "buyer"] },
  { id: "login", path: "/login", roles: ["guest"] },
  { id: "register", path: "/register", roles: ["guest"] },
  { id: "forgot_password", path: "/forgot-password", roles: ["guest"] },
  { id: "inbox", path: "/inbox", roles: ["buyer", "seller"] },
  { id: "notifications", path: "/notifications", roles: ["buyer", "seller"] },
  { id: "saved", path: "/saved", roles: ["buyer"] },
  { id: "sell", path: "/sell", roles: ["seller", "business"] },
  { id: "checkout", path: "/checkout", roles: ["buyer"] },
  { id: "balance", path: "/balance", roles: ["buyer", "seller"] },
  { id: "wallet", path: "/wallet", roles: ["buyer", "seller"] },
  { id: "wallet_withdraw", path: "/wallet/withdraw", roles: ["seller", "business"] },
  { id: "wallet_payment_methods", path: "/wallet/payment-methods", roles: ["buyer"] },
  { id: "wallet_transactions", path: "/wallet/transactions", roles: ["buyer", "seller"] },
  { id: "orders", path: "/orders", roles: ["buyer", "seller"] },
  { id: "account", path: "/account", roles: ["buyer", "seller", "business"] },
  { id: "account_settings", path: "/account/settings", roles: ["buyer", "seller"] },
  { id: "account_ideas", path: "/account/ideas", roles: ["buyer"] },
  { id: "business_dashboard", path: "/business/dashboard", roles: ["business"] },
  { id: "admin_dashboard", path: "/admin", roles: ["admin"] },
  { id: "super_admin", path: "/super-admin", roles: ["super_admin"] },
  { id: "help", path: "/help", roles: ["guest", "buyer"] },
  { id: "legal_terms", path: "/terms", roles: ["guest"] },
  { id: "legal_privacy", path: "/privacy-policy", roles: ["guest"] },
  { id: "contact", path: "/contact", roles: ["guest"] },
] as const;

export const XLV_CRITICAL_VIDEO_FLOWS = [
  "homepage",
  "offer_flow",
  "counter_offer_flow",
  "checkout",
  "payment",
  "wallet",
  "shipping",
  "delivery",
  "reviews",
  "business_dashboard",
  "admin_dashboard",
] as const;

export const XLV_RESULT = ["PASS", "FAIL", "WARNING", "BLOCKED_OWNER"] as const;
export type XlvResult = (typeof XLV_RESULT)[number];
