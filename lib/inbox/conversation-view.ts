/**
 * Conversation Hub view model — Sprint 2 presentation SSOT.
 * Maps conversation (+ optional order reference) without backend business logic.
 */

import type { ChatMessage, Conversation, ConversationProduct, SenderRole } from "@/lib/messages/types";
import type { OrderReference } from "@/lib/inbox/types";
import { getViewerRole } from "@/lib/messages/types";

export const CONVERSATION_HUB_VERSION = "v1.0-sprint-2" as const;

/** Spec order status rail — horizontal. */
export const CONVERSATION_ORDER_STATUS_STEPS = [
  "paid",
  "preparing",
  "dispatched",
  "in_transit",
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
  id: string;
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
  statusSteps: ConversationOrderStatusStep[];
  timeline: ConversationTimelineItem[];
  tracking: ConversationTrackingView | null;
  offers: ConversationOfferView[];
  dispute: ConversationDisputeView | null;
  attachments: ConversationAttachmentView[];
  dynamicActions: ConversationDynamicAction[];
  typingLabel: string | null;
};

const STEP_LABELS: Record<ConversationOrderStatusStepId, string> = {
  paid: "Paid",
  preparing: "Preparing",
  dispatched: "Dispatched",
  in_transit: "In Transit",
  delivered: "Delivered",
  completed: "Completed",
};

const SYSTEM_EVENT_COPY: Record<ConversationSystemEventType, { title: string; subtitle: string }> = {
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

function statusProgressFromProduct(status: ConversationProduct["status"]): number {
  switch (status) {
    case "sold":
      return 5;
    case "paused":
      return 1;
    case "draft":
      return -1;
    case "published":
    default:
      return -1;
  }
}

function buildOrderReference(conversation: Conversation, order?: OrderReference | null): OrderReference {
  if (order?.orderId) return order;
  return {
    orderId: conversation.product.id,
    orderNumber: `RX-${conversation.product.id.slice(0, 8).toUpperCase()}`,
    statusLabel: statusLabelFromProduct(conversation.product.status),
  };
}

function statusLabelFromProduct(status: ConversationProduct["status"]): string {
  switch (status) {
    case "sold":
      return "Completed";
    case "paused":
      return "Preparing";
    case "draft":
      return "Draft";
    case "published":
    default:
      return "Active";
  }
}

export function buildOrderStatusSteps(
  productStatus: ConversationProduct["status"],
): ConversationOrderStatusStep[] {
  const progress = statusProgressFromProduct(productStatus);
  return CONVERSATION_ORDER_STATUS_STEPS.map((id, index) => {
    let state: ConversationOrderStatusStep["state"] = "future";
    if (progress < 0) state = "future";
    else if (progress > index) state = "complete";
    else if (progress === index) state = "current";
    else state = "future";
    return { id, label: STEP_LABELS[id], state };
  });
}

function buildSystemEvents(conversation: Conversation): ConversationTimelineItem[] {
  if (conversation.product.status !== "sold") return [];

  const base = conversation.lastMessageAt || new Date().toISOString();
  const events: ConversationSystemEventType[] = [
    "payment_received",
    "label_created",
    "parcel_collected",
    "parcel_delivered",
    "review_available",
  ];

  return events.map((event, index) => {
    const copy = SYSTEM_EVENT_COPY[event];
    const at = new Date(base);
    at.setMinutes(at.getMinutes() - (events.length - index) * 90);
    return {
      kind: "system" as const,
      id: `system-${event}`,
      at: at.toISOString(),
      event,
      title: copy.title,
      subtitle: copy.subtitle,
    };
  });
}

function buildTimeline(conversation: Conversation): ConversationTimelineItem[] {
  const items: ConversationTimelineItem[] = [];

  for (const message of conversation.messages) {
    items.push({
      kind: "message",
      id: message.id,
      at: message.sentAt,
      message,
    });
  }

  items.push(...buildSystemEvents(conversation));

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
      withDays.push({
        kind: "day",
        id: `day-${key}`,
        label: formatDayLabel(item.at),
      });
      lastDay = key;
    }
    withDays.push(item);
  }

  return withDays;
}

function buildDynamicActions(
  viewerRole: SenderRole,
  productStatus: ConversationProduct["status"],
): ConversationDynamicAction[] {
  if (productStatus !== "sold") return [];

  if (viewerRole === "buyer") {
    return [
      { id: "confirm_delivery", label: "Confirm Delivery", role: "buyer" },
      { id: "leave_review", label: "Leave Review", role: "buyer" },
      { id: "report_issue", label: "Report Issue", role: "buyer" },
    ];
  }

  return [
    { id: "print_label", label: "Print Label", role: "seller" },
    { id: "confirm_dispatch", label: "Confirm Dispatch", role: "seller" },
    { id: "upload_proof", label: "Upload Proof", role: "seller" },
  ];
}

function buildTracking(conversation: Conversation): ConversationTrackingView | null {
  if (conversation.product.status !== "sold") return null;
  return {
    courierName: "Carrier",
    trackingNumber: `TRK${conversation.id.slice(0, 10).toUpperCase()}`,
    statusLabel: "In transit",
    latestScan: "Parcel scanned at local depot",
    estimatedDelivery: undefined,
    carrierUrl: null,
  };
}

export type BuildConversationHubViewInput = {
  conversation: Conversation;
  orderReference?: OrderReference | null;
  offers?: ConversationOfferView[];
  dispute?: ConversationDisputeView | null;
  attachments?: ConversationAttachmentView[];
  tracking?: ConversationTrackingView | null;
  typingLabel?: string | null;
};

export function buildConversationHubView(input: BuildConversationHubViewInput): ConversationHubView {
  const { conversation } = input;
  const viewerRole = getViewerRole(conversation.participant);
  const orderReference = buildOrderReference(conversation, input.orderReference);
  const buyerName =
    conversation.participant.role === "buyer" ? conversation.participant.name : "You";
  const sellerName =
    conversation.participant.role === "seller" ? conversation.participant.name : "You";

  return {
    conversationId: conversation.id,
    viewerRole,
    product: conversation.product,
    participantName: conversation.participant.name,
    participantAvatarUrl: conversation.participant.avatarUrl,
    orderReference,
    orderStatusLabel: orderReference.statusLabel ?? statusLabelFromProduct(conversation.product.status),
    orderDetailsHref: `/orders/${encodeURIComponent(orderReference.orderId)}`,
    buyerName,
    sellerName,
    statusSteps: buildOrderStatusSteps(conversation.product.status),
    timeline: buildTimeline(conversation),
    tracking: input.tracking ?? buildTracking(conversation),
    offers: input.offers ?? [],
    dispute: input.dispute ?? null,
    attachments: input.attachments ?? [],
    dynamicActions: buildDynamicActions(viewerRole, conversation.product.status),
    typingLabel: input.typingLabel ?? null,
  };
}

export function getSystemEventCopy(event: ConversationSystemEventType) {
  return SYSTEM_EVENT_COPY[event];
}
