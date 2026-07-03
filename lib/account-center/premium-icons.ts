/**
 * ROVEXO v1.0 — Account page premium 3D icon library.
 *
 * Single source of truth for the account-page realistic 3D icon family.
 * Assets live at public/icons/premium/account/{key}.{webp,png} and are exported
 * (with size variants) from approved masters in public/icons/premium/account/source/
 * via scripts/generate-account-premium-icons.mjs.
 *
 * The `saved` glyph deliberately reuses the shared nav asset so the "Saved Items"
 * tile matches the bottom-navigation family exactly (no duplicate render).
 */

export type AccountPremiumIconKey =
  | "shopping"
  | "wallet"
  | "security"
  | "analytics"
  | "marketplace"
  | "feedback"
  | "response"
  | "orders"
  | "cases"
  | "listings"
  | "messages"
  | "business"
  | "seller"
  | "buyer"
  | "settings"
  | "help"
  | "notification"
  | "eye"
  | "calendar"
  | "saved";

/** Keys we own masters for and export size variants of. `saved` is reused from /nav. */
export const ACCOUNT_PREMIUM_ICON_MASTERS: readonly Exclude<AccountPremiumIconKey, "saved">[] = [
  "shopping",
  "wallet",
  "security",
  "analytics",
  "marketplace",
  "feedback",
  "response",
  "orders",
  "cases",
  "listings",
  "messages",
  "business",
  "seller",
  "buyer",
  "settings",
  "help",
  "notification",
  "eye",
  "calendar",
];

const ACCOUNT_ICON_SIZES = [64, 128, 256] as const;

function base(key: AccountPremiumIconKey): string {
  return key === "saved" ? "/icons/premium/nav/saved" : `/icons/premium/account/${key}`;
}

export function getAccountIconWebp(key: AccountPremiumIconKey): string {
  return `${base(key)}.webp`;
}

export function getAccountIconPng(key: AccountPremiumIconKey): string {
  return `${base(key)}.png`;
}

export function getAccountIconSrcSet(key: AccountPremiumIconKey, format: "webp" | "png"): string {
  const root = base(key);
  const largest = ACCOUNT_ICON_SIZES[ACCOUNT_ICON_SIZES.length - 1];
  return ACCOUNT_ICON_SIZES.map((size) => {
    const path = size === largest ? `${root}.${format}` : `${root}-${size}.${format}`;
    return `${path} ${size}w`;
  }).join(", ");
}
