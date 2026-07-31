/**
 * ROVEXO MASTER FULL WIDTH CONTRACT v1.1
 * PERMANENTLY LOCKED · PROFILE = MASTER DESIGN SYSTEM (INTERNAL)
 *
 * DESIGN DECISION #001 (Owner APPROVED · ROVEXO v1.1):
 * - Homepage content container: 16px L/R (COD SÂNGE Spacing Standardization)
 * - Homepage header: 24px L/R (unchanged)
 * - Internal application (Profile tree + commerce shells): 16px L/R
 *
 * PROFILE + 100% FULL WIDTH + ALL MENU / SUBMENU PAGES = FINAL IMPLEMENTATION
 */

import {
  HOMEPAGE_PAD_X_PX,
  INTERNAL_PAD_X_PX,
} from "@/lib/design-system/design-decision-001-internal-ui-v1.1";

export const MASTER_FULL_WIDTH_CONTRACT_NAME = "ROVEXO MASTER FULL WIDTH CONTRACT" as const;
export const MASTER_FULL_WIDTH_CONTRACT_VERSION = "1.1" as const;
export const MASTER_FULL_WIDTH_CONTRACT_STATUS = "PERMANENTLY LOCKED" as const;
/** DOM stamp — unchanged so CSS selectors stay continuous; contract VERSION is 1.1. */
export const MASTER_FULL_WIDTH_CONTRACT_DOM = "v1.0-master-fw" as const;
export const MASTER_FULL_WIDTH_REFERENCE = "PROFILE" as const;

/** Official design tokens — Internal UI v1.1 (Owner Design Decision #001). */
export const MASTER_FULL_WIDTH_TOKENS = {
  headerPx: 64,
  primaryButtonPx: 56,
  radiusPx: 16,
  fullWidth: "100%",
  maxWidth: "none",
  primaryCtaWidth: "100%",
  /** Internal application horizontal page padding (Design Decision #001). */
  paddingLeftPx: INTERNAL_PAD_X_PX,
  paddingRightPx: INTERNAL_PAD_X_PX,
  /** Homepage content container horizontal padding — 16px (COD SÂNGE). */
  homepagePaddingLeftPx: HOMEPAGE_PAD_X_PX,
  homepagePaddingRightPx: HOMEPAGE_PAD_X_PX,
  topSpacingPx: 24,
  sectionSpacingPx: 24,
  inputHeightPx: 56,
  touchTargetMinPx: 44,
} as const;


export const MASTER_FULL_WIDTH_FORBIDDEN_WIDTHS = [
  "70%",
  "80%",
  "85%",
  "90%",
  "95%",
  "320px",
  "360px",
  "390px",
  "420px",
] as const;

export const MASTER_FULL_WIDTH_FORBIDDEN = [
  "centered layouts",
  "mini cards",
  "floating containers",
  "secondary layouts",
  "secondary design systems",
  ...MASTER_FULL_WIDTH_FORBIDDEN_WIDTHS,
] as const;

export const MASTER_FULL_WIDTH_INHERIT_FROM_PROFILE = [
  "typography",
  "colours",
  "radius",
  "paddings",
  "spacings",
  "shadows",
  "icons",
  "touch targets",
  "responsiveness",
  "animations",
  "buttons",
  "forms",
  "headers",
  "menu rows",
  "separators",
] as const;

/** Surfaces that MUST be 100% full width + Profile inheritance. */
export const MASTER_FULL_WIDTH_SURFACES = [
  "profile",
  "settings",
  "addresses",
  "ideas",
  "inbox-hub",
  "messages-hub",
  "wallet",
  "orders",
  "checkout",
  "shipping",
  "promotions",
  "help-centre",
  "legal-information",
  "holiday-mode",
  "notifications",
  "balance",
  "reviews",
  "favourites",
  "promote",
  "language",
  "security",
  "privacy",
  "payments",
  "transactions",
  "seller-settings",
  "business-settings",
  "shipping-settings",
  "verification",
  "currency",
  "seller-dashboard",
  "buyer-dashboard",
  "business-dashboard",
  "admin",
  "super-admin",
  "demo",
  "every-menu-page",
  "every-submenu-page",
] as const;

export const MASTER_FULL_WIDTH_GOLDEN_RULE =
  "PROFILE PAGE = ABSOLUTE MASTER DESIGN SYSTEM OF THE ENTIRE ROVEXO PLATFORM + 100% FULL WIDTH. ONLY CONTENT MAY CHANGE." as const;

export function masterFullWidthContractSnapshot() {
  return {
    name: MASTER_FULL_WIDTH_CONTRACT_NAME,
    version: MASTER_FULL_WIDTH_CONTRACT_VERSION,
    status: MASTER_FULL_WIDTH_CONTRACT_STATUS,
    dom: MASTER_FULL_WIDTH_CONTRACT_DOM,
    reference: MASTER_FULL_WIDTH_REFERENCE,
    tokens: MASTER_FULL_WIDTH_TOKENS,
    forbidden: [...MASTER_FULL_WIDTH_FORBIDDEN],
    inherit: [...MASTER_FULL_WIDTH_INHERIT_FROM_PROFILE],
    surfaces: [...MASTER_FULL_WIDTH_SURFACES],
    goldenRule: MASTER_FULL_WIDTH_GOLDEN_RULE,
    autoAudit: true,
    autoFix: true,
  } as const;
}
