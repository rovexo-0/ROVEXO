/**
 * ROVEXO Verified Engine v1.0 — constants (SSOT).
 * One badge only: ROVEXO VERIFIED. Fail closed. No admin/paid overrides.
 */

import { isSmartPlatformProductionActive } from "@/lib/smart-platform/mode";

export const ROVEXO_VERIFIED_BADGE_NAME = "ROVEXO VERIFIED" as const;
export const ROVEXO_VERIFIED_ENGINE_VERSION = "v1.0" as const;
export const ROVEXO_VERIFIED_BADGE_SIZE_PX = 7;

/**
 * Verified Engine is production-ready but inactive until Global Smart Platform cutover.
 * Local / QA / certification must not enforce production verification locks.
 */
export const ROVEXO_VERIFIED_ENGINE_PRODUCTION_READY = true as const;
/** Legacy flag — runtime activation owned by Global Smart Platform Engine. */
export const ROVEXO_VERIFIED_ENGINE_ACTIVE: boolean = false;

export function isRovexoVerifiedEngineActive(): boolean {
  return isSmartPlatformProductionActive();
}

/** Facebook-style verified blue (light + dark). */
export const ROVEXO_VERIFIED_BLUE = "#1877F2";
export const ROVEXO_VERIFIED_BLUE_DARK = "#4C9AFF";

export const ROVEXO_VERIFIED_SURFACES = [
  "profile",
  "view-profile",
  "homepage-listing-cards",
  "search-results",
  "product-page",
  "inbox",
  "reviews",
  "comments",
  "offers",
  "notifications",
  "my-orders",
  "seller-information",
  "public-profiles",
  "business-profiles",
] as const;

export const ROVEXO_VERIFIED_FORBIDDEN_SURFACES = [
  "payment",
  "checkout",
  "settings",
  "help-centre",
  "legal",
  "sign-out",
  "payment-methods",
  "bank-account-cards",
  "admin-identifiers",
  "sensitive",
] as const;

export type RovexoVerifiedSurface = (typeof ROVEXO_VERIFIED_SURFACES)[number];
export type RovexoVerifiedForbiddenSurface = (typeof ROVEXO_VERIFIED_FORBIDDEN_SURFACES)[number];
