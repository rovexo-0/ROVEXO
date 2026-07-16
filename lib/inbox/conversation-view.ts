/**
 * Conversation Hub view model — Sprint 3 SSOT.
 * Order rail: Paid · Prep · Ship · Done · Paid (compact labels; step ids unchanged)
 */

import type { ChatMessage, Conversation, ConversationProduct, SenderRole } from "@/lib/messages/types";
import type { OrderReference } from "@/lib/inbox/types";
import { getViewerRole } from "@/lib/messages/types";
import type { Order, OrderStatus } from "@/lib/orders/types";
import { getOrderStatusLabel, getTrackingUrl } from "@/lib/orders/status";

export const CONVERSATION_HUB_VERSION = "v1.0-frozen" as const;

/** Order status rail — aligned with Orders nomenclature + Completed. */
export const CONVERSATION_ORDER_STATUS_STEPS = [
  "paid",
  "packed",
  "shipped",
  "delivered",
  "completed",
] as const;

export type ConversationOrderStatusStepId = (typeof CONVERSATION_ORDER_STATUS_STEPS)[number];

export type ConversationOrderStatusStep = {
  id: ConversationOrderStatusStepId;
  label: string;
  state: "complete" | "current" | "future";
};

export type ConversationSystemEventType =
  | "payment_confirmed"
  | "tracking_added"
  | "delivered"
  | "refund"
  | "cancelled"
  | "dispute_started"
  | "offer_accepted"
  | "offer_declined"
  | "payment_received"
  | "label_created"
  | "parcel_collected"
  | "tracking_updated"
  | "parcel_delivered"
  | "refund_issued"
  | "refund_completed"
  | "review_available";

export type ConversationOfferState = "open" | "accepted" | "declined" | "expired" | "countered";

export type ConversationOfferView = {
  id: string;
  amount: number;
  currency: string;
  state: ConversationOfferState;
  fromRole: SenderRole;
  createdAt: string;
  expiresAt?: string | null;
};

export type ConversationTrackingView = {
  courierName: string;
  courierLogoUrl?: string | null;
  trackingNumber: string;
  statusLabel: string;
  latestScan?: string | null;
  estimatedDelivery?: string | null;
  carrierUrl?: string | null;
};

export type ConversationDisputeView = {
  id: string;
  status: "open" | "under_review" | "resolved";
  title: string;
  updatedAt: string;
  decisionSummary?: string | null;
  evidenceCount?: number;
};

export type ConversationAttachmentView = {
  id: string;
  label: string;
  kind: "photo" | "shipping_label" | "invoice" | "proof_of_dispatch" | "proof_of_delivery";
  url: string;
};

export type ConversationTimelineItem =
  | { kind: "day"; id: string; label: string }
  | { kind: "message"; id: string; at: string; message: ChatMessage }
  | {
      kind: "system";
      id: string;
      at: string;
      event: ConversationSystemEventType;
      title: string;
      subtitle?: string;
    }
  | { kind: "offer"; id: string; at: string; offer: ConversationOfferView };

export type ConversationDynamicAction = {
  id:
    | "add_tracking"
    | "confirm_shipment"
    | "confirm_received"
    | "leave_feedback"
    | "report_issue"
    | "open_dispute"
    | "print_label"
    | "upload_proof"
    | "confirm_delivery"
    | "leave_review"
    | "confirm_dispatch";
  label: string;
  role: SenderRole | "both";
};

export type ConversationHubView = {
  conversationId: string;
  viewerRole: SenderRole;
  product: ConversationProduct;
  participantName: string;
  participantAvatarUrl?: string | null;
  orderReference: OrderReference;
  orderStatusLabel: string;
  orderDetailsHref: string;
  buyerName: string;
  sellerName: string;
  sellerAvatarUrl?: string | null;
  statusSteps: ConversationOrderStatusStep[];
  timeline: ConversationTimelineItem[];
  tracking: ConversationTrackingView | null;
  offers: ConversationOfferView[];
  dispute: ConversationDisputeView | null;
  attachments: ConversationAttachmentView[];
  dynamicActions: ConversationDynamicAction[];
  typingLabel: string | null;
  hasOrder: boolean;
};

const STEP_LABELS: Record<ConversationOrderStatusStepId, string> = {
  paid: "Paid",
  packed: "Prep",
  shipped: "Ship",
  delivered: "Done",
  completed: "Paid",
};

