/**
 * Conversation Hub — Sprint 1 payment / product card SSOT.
 * FREEZE APPROVED (Owner 2026-07-23) — see conversation-hub-sprint1-freeze-v1.ts
 * One order · one timeline · buyer ≠ seller UI.
 * Seller never sees Platform Fee or Total Buyer Pays.
 */

import {
  formatPayNowLabel,
} from "@/lib/inbox/conversation-hub-sprint1-freeze-v1";
import { calculatePlatformFee } from "@/lib/orders/pricing";
import type { SenderRole } from "@/lib/messages/types";
import type { Order, OrderStatus } from "@/lib/orders/types";

export const CONVERSATION_PAYMENT_SPRINT1 = "v1.0-sprint1-freeze" as const;

export type Sprint1BuyerBreakdown = {
  itemPrice: number;
  shipping: number;
  shippingPending: boolean;
  platformFee: number;
  total: number;
};

export function buyerPaysTotal(itemPrice: number, shipping = 0): number {
  const fee = calculatePlatformFee(itemPrice);
  return Math.round((itemPrice + fee + shipping) * 100) / 100;
}

/** Prefer order totals when present; else listing/offer price + buyer fee. */
export function resolveSprint1ItemPrice(input: {
  order: Order | null | undefined;
  acceptedOfferAmount?: number | null;
  listingPrice: number;
}): number {
  if (input.order?.totals?.itemPrice != null && input.order.totals.itemPrice > 0) {
    return input.order.totals.itemPrice;
  }
  if (input.acceptedOfferAmount != null && input.acceptedOfferAmount > 0) {
    return input.acceptedOfferAmount;
  }
  return input.listingPrice;
}

export function resolveSprint1BuyerBreakdown(input: {
  order: Order | null | undefined;
  itemPrice: number;
}): Sprint1BuyerBreakdown {
  const itemPrice = input.itemPrice;
  const orderTotals = input.order?.totals;
  const platformFee =
    orderTotals?.platformFee != null && orderTotals.platformFee >= 0
      ? orderTotals.platformFee
      : calculatePlatformFee(itemPrice);
  const shippingPending = Boolean(orderTotals?.deliveryPending) || !orderTotals;
  const shipping =
    shippingPending || orderTotals?.delivery == null ? 0 : orderTotals.delivery;
  const total =
    orderTotals?.total != null && orderTotals.total > 0
      ? orderTotals.total
      : buyerPaysTotal(itemPrice, shipping);

  return {
    itemPrice,
    shipping,
    shippingPending: Boolean(orderTotals?.deliveryPending) || (!input.order && shipping === 0),
    platformFee,
    total,
  };
}

export function resolveSprint1BuyerTotal(input: {
  order: Order | null | undefined;
  itemPrice: number;
}): number {
  return resolveSprint1BuyerBreakdown(input).total;
}

/** Seller receives listing/accepted price — never platform fee. */
export function resolveSprint1SellerReceive(itemPrice: number): number {
  return Math.round(itemPrice * 100) / 100;
}

export type Sprint1PaymentLabels = {
  priceLabel: string;
  priceValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  showBuyerFeeInfo: boolean;
  /** Buyer-only money rows — never pass to seller UI. */
  buyerBreakdown: Sprint1BuyerBreakdown | null;
  statusLabel: string;
  stickyLabel: string;
  stickyDisabled: boolean;
  stickyAmount: number | null;
};

function formatGbp(amount: number): string {
  return `£${amount.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function resolveSprint1ConversationStatus(input: {
  viewerRole: SenderRole;
  orderStatus: OrderStatus | null | undefined;
  hasAcceptedOffer: boolean;
  hasOrder: boolean;
}): string {
  const { viewerRole, orderStatus, hasAcceptedOffer, hasOrder } = input;

  if (!hasOrder && hasAcceptedOffer) {
    return viewerRole === "buyer" ? "Awaiting payment" : "Waiting buyer payment.";
  }

  if (!orderStatus) {
    return viewerRole === "buyer" ? "Available" : "Listed";
  }

  if (orderStatus === "awaiting_payment") {
    return viewerRole === "buyer" ? "Awaiting payment" : "Waiting buyer payment.";
  }

  if (
    orderStatus === "awaiting_shipment" ||
    orderStatus === "shipped" ||
    orderStatus === "delivered"
  ) {
    return viewerRole === "buyer" ? "Paid" : "Buyer paid";
  }

  if (orderStatus === "completed") return "Completed";
  if (orderStatus === "cancelled") return "Cancelled";
  if (orderStatus === "issue_open") return "Issue open";

  return viewerRole === "buyer" ? "Awaiting payment" : "Waiting buyer payment.";
}

export function resolveSprint1PaymentUi(input: {
  viewerRole: SenderRole;
  order: Order | null | undefined;
  listingPrice: number;
  acceptedOfferAmount?: number | null;
}): Sprint1PaymentLabels {
  const itemPrice = resolveSprint1ItemPrice({
    order: input.order,
    acceptedOfferAmount: input.acceptedOfferAmount,
    listingPrice: input.listingPrice,
  });
  const buyerBreakdown = resolveSprint1BuyerBreakdown({ order: input.order, itemPrice });
  const sellerReceive = resolveSprint1SellerReceive(itemPrice);
  const hasAcceptedOffer = input.acceptedOfferAmount != null && input.acceptedOfferAmount > 0;
  const statusLabel = resolveSprint1ConversationStatus({
    viewerRole: input.viewerRole,
    orderStatus: input.order?.status ?? null,
    hasAcceptedOffer,
    hasOrder: Boolean(input.order),
  });

  const awaitingPayment =
    input.order?.status === "awaiting_payment" || (!input.order && hasAcceptedOffer);

  if (input.viewerRole === "seller") {
    return {
      priceLabel: "Selling price",
      priceValue: formatGbp(itemPrice),
      secondaryLabel: "You will receive",
      secondaryValue: formatGbp(sellerReceive),
      showBuyerFeeInfo: false,
      buyerBreakdown: null,
      statusLabel,
      stickyLabel: awaitingPayment ? "Waiting for payment" : "",
      stickyDisabled: true,
      stickyAmount: null,
    };
  }

  return {
    priceLabel: "Item price",
    priceValue: formatGbp(itemPrice),
    secondaryLabel: "Total buyer pays",
    secondaryValue: `${formatGbp(buyerBreakdown.total)} incl.`,
    showBuyerFeeInfo: true,
    buyerBreakdown,
    statusLabel,
    stickyLabel: awaitingPayment ? formatPayNowLabel(buyerBreakdown.total) : "",
    stickyDisabled: false,
    stickyAmount: awaitingPayment ? buyerBreakdown.total : null,
  };
}

export function formatOfferHistoryLine(input: {
  amount: number;
  state: "accepted" | "declined" | "expired" | "open" | "countered";
}): string | null {
  if (input.state === "open") return null;
  const amount = formatGbp(input.amount);
  if (input.state === "accepted") return `${amount} Accepted`;
  if (input.state === "declined") return `${amount} Declined`;
  if (input.state === "expired") return `${amount} Expired`;
  if (input.state === "countered") return `${amount} Countered`;
  return null;
}
