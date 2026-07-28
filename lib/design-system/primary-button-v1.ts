/**
 * ROVEXO GLOBAL BUTTON RECOVERY v1.0 — Absolute Authority
 *
 * Restores original functional primary CTA geometry (Profile master)
 * while keeping: PrimaryButton SSOT · purple theme · Full Width · Profile inheritance.
 *
 * Recovered (functional): height 56 · radius 16 · font 16/600 · full width · purple
 * Regression removed: 20px unusable height
 */

export const PRIMARY_BUTTON_SYSTEM_NAME = "ROVEXO GLOBAL BUTTON SYSTEM" as const;
export const PRIMARY_BUTTON_VERSION = "v1.1-recovery" as const;
export const PRIMARY_BUTTON_DOM = "v1.0-global-primary" as const;
export const PRIMARY_BUTTON_STATUS = "RECOVERY v1.0 · FUNCTIONAL · CANONICAL" as const;

/** Profile / Settings original functional primary CTA tokens. */
export const PRIMARY_BUTTON_TOKENS = {
  heightPx: 56,
  radiusPx: 16,
  fontSizePx: 16,
  fontWeight: 600,
  paddingInlinePx: 24,
  width: "100%" as const,
  color: "#ffffff",
  gradient: "linear-gradient(135deg, #a855f7 0%, #9333ea 48%, #7c3aed 100%)",
  borderColor: "rgb(124 58 237 / 0.35)",
  shadow:
    "0 1px 2px rgb(109 40 217 / 0.12), 0 5px 14px rgb(147 51 234 / 0.2), inset 0 1px 0 rgb(255 255 255 / 0.22)",
  lineHeight: 1,
} as const;

/** Unusable / broken primary heights after the 20px experiment. */
export const PRIMARY_BUTTON_FORBIDDEN_HEIGHTS_PX = [20] as const;

export const PRIMARY_BUTTON_SURFACES = [
  "Wallet",
  "Checkout",
  "Orders",
  "Transactions",
  "Payment Methods",
  "Bank Accounts",
  "Withdraw",
  "Refunds",
  "Disputes",
  "Sell",
  "Profile",
  "Settings",
  "Admin",
  "Business Dashboard",
  "Seller Dashboard",
  "Buyer Dashboard",
  "Future Modules",
] as const;

export const PRIMARY_BUTTON_LABELS = [
  "Add Card",
  "Withdraw",
  "Add Bank Account",
  "Save",
  "Continue",
  "Pay Securely",
  "Confirm",
  "Checkout",
  "Create Listing",
  "Update",
  "Submit",
  "Add Address",
  "Add New Card",
] as const;

export function primaryButtonSnapshot() {
  return {
    name: PRIMARY_BUTTON_SYSTEM_NAME,
    version: PRIMARY_BUTTON_VERSION,
    status: PRIMARY_BUTTON_STATUS,
    dom: PRIMARY_BUTTON_DOM,
    tokens: PRIMARY_BUTTON_TOKENS,
    forbiddenHeights: [...PRIMARY_BUTTON_FORBIDDEN_HEIGHTS_PX],
    surfaces: [...PRIMARY_BUTTON_SURFACES],
    labels: [...PRIMARY_BUTTON_LABELS],
    goldenRule:
      "RECOVERY: PrimaryButton · 56px · radius 16 · full width · purple · Profile inheritance · original function",
  } as const;
}
