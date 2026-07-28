/**
 * ROVEXO ABSOLUTE LAW v4.0 — LOCALHOST:3000 FREEZE
 *
 * STATUS: OWNER APPROVED · PERMANENT LAW · LOCKED · FROZEN
 *
 * ONE HOST = http://localhost:3000
 * = Official development · certification · module PASS gate
 * before Git Commit → Push → Preview → Production.
 *
 * Production mirror: same DB · products · engines · real products only.
 * Never inject demo / mock / placeholder inventory on localhost.
 */

export const LOCALHOST_3000_FREEZE_V4 = {
  version: "4.0",
  status: "OWNER_APPROVED_PERMANENT_LAW_LOCKED_FROZEN",
  approvedByOwner: true,
  permanent: true,
  locked: true,
  frozen: true,
  level: 8,

  officialHost: "localhost:3000" as const,
  officialOrigin: "http://localhost:3000" as const,

  authorized: ["localhost:3000", "http://localhost:3000"] as const,

  forbiddenHosts: [
    "localhost:3001",
    "localhost:3010",
    "localhost:4000",
    "localhost:5000",
    "temporary hosts",
    "demo hosts",
    "fake hosts",
    "mock environments",
    "test environments with different behaviour",
  ] as const,

  forbiddenPorts: [3001, 3010, 4000, 5000] as const,

  mustPassOnLocalhost3000Before: [
    "GIT_COMMIT",
    "GIT_PUSH",
    "PREVIEW_DEPLOYMENT",
    "PRODUCTION_DEPLOYMENT",
    "FREEZE",
    "CERTIFICATION",
  ] as const,

  productionMirror: {
    oneDatabase: true,
    oneProductsTable: true,
    oneSourceOfTruth: true,
    oneMarketplace: true,
    oneBuyNowEngine: true,
    oneCheckoutEngine: true,
    onePaymentEngine: true,
    oneShippingEngine: true,
    oneTransactionEngine: true,
    oneAuthEngine: true,
    oneRoutingSystem: true,
    realProductsOnly: true,
  } as const,

  inventoryLaw: {
    zeroProductsShows: "NO_PRODUCTS",
    neverPadEmptyWithFakeListings: true,
    forbidden: [
      "Demo Products",
      "Demo Listings",
      "Fake Listings",
      "Placeholder Listings",
      "Mock Products",
      "Mock Orders",
      "Demo Checkout",
      "Demo Payments",
      "Demo Transactions",
      "Automatic Inventory Injection",
      "Product Fallback Injection",
      "Different Localhost Behaviour",
    ] as const,
  } as const,

  buyNowLaw: {
    requireAll: [
      "product_exists",
      "product_is_real",
      "product_is_published",
      "product_has_uuid",
      "product_has_seller_id",
      "product_has_stock",
      "product_is_purchasable",
      "product_passes_all_guards",
    ] as const,
    onAnyFail: "STOP",
    forbiddenOnFail: [
      "BUY_NOW",
      "CHECKOUT",
      "PAYMENT",
      "ORDER",
      "SHIPPING",
      "DELIVERY",
    ] as const,
  } as const,

  certificationChain: [
    "localhost:3000",
    "TYPECHECK",
    "LINT",
    "BUILD",
    "HOMEPAGE",
    "SEARCH",
    "AUTH",
    "SELL",
    "LISTING",
    "BUY_NOW",
    "CHECKOUT",
    "PAYMENT",
    "ORDERS",
    "TRANSACTIONS",
    "WALLET",
    "SHIPPING",
    "TRACKING",
    "MESSAGES",
    "PASS",
    "GIT_COMMIT",
    "GIT_PUSH",
    "PREVIEW_DEPLOYMENT",
    "PRODUCTION_DEPLOYMENT",
  ] as const,

  developmentLaw: {
    worksOnLocalhost3000: "MUST_WORK_ON_PRODUCTION",
    failsOnLocalhost3000: "MUST_FAIL_ON_PRODUCTION",
    noDifferentBehaviour: true,
  } as const,

  equation:
    "ONE HOST (localhost:3000) = ONE MARKETPLACE = ONE DATABASE = ONE SSOT = REAL PRODUCTS ONLY = PERMANENT LAW" as const,
} as const;

Object.freeze(LOCALHOST_3000_FREEZE_V4);
Object.freeze(LOCALHOST_3000_FREEZE_V4.productionMirror);
Object.freeze(LOCALHOST_3000_FREEZE_V4.inventoryLaw);
Object.freeze(LOCALHOST_3000_FREEZE_V4.buyNowLaw);
Object.freeze(LOCALHOST_3000_FREEZE_V4.developmentLaw);

export function isOfficialLocalhostOrigin(origin: string): boolean {
  const normalized = origin.trim().replace(/\/$/, "").toLowerCase();
  return (
    normalized === LOCALHOST_3000_FREEZE_V4.officialOrigin ||
    normalized === `http://127.0.0.1:3000`
  );
}

export function isForbiddenLocalhostHost(host: string): boolean {
  const lower = host.trim().toLowerCase().replace(/^https?:\/\//, "");
  return LOCALHOST_3000_FREEZE_V4.forbiddenHosts.some(
    (entry) => entry.startsWith("localhost:") && lower.startsWith(entry),
  );
}
