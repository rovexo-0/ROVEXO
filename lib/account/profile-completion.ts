export const PROFILE_RETURN_TO_PARAM = "returnTo";

export type ProfileCompletionGap = "address" | "payment" | "bank";

export type ProfileCompletionIntent = "checkout" | "publish" | "withdraw";

export type ProfileCompletionStatus = {
  hasAddress: boolean;
  hasPaymentMethod: boolean;
  hasBankAccount: boolean;
  hasCompletedPurchase: boolean;
  hasPublishedListing: boolean;
  isBuyerVerified: boolean;
  isSellerVerified: boolean;
  showVerifiedBadge: boolean;
};

const SETTINGS_PATHS: Record<ProfileCompletionGap, string> = {
  address: "/account/addresses",
  payment: "/wallet/payment-methods",
  bank: "/wallet/bank-accounts",
};

export function sanitizeReturnToPath(
  returnTo: string | null | undefined,
  fallback = "/account",
): string {
  if (!returnTo?.trim()) return fallback;
  const trimmed = returnTo.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  return trimmed;
}

export function buildProfileCompletionRedirect(
  gap: ProfileCompletionGap,
  returnTo: string,
): string {
  const safeReturn = sanitizeReturnToPath(returnTo);
  const params = new URLSearchParams({ [PROFILE_RETURN_TO_PARAM]: safeReturn });
  if (gap === "bank" && safeReturn.startsWith("/business/")) {
    params.set("sellerContext", "business");
  }
  return `${SETTINGS_PATHS[gap]}?${params.toString()}`;
}
