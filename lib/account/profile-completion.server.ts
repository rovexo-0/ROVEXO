import "server-only";

import { createClient } from "@/lib/supabase/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import {
  buildProfileCompletionRedirect,
  sanitizeReturnToPath,
  type ProfileCompletionIntent,
  type ProfileCompletionStatus,
} from "@/lib/account/profile-completion";

const PROFILE_COMPLETION_SESSION_REQUIRED =
  "Profile completion requires an authenticated session for this user.";

/**
 * Cookie browsers: session client + RLS (user.id must match userId).
 * Native Bearer: no cookies; POST /api/listings already verified userId.
 * Same mutation client as listings upload (`tryCreateAdminClient ?? createClient`).
 * Queries stay scoped to userId. Cookie user mismatch still fails closed.
 */
async function profileCompletionQueryClient(userId: string) {
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();

  if (user?.id === userId) {
    return session;
  }
  if (user) {
    throw new Error(PROFILE_COMPLETION_SESSION_REQUIRED);
  }

  const mutation = tryCreateAdminClient();
  if (!mutation) {
    throw new Error(PROFILE_COMPLETION_SESSION_REQUIRED);
  }
  return mutation;
}

/**
 * Profile completion for the authenticated user.
 * Server-only — do not import from Client Components.
 */
export async function getProfileCompletionStatus(userId: string): Promise<ProfileCompletionStatus> {
  const supabase = await profileCompletionQueryClient(userId);

  const [addresses, payments, bank, purchases, listings] = await Promise.all([
    supabase
      .from("shipping_addresses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("payment_methods")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("withdraw_methods")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("provider", "bank_account")
      .eq("connected", true),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", userId)
      .in("status", ["awaiting_shipment", "shipped", "delivered", "completed"]),
    supabase
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