const SYSTEM_EVENT_COPY: Record<ConversationSystemEventType, { title: string; subtitle: string }> = {
  payment_confirmed: { title: "Payment confirmed", subtitle: "Order payment was successful" },
  tracking_added: { title: "Tracking added", subtitle: "A tracking number is available" },
  delivered: { title: "Delivered", subtitle: "Parcel marked as delivered" },
  refund: { title: "Refund", subtitle: "A refund was issued for this order" },
  cancelled: { title: "Cancelled", subtitle: "This order was cancelled" },
  dispute_started: { title: "Dispute started", subtitle: "A transaction dispute is open" },
  offer_accepted: { title: "Offer accepted", subtitle: "An offer was accepted" },
  offer_declined: { title: "Offer declined", subtitle: "An offer was declined" },
  payment_received: { title: "Payment received", subtitle: "Funds secured for this order" },
  label_created: { title: "Label created", subtitle: "Shipping label is ready" },
  parcel_collected: { title: "Parcel collected", subtitle: "Courier has the parcel" },
  tracking_updated: { title: "Tracking updated", subtitle: "New scan from the carrier" },
  parcel_delivered: { title: "Parcel delivered", subtitle: "Marked as delivered" },
  refund_issued: { title: "Refund issued", subtitle: "Refund is being processed" },
  refund_completed: { title: "Refund completed", subtitle: "Buyer has been refunded" },
  review_available: { title: "Review available", subtitle: "Share feedback on this order" },
};

function dayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date);
}

function progressFromOrderStatus(status: OrderStatus | null | undefined): number {
  if (!status) return -1;
  switch (status) {
    case "cancelled":
      return -1;
    case "awaiting_payment":
      return 0;
    case "awaiting_shipment":
      return 1;
    case "shipped":
      return 2;
    case "delivered":
    case "issue_open":
      return 3;
    case "completed":
      return 4;
    default:
      return -1;
  }
}

function progressFromProduct(status: ConversationProduct["status"]): number {
  switch (status) {
    case "sold":
      return 4;
    case "paused":
      return 1;
    case "draft":
    case "published":
    default:
      return -1;
  }
}

function statusLabelFromProduct(status: ConversationProduct["status"]): string {
  switch (status) {
    case "sold":
      return "Completed";
    case "paused":
      return "Packed";
    case "draft":
      return "Draft";
    case "published":
    default:
      return "Active";
  }
}

function buildOrderReference(
  conversation: Conversation,
  order?: Order | null,
  orderReference?: OrderReference | null,
): OrderReference {
  if (orderReference?.orderId) return orderReference;
  if (order) {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      statusLabel: getOrderStatusLabel(order.status),
    };
  }
  return {
    orderId: conversation.product.id,
    orderNumber: `RX-${conversation.product.id.slice(0, 8).toUpperCase()}`,
    statusLabel: statusLabelFromProduct(conversation.product.status),
  };
}

export function buildOrderStatusSteps(
  productStatus: ConversationProduct["status"],
  orderStatus?: OrderStatus | null,
): ConversationOrderStatusStep[] {
  const progress =
    orderStatus != null ? progressFromOrderStatus(orderStatus) : progressFromProduct(productStatus);

  return CONVERSATION_ORDER_STATUS_STEPS.map((id, index) => {
    let state: ConversationOrderStatusStep["state"] = "future";
    if (progress < 0) state = "future";
    else if (progress > index) state = "complete";
    else if (progress === index) state = "current";
    return { id, label: STEP_LABELS[id], state };
  });
}

