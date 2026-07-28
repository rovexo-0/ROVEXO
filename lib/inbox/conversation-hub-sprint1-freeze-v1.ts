/**
 * ROVEXO Conversation Hub — Sprint 1 FREEZE (Owner approved)
 * Child of MASTER BUYER CONVERSATION HUB FREEZE v1.0
 *
 * STATUS: APPROVED · FROZEN · 2026-07-23
 * ONE ORDER = ONE TIMELINE = ONE TRANSACTION HUB
 *
 * Sticky CTA canonical label = BUY NOW • £final_total (Master Freeze).
 */

import {
  MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1,
  formatBuyNowLabel,
  formatPayNowLabel,
} from "@/lib/inbox/master-buyer-conversation-hub-freeze-v1";

export {
  MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1,
  formatBuyNowLabel,
  formatPayNowLabel,
};

export const CONVERSATION_HUB_SPRINT1_FREEZE = {
  version: "v1.0-sprint1-freeze",
  status: "FROZEN",
  approved: true,
  approvedAt: "2026-07-23",
  surface: "/inbox/conversation/[conversationId]",
  component: "features/inbox/components/ConversationHub.tsx",
  parent: MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.ssot.code,
} as const;

/** Sticky CTA separator — Master Freeze bullet • */
export const PAY_NOW_SEPARATOR = MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.stickyCta.separator;

export const CONVERSATION_HUB_SPRINT1_BUYER_VISIBLE = [
  "item_price",
  "shipping_price",
  "platform_fee",
  "total_buyer_pays",
  "buy_now",
  "order_status",
  "offer_history",
  "messages",
  "tracking_information",
  "review_information",
] as const;

export const CONVERSATION_HUB_SPRINT1_SELLER_VISIBLE = [
  "selling_price",
  "offer_history",
  "messages",
  "order_status",
  "tracking_information",
  "payment_released",
  "wallet_updates",
] as const;

/** Seller must never render these buyer-only money surfaces. */
export const CONVERSATION_HUB_SPRINT1_SELLER_FORBIDDEN =
  MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.sellerMustNeverSee;

/**
 * Canonical buyer equation (Owner / Master Freeze):
 * Item + Shipping + Platform Fee = Total Buyer Pays → BUY NOW • £total
 */
export const CONVERSATION_HUB_SPRINT1_CANONICAL_RULE = {
  buyerSeesItemShippingFeeTotal: true,
  buyNowAlwaysFinalBuyerTotal: true,
  sellerNeverSeesBuyerTotalOrFee: true,
  paymentReleaseAutomatic: true,
  adminOptionalOnly: true,
  automationTarget: "100%",
} as const;

export const CONVERSATION_HUB_SPRINT1_BUYER_FLOW =
  MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.paymentFlow;

export const CONVERSATION_HUB_SPRINT1_SELLER_FLOW = [
  "RECEIVE_OFFER",
  "ACCEPT_OR_DECLINE",
  "BUYER_PAID",
  "PRINT_LABEL",
  "PREPARE_PARCEL",
  "TRACK_PARCEL",
  "DELIVERED",
  "PAYMENT_PENDING_RELEASE",
  "PAYMENT_RELEASED",
  "LEAVE_REVIEW",
  "TRANSACTION_COMPLETED",
] as const;

export const CONVERSATION_HUB_SPRINT1_PAYMENT_RELEASE_FLOW = [
  "BUYER_PAID",
  "LABEL_GENERATED",
  "CARRIER_SCANNED",
  "TRACKING_UPDATED",
  "DELIVERED",
  "48H_PROTECTION_PERIOD",
  "EVERYTHING_OK",
  "AUTOMATIC_PAYMENT_RELEASE",
  "WALLET_UPDATED",
  "NOTIFICATIONS_SENT",
  "TRANSACTION_COMPLETED",
] as const;

export function isSellerForbiddenMoneySurface(
  surface: (typeof CONVERSATION_HUB_SPRINT1_SELLER_FORBIDDEN)[number],
): true {
  void surface;
  return true;
}
