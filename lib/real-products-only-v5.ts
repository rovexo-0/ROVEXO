/**
 * ROVEXO ABSOLUTE LAW v5.0 — REMOVE ALL FAKE / DEMO / TEST LISTINGS
 *
 * STATUS: OWNER APPROVED · PERMANENT FREEZE · REAL PRODUCTS ONLY
 *
 * localhost:3000 must contain only real database products.
 * Empty DB → empty marketplace UI (never pad with fakes).
 */

export const REAL_PRODUCTS_ONLY_V5 = {
  version: "5.0",
  status: "OWNER_APPROVED_PERMANENT_FREEZE",
  approvedByOwner: true,
  permanent: true,
  locked: true,
  frozen: true,
  officialHost: "http://localhost:3000",

  removedForever: [
    "Fake Listings",
    "Demo Listings",
    "Test Listings",
    "Placeholder Listings",
    "Mock Listings",
    "Demo Products",
    "Canonical Demo Products",
    "Generated Products",
    "Automatic Listing Injection",
    "Fake Marketplace Inventory",
    "Demo Product Fallbacks",
  ] as const,

  forbiddenSlugPrefixes: [
    "demo-",
    "canonical-demo",
    "fake-",
    "mock-",
    "placeholder-",
    "test-listing",
    "demo-feed-",
    "run4-",
    "run-test-",
    "fixture-",
    "seed-",
    "cert-listing-",
    "certification-",
    "development-",
    "dev-listing-",
  ] as const,

  removedCertificationInventory: [
    "RUN4 Offer Listing",
    "RUN4 Probe2",
    "RUN4 Certification",
    "RUN Test",
    "Certification Listing",
    "Virtual demo listings",
  ] as const,

  emptyMarketplace: {
    eyebrow: "ROVEXO MARKETPLACE",
    title: "No listings available.",
    description: "Be the first to sell on ROVEXO.",
    cta: "SELL NOW",
    ctaHref: "/sell",
  } as const,

  everyProductMust: [
    "exist_in_database",
    "have_product_id",
    "have_seller_id",
    "have_uuid",
    "be_published",
    "be_purchasable",
    "pass_all_guards",
  ] as const,

  keep: [
    "demo.buyer@rovexo.co.uk",
    "demo.seller@rovexo.co.uk",
  ] as const,

  equation:
    "0 PRODUCTS = EMPTY UI · N PRODUCTS = N REAL PRODUCTS · NEVER 0 → 10 FAKES" as const,
} as const;

Object.freeze(REAL_PRODUCTS_ONLY_V5);
Object.freeze(REAL_PRODUCTS_ONLY_V5.emptyMarketplace);
Object.freeze(REAL_PRODUCTS_ONLY_V5.removedCertificationInventory);