function buildSystemEventsFromOrder(order: Order | null | undefined): ConversationTimelineItem[] {
  if (!order) return [];
  const items: ConversationTimelineItem[] = [];

  if (order.paidAt) {
    items.push({
      kind: "system",
      id: `system-payment-${order.id}`,
      at: order.paidAt,
      event: "payment_confirmed",
      title: SYSTEM_EVENT_COPY.payment_confirmed.title,
      subtitle: SYSTEM_EVENT_COPY.payment_confirmed.subtitle,
    });
  }
  if (order.trackingNumber && order.shippedAt) {
    items.push({
      kind: "system",
      id: `system-tracking-${order.id}`,
      at: order.shippedAt,
      event: "tracking_added",
      title: SYSTEM_EVENT_COPY.tracking_added.title,
      subtitle: `Tracking ${order.trackingNumber}`,
    });
  }
  if (order.deliveredAt) {
    items.push({
      kind: "system",
      id: `system-delivered-${order.id}`,
      at: order.deliveredAt,
      event: "delivered",
      title: SYSTEM_EVENT_COPY.delivered.title,
      subtitle: SYSTEM_EVENT_COPY.delivered.subtitle,
    });
  }
  if (order.refundedAt) {
    items.push({
      kind: "system",
      id: `system-refund-${order.id}`,
      at: order.refundedAt,
      event: "refund",
      title: SYSTEM_EVENT_COPY.refund.title,
      subtitle: SYSTEM_EVENT_COPY.refund.subtitle,
    });
  }
  if (order.cancelledAt) {
    items.push({
      kind: "system",
      id: `system-cancelled-${order.id}`,
      at: order.cancelledAt,
      event: "cancelled",
      title: SYSTEM_EVENT_COPY.cancelled.title,
      subtitle: order.cancellationReason ?? SYSTEM_EVENT_COPY.cancelled.subtitle,
    });
  }
  if (order.status === "issue_open") {
    items.push({
      kind: "system",
      id: `system-dispute-${order.id}`,
      at: order.deliveredAt ?? order.shippedAt ?? order.createdAt,
      event: "dispute_started",
      title: SYSTEM_EVENT_COPY.dispute_started.title,
      subtitle: SYSTEM_EVENT_COPY.dispute_started.subtitle,
    });
  }

  return items;
}

function buildSystemEventsFallback(_conversation: Conversation): ConversationTimelineItem[] {
  /* Never invent logistics events without a linked order. */
  void _conversation;
  return [];
}

function buildTimeline(
  conversation: Conversation,
  order: Order | null | undefined,
  offers: ConversationOfferView[],
): ConversationTimelineItem[] {
  const items: ConversationTimelineItem[] = [];

  for (const message of conversation.messages) {
    items.push({ kind: "message", id: message.id, at: message.sentAt, message });
  }

  items.push(...(order ? buildSystemEventsFromOrder(order) : buildSystemEventsFallback(conversation)));

  for (const offer of offers) {
    items.push({ kind: "offer", id: `offer-${offer.id}`, at: offer.createdAt, offer });
    if (offer.state === "accepted") {
      const amountLabel = new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: offer.currency || "GBP",
      }).format(offer.amount);
      items.push({
        kind: "system",
        id: `system-offer-accepted-${offer.id}`,
        at: offer.createdAt,
        event: "offer_accepted",
        title: `${amountLabel} accepted`,
        subtitle: SYSTEM_EVENT_COPY.offer_accepted.subtitle,
      });
    }
    if (offer.state === "declined") {
      const amountLabel = new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: offer.currency || "GBP",
      }).format(offer.amount);
      items.push({
        kind: "system",
        id: `system-offer-declined-${offer.id}`,
        at: offer.createdAt,
        event: "offer_declined",
        title: `${amountLabel} declined`,
        subtitle: SYSTEM_EVENT_COPY.offer_declined.subtitle,
      });
    }
  }

  items.sort((a, b) => {
    if (a.kind === "day" || b.kind === "day") return 0;
    return +new Date(a.at) - +new Date(b.at);
  });

  const withDays: ConversationTimelineItem[] = [];
  let lastDay: string | null = null;
  for (const item of items) {
    if (item.kind === "day") continue;
    const key = dayKey(item.at);
    if (key !== lastDay) {
      withDays.push({ kind: "day", id: `day-${key}`, label: formatDayLabel(item.at) });
      lastDay = key;
    }
    withDays.push(item);
  }

  return withDays;
}

function buildDynamicActions(
  viewerRole: SenderRole,
  order: Order | null | undefined,
  productStatus: ConversationProduct["status"],
): ConversationDynamicAction[] {
  if (order) {
    if (viewerRole === "buyer") {
      const actions: ConversationDynamicAction[] = [];
      if (order.status === "delivered") {
        actions.push({ id: "confirm_received", label: "Confirm received", role: "buyer" });
      }
      if (order.status === "completed") {
        actions.push({ id: "leave_feedback", label: "Leave feedback", role: "buyer" });
      }
      if (order.status !== "cancelled" && order.status !== "completed") {
        actions.push({ id: "report_issue", label: "Report issue", role: "buyer" });
        actions.push({ id: "open_dispute", label: "Open dispute", role: "buyer" });
      }
      return actions;
    }

    const actions: ConversationDynamicAction[] = [];
    if (order.status === "awaiting_shipment") {
      actions.push({ id: "add_tracking", label: "Add tracking", role: "seller" });
      actions.push({ id: "confirm_shipment", label: "Confirm shipment", role: "seller" });
    }
    if (order.status === "shipped") {
      actions.push({ id: "confirm_shipment", label: "Update shipment", role: "seller" });
    }
    return actions;
  }

  void productStatus;
  /* Without a linked order, only pre-purchase hub actions apply (handled by TransactionHubBottomActions). */
  return [];
}

