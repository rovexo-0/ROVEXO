/**
 * Conversation Hub view model — Sprint 3 SSOT.
 * Order rail: Paid · Prep · Ship · Done · Paid (compact labels; step ids unchanged)
 */

import type { ChatMessage, Conversation, ConversationProduct, SenderRole } from "@/lib/messages/types";
import type { OrderReference } from "@/lib/inbox/types";
import { resolveSprint1BuyerTotal, resolveSprint1ConversationStatus } from "@/lib/inbox/conversation-payment-sprint1";
import { formatPayNowLabel } from "@/lib/inbox/conversation-hub-sprint1-freeze-v1";
import {
  formatMasterStackActiveLabel,
} from "@/lib/inbox/master-stack-buyer-hub-v1";
import { getViewerRole } from "@/lib/messages/types";
import type { Order, OrderStatus } from "@/lib/orders/types";
import { getOrderStatusLabel, getTrackingUrl } from "@/lib/orders/status";
import { shouldOmitOfferFromChatTimeline } from "@/lib/supreme-blood-code-viii-v1";

export const CONVERSATION_HUB_VERSION = "v1.1-zoom-out" as const;

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
  | "review_available"
  | "funds_released"
  | "completed"
  | "shipping_label_generated";

export type ConversationOfferState = "open" | "accepted" | "declined" | "expired" | "countered";

export type ConversationOfferView = {
  id: string;
  amount: number;
  currency: string;
  state: ConversationOfferState;
  fromRole: SenderRole;
  createdAt: string;
  expiresAt?: string | null;
  /** Set when this pending offer is a counter of a parent offer (Blood XLIII). */
  parentOfferId?: string | null;
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
    | "resume_payment"
    | "add_tracking"
    | "confirm_shipment"
    | "confirm_received"
    | "leave_feedback"
    | "report_issue"
    | "open_dispute"
    | "view_dispute"
    | "print_label"
    | "download_label"
    | "upload_proof"
    | "confirm_delivery"
    | "leave_review"
    | "confirm_dispatch"
    | "track_parcel"
    | "view_order"
    | "withdraw";
  label: string;
  role: SenderRole | "both";
  /** First button = primary when true (default index 0). */
  primary?: boolean;
};

export type ConversationActionBarPanel = {
  title: string;
  subtitle?: string;
  meta?: string;
  tone: "neutral" | "purple" | "success" | "danger" | "info";
};

