/**
 * ROVEXO Global Smart Platform Engine v1.0 — constants (SSOT).
 *
 * PRODUCTION_READY = true
 * ACTIVE = false
 *
 * Local / QA / Demo / Certification / Visual / E2E → SHOW EVERYTHING.
 * Production rules activate only when Owner flips ACTIVE at production cutover.
 */

export const SMART_PLATFORM_ENGINE_VERSION = "v1.0" as const;
export const SMART_PLATFORM_ENGINE_NAME = "ROVEXO GLOBAL SMART PLATFORM ENGINE" as const;
export const SMART_PLATFORM_PRODUCTION_READY = true as const;

/**
 * Master activation switch. Remains false until Owner production deployment cutover.
 * Do not enable for local, QA, demo, certification, visual QA, or E2E.
 */
export const SMART_PLATFORM_ENGINE_ACTIVE: boolean = false;

/** Platform runtime modes (Owner lock). */
export const SMART_PLATFORM_MODES = [
  "local",
  "qa",
  "demo",
  "certification",
  "visual-certification",
  "e2e",
  "production",
] as const;

export type SmartPlatformMode = (typeof SMART_PLATFORM_MODES)[number];

/** Modes that must SHOW EVERYTHING. */
export const SMART_PLATFORM_SHOW_EVERYTHING_MODES: readonly SmartPlatformMode[] = [
  "local",
  "qa",
  "demo",
  "certification",
  "visual-certification",
  "e2e",
] as const;

/** Surfaces controlled by the Global Smart Platform Engine. */
export const SMART_PLATFORM_SURFACES = [
  "profile",
  "view-profile",
  "settings",
  "balance",
  "wallet",
  "checkout",
  "orders",
  "search",
  "product-page",
  "inbox",
  "offers",
  "listings",
  "promotions",
  "verified-system",
  "payment-methods",
  "personal-bank-account",
  "business-bank-account",
  "business-verification",
  "shipping",
  "reviews",
  "notifications",
  "ai-features",
  "future-features",
] as const;

export type SmartPlatformSurface = (typeof SMART_PLATFORM_SURFACES)[number];

/** Named sub-engines under the Global Smart Platform Engine. */
export const SMART_PLATFORM_SUB_ENGINES = [
  "visibility",
  "verified",
  "money",
  "security",
  "business",
  "payment",
  "profile",
  "settings",
  "wallet",
  "feature",
] as const;

export type SmartPlatformSubEngine = (typeof SMART_PLATFORM_SUB_ENGINES)[number];