function buildTracking(
  conversation: Conversation,
  order: Order | null | undefined,
  trackingOverride?: ConversationTrackingView | null,
): ConversationTrackingView | null {
  if (trackingOverride !== undefined) return trackingOverride;
  if (order?.trackingNumber) {
    return {
      courierName: order.deliveryCarrier || "Carrier",
      trackingNumber: order.trackingNumber,
      statusLabel: getOrderStatusLabel(order.status),
      latestScan: order.shippedAt ? "Shipment handed to carrier" : undefined,
      estimatedDelivery: undefined,
      carrierUrl: getTrackingUrl(order.deliveryCarrier, order.trackingNumber),
    };
  }
  void conversation;
  return null;
}

function buildAttachments(conversation: Conversation): ConversationAttachmentView[] {
  return conversation.messages
    .filter((message) => message.kind === "photo" && !message.deletedAt)
    .map((message) => ({
      id: message.id,
      label: "Photo",
      kind: "photo" as const,
      url: message.content,
    }));
}

export type BuildConversationHubViewInput = {
  conversation: Conversation;
  order?: Order | null;
  orderReference?: OrderReference | null;
  offers?: ConversationOfferView[];
  dispute?: ConversationDisputeView | null;
  attachments?: ConversationAttachmentView[];
  tracking?: ConversationTrackingView | null;
  typingLabel?: string | null;
};

export function buildConversationHubView(input: BuildConversationHubViewInput): ConversationHubView {
  const { conversation, order = null } = input;
  const viewerRole = getViewerRole(conversation.participant);
  const orderReference = buildOrderReference(conversation, order, input.orderReference);
  const offers = input.offers ?? [];
  const hasOrder = Boolean(order);

  const buyerName = order
    ? order.buyer.name
    : conversation.participant.role === "buyer"
      ? conversation.participant.name
      : "You";
  const sellerName = order
    ? order.seller.name
    : conversation.participant.role === "seller"
      ? conversation.participant.name
      : "You";

  const sellerAvatarUrl =
    viewerRole === "buyer" ? conversation.participant.avatarUrl : null;

  return {
    conversationId: conversation.id,
    viewerRole,
    product: conversation.product,
    participantName: conversation.participant.name,
    participantAvatarUrl: conversation.participant.avatarUrl,
    orderReference,
    orderStatusLabel: orderReference.statusLabel ?? statusLabelFromProduct(conversation.product.status),
    orderDetailsHref: hasOrder
      ? viewerRole === "seller"
        ? `/seller/orders/${encodeURIComponent(orderReference.orderId)}`
        : `/orders/${encodeURIComponent(orderReference.orderId)}`
      : `/orders/${encodeURIComponent(orderReference.orderId)}`,
    buyerName,
    sellerName,
    sellerAvatarUrl,
    statusSteps: buildOrderStatusSteps(conversation.product.status, order?.status),
    timeline: buildTimeline(conversation, order, offers),
    tracking: buildTracking(conversation, order, input.tracking),
    offers,
    dispute: input.dispute ?? null,
    attachments: input.attachments ?? buildAttachments(conversation),
    dynamicActions: buildDynamicActions(viewerRole, order, conversation.product.status),
    typingLabel: input.typingLabel ?? null,
    hasOrder,
  };
}

export function getSystemEventCopy(event: ConversationSystemEventType) {
  return SYSTEM_EVENT_COPY[event];
}

export function mapOfferDbStatus(status: string): ConversationOfferState {
  switch (status) {
    case "accepted":
      return "accepted";
    case "rejected":
    case "cancelled":
      return "declined";
    case "expired":
      return "expired";
    case "pending":
    default:
      return "open";
  }
}
