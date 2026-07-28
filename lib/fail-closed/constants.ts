/**
 * ROVEXO GLOBAL FAIL CLOSED ENGINE v1.0 (LOCK) — constants.
 *
 * Never white-screen. Never expose secrets, ENV names, stack traces, or internals.
 */

export const FAIL_CLOSED_ENGINE_NAME = "ROVEXO GLOBAL FAIL CLOSED ENGINE" as const;
export const FAIL_CLOSED_ENGINE_VERSION = "v1.0" as const;
export const FAIL_CLOSED_PRODUCTION_READY = true as const;

/** Feature id in Smart Feature registry. */
export const FAIL_CLOSED_FEATURE_ID = "global-fail-closed" as const;

/**
 * Crash / secret / white-screen prevention is ALWAYS on.
 * Users must never see a broken platform — local, QA, or production.
 */
export const FAIL_CLOSED_CRASH_PREVENTION_ALWAYS_ACTIVE = true as const;

/** Owner-approved user copy (SSOT). */
export const FAIL_CLOSED_COPY = {
  title: "Something went wrong.",
  body: "Some information is temporarily unavailable.",
  hint: "Please try again shortly.",
  retryLabel: "Retry",
  updatingTitle: "We're updating this section.",
  updatingBody: "Please try again shortly.",
} as const;

/** Single-line fail-closed body for inline surfaces (modals, toasts). */
export const FAIL_CLOSED_USER_MESSAGE = FAIL_CLOSED_COPY.body;

export type FailClosedVariant = "unavailable" | "updating";

export type FailClosedSurface =
  | "homepage"
  | "profile"
  | "view-profile"
  | "settings"
  | "wallet"
  | "promotion"
  | "store-showcase"
  | "verification"
  | "payment-methods"
  | "personal-bank"
  | "business-bank"
  | "search"
  | "product"
  | "orders"
  | "inbox"
  | "checkout"
  | "shipping"
  | "global"
  | "unknown";

/** Tokens that must never appear in user-facing copy. */
export const FAIL_CLOSED_FORBIDDEN_PATTERNS: readonly RegExp[] = [
  /supabase/i,
  /service[_\s-]?role/i,
  /admin[_\s-]?client/i,
  /createAdminClient/i,
  /DATABASE/i,
  /stack\s*trace/i,
  /at\s+\S+\s+\(/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /internal\s+server/i,
  /internal\s+error/i,
  /env(ironment)?\s*(var|variable|error)/i,
  /SECRET/i,
  /API[_\s-]?KEY/i,
  /STRIPE_/i,
  /NEXT_PUBLIC_/i,
  /SUPABASE_/i,
  /process\.env/i,
  /postgres/i,
  /prisma/i,
  /redis/i,
  /webhook/i,
  /jwt/i,
  /bearer\s+/i,
  /sk_live_/i,
  /sk_test_/i,
  /sb_secret_/i,
  /whsec_/i,
];