export type ConversationHubView = {
  conversationId: string;
  viewerRole: SenderRole;
  product: ConversationProduct;
  participantName: string;
  participantAvatarUrl?: string | null;
  participantActiveLabel: string;
  orderReference: OrderReference;
  orderStatusLabel: string;
  orderDetailsHref: string;
  buyerName: string;
  sellerName: string;
  timeline: ConversationTimelineItem[];
  tracking: ConversationTrackingView | null;
  offers: ConversationOfferView[];
  dispute: ConversationDisputeView | null;
  dynamicActions: ConversationDynamicAction[];
  /** Informational Action Bar panel (waiting drop-off, completed, etc.). */
  actionBarPanel: ConversationActionBarPanel | null;
  /** Product Card status badge — Sold / Available / Completed (not payment copy). */
  productCardStatus: string;
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
  tracking_added: { title: "Tracking available", subtitle: "" },
  delivered: { title: "Delivered", subtitle: "" },
  refund: { title: "Refund completed", subtitle: "" },
  cancelled: { title: "Cancelled", subtitle: "" },
  dispute_started: { title: "Dispute opened", subtitle: "" },
  offer_accepted: {
    title: "Offer accepted!",
    subtitle: "You can now proceed to buy.",
  },
  offer_declined: { title: "Offer declined", subtitle: "" },
  payment_received: { title: "Payment received", subtitle: "" },
  label_created: { title: "Shipping label generated", subtitle: "" },
  shipping_label_generated: { title: "Shipping label generated", subtitle: "" },
  parcel_collected: { title: "Item shipped", subtitle: "" },
  tracking_updated: { title: "In transit", subtitle: "" },
  parcel_delivered: { title: "Delivered", subtitle: "" },
  refund_issued: { title: "Refund completed", subtitle: "" },
  refund_completed: { title: "Refund completed", subtitle: "" },
  review_available: { title: "Review received", subtitle: "" },
  payment_confirmed: { title: "Payment received", subtitle: "" },
  funds_released: {
    title: "Funds released",
    subtitle: "",
  },
  completed: {
    title: "Completed",
    subtitle: "",
  },
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

function buildSystemEventsFromOrder(
  order: Order | null | undefined,
  options?: { hasShippingLabel?: boolean },
): ConversationTimelineItem[] {
  if (!order) return [];
  const items: ConversationTimelineItem[] = [];

  /* Messages Master Rewrite (COD SÂNGE):
     Dynamic Transaction Card owns lifecycle status (Tracking / Delivered / Completed).
     Timeline stays compact — never stack Funds Released + Completed + Delivered duplicates.
     Only exceptional logistics/dispute/refund/cancel events remain here. */

  void options;

  if (order.refundedAt || order.refundCompletedAt) {
    items.push({
      kind: "system",
      id: `system-refund-${order.id}`,
      at: order.refundCompletedAt ?? order.refundedAt!,
      event: order.refundCompletedAt ? "refund_completed" : "refund",
      title: order.refundCompletedAt
        ? SYSTEM_EVENT_COPY.refund_completed.title
        : SYSTEM_EVENT_COPY.refund.title,
      subtitle: "",
    });
  }
  if (order.cancelledAt) {
    items.push({
      kind: "system",
      id: `system-cancelled-${order.id}`,
      at: order.cancelledAt,
      event: "cancelled",
      title: SYSTEM_EVENT_COPY.cancelled.title,
      subtitle: order.cancellationReason ?? "",
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

/** Seed-only logistics placeholders — never hide real payment/order chat that Inbox preview shows. */
function isLogisticsPlaceholderMessage(content: string): boolean {
  const text = content.trim().toLowerCase();
  if (!text) return false;
  if (text.includes("tracking pending")) return true;
  if (text.includes("updates appear here")) return true;
  return false;
}

function buildTimeline(
  conversation: Conversation,
  order: Order | null | undefined,
  offers: ConversationOfferView[],
  options?: { hasShippingLabel?: boolean },
): ConversationTimelineItem[] {
  const items: ConversationTimelineItem[] = [];

  for (const message of conversation.messages) {
    if (isLogisticsPlaceholderMessage(message.content)) continue;
    items.push({ kind: "message", id: message.id, at: message.sentAt, message });
  }

  /* Inbox preview ↔ Hub sync: if last_message exists but rows are empty/filtered, surface preview. */
  const hasVisibleMessage = items.some((item) => item.kind === "message");
  const preview = conversation.lastMessage?.trim() ?? "";
  if (!hasVisibleMessage && preview && !isLogisticsPlaceholderMessage(preview)) {
    items.push({
      kind: "message",
      id: `preview-last-${conversation.id}`,
      at: conversation.lastMessageAt || new Date().toISOString(),
      message: {
        id: `preview-last-${conversation.id}`,
        senderRole: conversation.participant.role,
        kind: "text",
        content: preview,
        sentAt: conversation.lastMessageAt || new Date().toISOString(),
        status: "delivered",
        reactions: {},
      },
    });
  }

  items.push(
    ...(order
      ? buildSystemEventsFromOrder(order, options)
      : buildSystemEventsFallback(conversation)),
  );

  for (const offer of offers) {
    /* Owner canonical mockup: closed + open offers live in the unified conversation timeline. */
    if (shouldOmitOfferFromChatTimeline({ kind: "offer", offerState: offer.state })) continue;
    items.push({ kind: "offer", id: `offer-${offer.id}`, at: offer.createdAt, offer });
    /**
     * Recovery Sprint I / DEFECT #3:
     * Do NOT inject a duplicate "Offer accepted!" system card.
     * Transaction Status Card is the only canonical accepted-state surface.
     * Offer amount bubbles remain in the timeline above.
     */
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

function buildActionBarPanel(
  viewerRole: SenderRole,
  order: Order | null | undefined,
  options?: {
    hasShippingLabel?: boolean;
    tracking?: ConversationTrackingView | null;
  },
): ConversationActionBarPanel | null {
  if (!order) return null;
  const hasShippingLabel = Boolean(options?.hasShippingLabel);
  const tracking = options?.tracking ?? null;
  const carrierMeta = tracking
    ? [tracking.courierName, tracking.trackingNumber].filter(Boolean).join(" · ")
    : undefined;

  if (viewerRole === "seller") {
    if (order.status === "awaiting_shipment" && hasShippingLabel) {
      return {
        title: "Waiting for parcel drop-off",
        meta: carrierMeta ?? "Royal Mail • Tracked 48",
        tone: "purple",
      };
    }
    if (order.status === "shipped") {
      return {
        title: tracking?.statusLabel?.toLowerCase().includes("out")
          ? "Out for delivery"
          : "Tracking Active",
        subtitle: tracking?.latestScan ?? "Your parcel is with the carrier.",
        meta: carrierMeta,
        tone: "info",
      };
    }
    if (order.status === "delivered") {
      /* Dynamic Transaction Card owns “Waiting for buyer confirmation…” — no sticky duplicate. */
      return null;
    }
    if (order.status === "completed") {
      /* Dynamic Transaction Card owns “Sale completed / Funds released to Wallet.” */
      return null;
    }
    if (order.status === "awaiting_payment") {
      return {
        title: "Waiting buyer payment...",
        subtitle: "The buyer will complete checkout to confirm this order.",
        tone: "neutral",
      };
    }
  }

  if (viewerRole === "buyer") {
    if (order.status === "completed") {
      /* Leave Review lives on the Dynamic Transaction Card — no sticky panel duplicate. */
      return null;
    }
    if (order.status === "issue_open") {
      return {
        title: "Issue reported",
        subtitle: "Resolution is in progress.",
        tone: "purple",
      };
    }
  }

  return null;
}

function buildDynamicActions(
  viewerRole: SenderRole,
  order: Order | null | undefined,
  productStatus: ConversationProduct["status"],
  options?: { hasShippingLabel?: boolean },
): ConversationDynamicAction[] {
  void productStatus;
  const hasShippingLabel = Boolean(options?.hasShippingLabel);
  if (!order) {
    /* Pre-purchase CTAs come from TransactionHubBottomActions via TransactionActionBar. */
    return [];
  }

  if (viewerRole === "buyer") {
    const actions: ConversationDynamicAction[] = [];
    if (order.status === "awaiting_payment") {
      const total = resolveSprint1BuyerTotal({
        order,
        itemPrice: order.totals.itemPrice,
      });
      actions.push({
        id: "resume_payment",
        label: formatPayNowLabel(total),
        role: "buyer",
        primary: true,
      });
      return actions.slice(0, 2);
    }
    if (order.status === "delivered") {
      /* CTAs live on Dynamic Transaction Card only (Everything OK / I Have an Issue). */
      return [];
    }
    if (order.status === "issue_open") {
      actions.push({ id: "view_dispute", label: "View Details", role: "buyer" });
      return actions.slice(0, 2);
    }
    if (order.status === "completed") {
      /* Leave Review lives on Dynamic Transaction Card — avoid sticky duplicate. */
      return [];
    }
    if (order.status === "awaiting_shipment" || order.status === "shipped") {
      if (order.trackingNumber || order.status === "shipped") {
        actions.push({
          id: "track_parcel",
          label: "View Tracking",
          role: "buyer",
          primary: true,
        });
      } else {
        actions.push({
          id: "view_order",
          label: "Order Details",
          role: "buyer",
          primary: true,
        });
      }
      if (order.status === "shipped") {
        actions.push({ id: "report_issue", label: "I Have an Issue", role: "buyer" });
      }
      return actions.slice(0, 2);
    }
    return actions.slice(0, 2);
  }

  const actions: ConversationDynamicAction[] = [];
  if (order.status === "awaiting_shipment") {
    if (!hasShippingLabel) {
      actions.push({
        id: "print_label",
        label: "Get Shipping Label",
        role: "seller",
        primary: true,
      });
      return actions.slice(0, 2);
    }
    /* Label generated — drop-off automation panel only (no Mark as Sent). */
    return [];
  }
  if (order.status === "shipped") {
    /* Carrier webhooks own tracking — seller sees info panel, no manual status buttons. */
    return [];
  }
  if (order.status === "completed") {
    /* Messages Master Rewrite: never Withdraw / Wallet CTAs in Messages.
       Sale-completed copy lives on the Dynamic Transaction Card only. */
    return [];
  }
  return actions.slice(0, 2);
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

export type BuildConversationHubViewInput = {
  conversation: Conversation;
  order?: Order | null;
  orderReference?: OrderReference | null;
  offers?: ConversationOfferView[];
  dispute?: ConversationDisputeView | null;
  tracking?: ConversationTrackingView | null;
  /** True when a shipping label PDF is available for this order. */
  hasShippingLabel?: boolean;
};

export function buildConversationHubView(input: BuildConversationHubViewInput): ConversationHubView {
  const { conversation, order = null } = input;
  const viewerRole = getViewerRole(conversation.participant);
  const orderReference = buildOrderReference(conversation, order, input.orderReference);
  const offers = input.offers ?? [];
  const hasOrder = Boolean(order);
  const hasAcceptedOffer = offers.some((offer) => offer.state === "accepted");

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

  const sprint1Status = resolveSprint1ConversationStatus({
    viewerRole,
    orderStatus: order?.status ?? null,
    hasAcceptedOffer,
    hasOrder,
  });
  const fallbackStatus =
    orderReference.statusLabel ?? statusLabelFromProduct(conversation.product.status);
  const orderStatusLabel =
    order?.status === "awaiting_payment" ||
    order?.status === "awaiting_shipment" ||
    (!hasOrder && hasAcceptedOffer)
      ? sprint1Status
      : fallbackStatus;

  const tracking = buildTracking(conversation, order, input.tracking);
  /* Label truth = API probe only. Tracking number / shipped status are separate. */
  const hasShippingLabel = Boolean(input.hasShippingLabel);
  const productCardStatus = (() => {
    if (order?.status === "completed") return "Completed";
    if (order?.status === "cancelled") return "Cancelled";
    if (order?.status === "issue_open") return "Sold";
    if (order) return "Sold";
    if (hasAcceptedOffer) return "Offer Pending";
    if (conversation.product.status === "sold") return "Sold";
    if (conversation.product.status === "paused") return "Paused";
    return "Available";
  })();

  return {
    conversationId: conversation.id,
    viewerRole,
    product: conversation.product,
    participantName: conversation.participant.name,
    participantAvatarUrl: conversation.participant.avatarUrl,
    participantActiveLabel: formatMasterStackActiveLabel({
      online: conversation.participant.online,
      lastSeen: conversation.participant.lastSeen,
    }),
    orderReference,
    orderStatusLabel,
    orderDetailsHref: hasOrder
      ? viewerRole === "seller"
        ? `/seller/orders/${encodeURIComponent(orderReference.orderId)}`
        : `/orders/${encodeURIComponent(orderReference.orderId)}`
      : `/orders/${encodeURIComponent(orderReference.orderId)}`,
    buyerName,
    sellerName,
    timeline: buildTimeline(conversation, order, offers, { hasShippingLabel }),
    tracking,
    offers,
    dispute: input.dispute ?? null,
    dynamicActions: buildDynamicActions(viewerRole, order, conversation.product.status, {
      hasShippingLabel,
    }),
    actionBarPanel: buildActionBarPanel(viewerRole, order, {
      hasShippingLabel,
      tracking,
    }),
    productCardStatus,
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
      return "declined";
    /** Parent offer locked after a successful counter (Blood XLIII). */
    case "cancelled":
      return "countered";
    case "expired":
      return "expired";
    case "pending":
    default:
      return "open";
  }
}
