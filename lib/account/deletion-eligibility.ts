import { createClient } from "@/lib/supabase/server";
import { getWalletData } from "@/lib/wallet/store";

export type AccountDeletionBlocker = {
  code: string;
  message: string;
};

export type AccountDeletionEligibility = {
  canDelete: boolean;
  blockers: AccountDeletionBlocker[];
};

const ACTIVE_ORDER_STATUSES = [
  "awaiting_payment",
  "awaiting_shipment",
  "shipped",
  "delivered",
  "issue_open",
] as const;

const ACTIVE_LISTING_STATUSES = ["published", "paused"] as const;

const OPEN_PROTECTION_STATUSES = [
  "open",
  "awaiting_seller",
  "awaiting_buyer",
  "under_review",
  "appealed",
] as const;

const ACTIVE_SHIPMENT_STATUSES = [
  "label_created",
  "dispatched",
  "in_transit",
  "out_for_delivery",
] as const;

export async function getAccountDeletionEligibility(userId: string): Promise<AccountDeletionEligibility> {
  const supabase = await createClient();
  const blockers: AccountDeletionBlocker[] = [];

  const wallet = await getWalletData(userId);
  if (wallet.availableBalance > 0) {
    blockers.push({
      code: "wallet_balance",
      message: "Withdraw your available wallet balance first.",
    });
  }
  if (wallet.pendingBalance > 0) {
    blockers.push({
      code: "pending_balance",
      message: "Pending wallet funds must settle before deletion.",
    });
  }

  const { count: pendingWithdrawals } = await supabase
    .from("wallet_transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", "withdrawal")
    .eq("status", "pending");

  if ((pendingWithdrawals ?? 0) > 0) {
    blockers.push({
      code: "pending_withdrawals",
      message: "A withdrawal is still processing.",
    });
  }

  const { count: activeBuyerOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("buyer_id", userId)
    .in("status", [...ACTIVE_ORDER_STATUSES]);

  const { count: activeSellerOrders } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", userId)
    .in("status", [...ACTIVE_ORDER_STATUSES]);

  if ((activeBuyerOrders ?? 0) + (activeSellerOrders ?? 0) > 0) {
    blockers.push({
      code: "active_orders",
      message: "Complete or cancel all active orders first.",
    });
  }

  const { count: activeListings } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("seller_id", userId)
    .in("status", [...ACTIVE_LISTING_STATUSES]);

  if ((activeListings ?? 0) > 0) {
    blockers.push({
      code: "active_listings",
      message: "End or remove active listings with ongoing transactions.",
    });
  }

  const { count: openProtectionCases } = await supabase
    .from("protection_cases")
    .select("id", { count: "exact", head: true })
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .in("status", [...OPEN_PROTECTION_STATUSES]);

  if ((openProtectionCases ?? 0) > 0) {
    blockers.push({
      code: "returns_disputes",
      message: "Resolve open returns, refunds, or disputes before deleting your account.",
    });
  }

  const { data: userOrders } = await supabase
    .from("orders")
    .select("id")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

  const orderIds = (userOrders ?? []).map((order) => order.id);
  if (orderIds.length > 0) {
    const { count: activeShipments } = await supabase
      .from("order_shipments")
      .select("id", { count: "exact", head: true })
      .in("order_id", orderIds)
      .in("status", [...ACTIVE_SHIPMENT_STATUSES]);

    if ((activeShipments ?? 0) > 0) {
      blockers.push({
        code: "active_shipments",
        message: "Wait until active shipments are delivered.",
      });
    }
  }

  return {
    canDelete: blockers.length === 0,
    blockers,
  };
}
