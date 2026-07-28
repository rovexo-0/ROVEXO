/**
 * ROVEXO Absolute Authority — PROFILE ABSOLUTE MASTER DESIGN SYSTEM v7.0
 *
 * PERMANENT: Profile page is the master design system of the entire platform.
 * ONLY CONTENT MAY CHANGE. DESIGN MAY NOT CHANGE without Owner approval.
 *
 * SSOT tokens: profile-master-tokens.ts + full-width-engine-v1.css + AccountCanonicalShell
 */

import {
  PROFILE_MASTER_FULL_WIDTH,
  PROFILE_MASTER_HUB,
  PROFILE_MASTER_ROW,
  profileMasterTokensSnapshot,
} from "@/lib/design-system/profile-master-tokens";
import { MASTER_FULL_WIDTH_TOKENS } from "@/lib/master-engine/master-full-width-contract-v1";

export const PROFILE_ABSOLUTE_MASTER_CONTRACT = "v7.0" as const;
export const PROFILE_ABSOLUTE_MASTER_STATUS = "PERMANENTLY LOCKED" as const;
export const PROFILE_ABSOLUTE_MASTER_REFERENCE = "PROFILE" as const;

export const PROFILE_ABSOLUTE_MASTER_GOLDEN_RULE =
  "PROFILE PAGE = ABSOLUTE MASTER DESIGN SYSTEM OF THE ENTIRE ROVEXO PLATFORM. ONLY CONTENT MAY CHANGE." as const;

/** Every module must inherit Profile design (content may differ). */
export const PROFILE_ABSOLUTE_MASTER_MODULES = [
  "profile",
  "wallet",
  "orders",
  "checkout",
  "shipping",
  "messages-hub",
  "notifications",
  "transactions",
  "settings",
  "privacy",
  "security",
  "verification",
  "addresses",
  "seller-dashboard",
  "buyer-dashboard",
  "business-dashboard",
  "admin",
  "super-admin",
  "demo",
] as const;

export const PROFILE_ABSOLUTE_MASTER_FORBIDDEN = [
  "duplicated UI",
  "giant cards",
  "giant buttons",
  "desktop first",
  "centered layouts",
  "max-width 800px",
  "max-width 1000px",
  "max-width 1200px",
  "dead buttons",
  "fake integrations",
  "dummy data",
  "secondary design systems",
] as const;

export const PROFILE_ABSOLUTE_MASTER_TOKENS = {
  background: PROFILE_MASTER_HUB.background,
  width: PROFILE_MASTER_FULL_WIDTH.width,
  maxWidth: "none",
  headerPx: PROFILE_MASTER_FULL_WIDTH.headerHeightPx,
  rowMinHeightPx: PROFILE_MASTER_ROW.minHeightPx,
  buttonHeightPx: PROFILE_MASTER_FULL_WIDTH.buttonHeightPx,
  buttonRadiusPx: PROFILE_MASTER_FULL_WIDTH.buttonRadiusPx,
  paddingPx: PROFILE_MASTER_FULL_WIDTH.paddingPx,
  mobileFirst: true,
  fullWidth: true,
  purpleTheme: true,
  whiteBackground: true,
} as const;

/** Fail-closed: Profile tokens must match Full Width contract. */
export function assertProfileAbsoluteMasterAligned(): boolean {
  return (
    PROFILE_ABSOLUTE_MASTER_TOKENS.headerPx === MASTER_FULL_WIDTH_TOKENS.headerPx &&
    PROFILE_ABSOLUTE_MASTER_TOKENS.buttonHeightPx === MASTER_FULL_WIDTH_TOKENS.primaryButtonPx &&
    PROFILE_ABSOLUTE_MASTER_TOKENS.buttonRadiusPx === MASTER_FULL_WIDTH_TOKENS.radiusPx &&
    PROFILE_ABSOLUTE_MASTER_TOKENS.paddingPx === MASTER_FULL_WIDTH_TOKENS.paddingLeftPx &&
    MASTER_FULL_WIDTH_TOKENS.maxWidth === "none"
  );
}

export function profileAbsoluteMasterSnapshot() {
  return {
    contract: PROFILE_ABSOLUTE_MASTER_CONTRACT,
    status: PROFILE_ABSOLUTE_MASTER_STATUS,
    reference: PROFILE_ABSOLUTE_MASTER_REFERENCE,
    goldenRule: PROFILE_ABSOLUTE_MASTER_GOLDEN_RULE,
    modules: [...PROFILE_ABSOLUTE_MASTER_MODULES],
    forbidden: [...PROFILE_ABSOLUTE_MASTER_FORBIDDEN],
    tokens: PROFILE_ABSOLUTE_MASTER_TOKENS,
    aligned: assertProfileAbsoluteMasterAligned(),
    profileTokens: profileMasterTokensSnapshot(),
  } as const;
}
