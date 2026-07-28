/**
 * ROVEXO MY ACCOUNT PRIMARY BUTTON — Global Button Recovery v1.0
 * Functional Profile geometry: height 56 · radius 16 · font 16/600 · full width · purple
 */

import {
  PRIMARY_BUTTON_DOM,
  PRIMARY_BUTTON_TOKENS,
  PRIMARY_BUTTON_VERSION,
} from "@/lib/design-system/primary-button-v1";
import { MY_ACCOUNT_V1_BUTTON } from "@/lib/design-system/my-account-v1";
import { PROFILE_MASTER_FULL_WIDTH } from "@/lib/design-system/profile-master-tokens";

export const MY_ACCOUNT_PRIMARY_BUTTON_NAME = "ROVEXO MY ACCOUNT PRIMARY BUTTON" as const;
export const MY_ACCOUNT_PRIMARY_BUTTON_VERSION = PRIMARY_BUTTON_VERSION;
export const MY_ACCOUNT_PRIMARY_BUTTON_STATUS =
  "APPROVED · GLOBAL BUTTON RECOVERY v1.0" as const;
export const MY_ACCOUNT_PRIMARY_BUTTON_DOM = PRIMARY_BUTTON_DOM;

export const MY_ACCOUNT_PRIMARY_GRADIENT = PRIMARY_BUTTON_TOKENS.gradient;

export const MY_ACCOUNT_PRIMARY_GRADIENT_STOPS = [
  { color: "#a855f7", stop: "0%" },
  { color: "#9333ea", stop: "48%" },
  { color: "#7c3aed", stop: "100%" },
] as const;

export const MY_ACCOUNT_PRIMARY_BUTTON = {
  heightPx: PRIMARY_BUTTON_TOKENS.heightPx,
  radiusPx: PRIMARY_BUTTON_TOKENS.radiusPx,
  width: PRIMARY_BUTTON_TOKENS.width,
  gradient: PRIMARY_BUTTON_TOKENS.gradient,
  color: PRIMARY_BUTTON_TOKENS.color,
  borderColor: PRIMARY_BUTTON_TOKENS.borderColor,
  fontSizePx: PRIMARY_BUTTON_TOKENS.fontSizePx,
  fontWeight: PRIMARY_BUTTON_TOKENS.fontWeight,
  lineHeight: PRIMARY_BUTTON_TOKENS.lineHeight,
  shadow: PRIMARY_BUTTON_TOKENS.shadow,
  hoverFilter: "brightness(1.03)",
  activeScale: 0.97,
  disabledOpacity: 0.6,
  inheritsProfileTypography: true,
  inheritsGlobalButtonSystem: true,
  masterPage: "PROFILE" as const,
} as const;

export const MY_ACCOUNT_PRIMARY_CTA_LABELS = [
  "Add Address",
  "Add Business Address",
  "Save Address",
  "Save Changes",
  "Continue",
  "Verify Account",
  "Verify Business Account",
  "Confirm",
  "Submit",
  "Complete Verification",
  "Verify",
  "Add Card",
  "Withdraw",
] as const;

export const MY_ACCOUNT_PRIMARY_BUTTON_FORBIDDEN = [
  "blue buttons",
  "black buttons",
  "grey buttons",
  "different gradients",
  "different radius",
  "different heights",
  "second primary button system",
  "20px height",
] as const;

export const MY_ACCOUNT_PRIMARY_BUTTON_INHERITANCE = [
  "PROFILE",
  "GLOBAL BUTTON RECOVERY v1.0",
  "MASTER BUTTON SYSTEM",
  "ADDRESSES",
  "PERSONAL INFORMATION",
  "SETTINGS",
  "WALLET",
  "PAYMENT METHODS",
  "BANK ACCOUNTS",
  "CHECKOUT",
  "ORDERS",
  "ALL FUTURE PAGES",
] as const;

export const MY_ACCOUNT_PRIMARY_BUTTON_LOCKS = {
  permanentLock: true,
  approved: true,
  onePrimaryButtonSystem: true,
  onePrimaryColour: true,
  oneDesignSystem: true,
  onlyContentMayDiffer: true,
  designNeverDoes: true,
  heightMatchesProfileMaster:
    MY_ACCOUNT_PRIMARY_BUTTON.heightPx === PROFILE_MASTER_FULL_WIDTH.buttonHeightPx,
  radiusMatchesProfileMaster:
    MY_ACCOUNT_PRIMARY_BUTTON.radiusPx === PROFILE_MASTER_FULL_WIDTH.buttonRadiusPx,
  heightMatchesMyAccountButton: MY_ACCOUNT_PRIMARY_BUTTON.heightPx === MY_ACCOUNT_V1_BUTTON.heightPx,
} as const;

export function myAccountPrimaryButtonSnapshot() {
  return {
    name: MY_ACCOUNT_PRIMARY_BUTTON_NAME,
    version: MY_ACCOUNT_PRIMARY_BUTTON_VERSION,
    status: MY_ACCOUNT_PRIMARY_BUTTON_STATUS,
    dom: MY_ACCOUNT_PRIMARY_BUTTON_DOM,
    button: MY_ACCOUNT_PRIMARY_BUTTON,
    labels: [...MY_ACCOUNT_PRIMARY_CTA_LABELS],
    forbidden: [...MY_ACCOUNT_PRIMARY_BUTTON_FORBIDDEN],
    inheritance: [...MY_ACCOUNT_PRIMARY_BUTTON_INHERITANCE],
    locks: MY_ACCOUNT_PRIMARY_BUTTON_LOCKS,
    goldenRule:
      "ONE PRODUCT · ONE BUTTON SYSTEM · PrimaryButton · 56px · FULL WIDTH · PURPLE · Profile inheritance",
  } as const;
}
