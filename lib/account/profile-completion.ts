import { createAdminClient } from "@/lib/supabase/admin";

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
  bank: "/wallet/bank-account",
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
  return `${SETTINGS_PATHS[gap]}?${params.toString()}`;
}

export async function getProfileCompletionStatus(userId: string): Promise<ProfileCompletionStatus> {
  const admin = createAdminClient();

  const [addresses, payments, bank, purchases, listings] = await Promise.all([
    admin
      .from("shipping_addresses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    admin
      .from("payment_methods")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    admin
      .from("withdraw_methods")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("provider", "bank_account")
      .eq("connected", true),
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", userId)
      .in("status", ["awaiting_shipment", "shipped", "delivered", "completed"]),
    admin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", userId)
      .eq("status", "published"),
  ]);

  const hasAddress = (addresses.count ?? 0) > 0;
  const hasPaymentMethod = (payments.count ?? 0) > 0;
  const hasBankAccount = (bank.count ?? 0) > 0;
  const hasCompletedPurchase = (purchases.count ?? 0) > 0;
  const hasPublishedListing = (listings.count ?? 0) > 0;

  const isBuyerVerified = hasAddress && hasPaymentMethod;
  const isSellerVerified = hasAddress && hasPaymentMethod && hasBankAccount;
  const showVerifiedBadge = hasPublishedListing ? isSellerVerified : isBuyerVerified;

  return {
    hasAddress,
    hasPaymentMethod,
    hasBankAccount,
    hasCompletedPurchase,
    hasPublishedListing,
    isBuyerVerified,
    isSellerVerified,
    showVerifiedBadge,
  };
}

export async function resolveProfileCompletionRedirect(
  userId: string,
  intent: ProfileCompletionIntent,
  returnTo: string,
): Promise<string | null> {
  const status = await getProfileCompletionStatus(userId);
  const safeReturn = sanitizeReturnToPath(returnTo);

  if (intent === "checkout") {
    if (status.hasCompletedPurchase) return null;
    if (!status.hasAddress) return buildProfileCompletionRedirect("address", safeReturn);
    if (!status.hasPaymentMethod) return buildProfileCompletionRedirect("payment", safeReturn);
    return null;
  }

  if (intent === "publish") {
    if (status.hasPublishedListing) return null;
    if (!status.hasBankAccount) return buildProfileCompletionRedirect("bank", safeReturn);
    return null;
  }

  if (intent === "withdraw") {
    if (!status.hasBankAccount) return buildProfileCompletionRedirect("bank", safeReturn);
    return null;
  }

  return null;
}
