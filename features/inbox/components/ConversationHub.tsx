"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BackLineIcon,
  ChevronRightLineIcon,
  MoreLineIcon,
} from "@/components/icons/RvxLineIcons";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { useChatRealtime } from "@/features/messages/hooks/use-chat-realtime";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { CheckoutHubSheet } from "@/features/transaction-hub/CheckoutHubSheet";
import { TransactionHubBottomActions } from "@/features/transaction-hub/TransactionHubBottomActions";
import { TransactionHubPaymentSuccess } from "@/features/transaction-hub/TransactionHubPaymentSuccess";
import { PlatformFeeSheet } from "@/features/inbox/components/PlatformFeeSheet";
import { ReviewTeaserSheet } from "@/features/inbox/components/ReviewTeaserSheet";
import { OrderReviewCard } from "@/features/orders/components/OrderReviewCard";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import {
  CONVERSATION_HUB_VERSION,
  INBOX_ROUTES,
  buildConversationHubView,
  mapOfferDbStatus,
  subscribeConversationRealtime,
  type ConversationDisputeView,
  type ConversationOfferView,
} from "@/lib/inbox";
import { TRANSACTION_HUB_CANONICAL_STATUS } from "@/lib/transaction-hub/canonical";
import { transactionHubListingHref } from "@/lib/transaction-hub/inbox-routes";
import type { ChatMessage, Conversation } from "@/lib/messages/types";
import { formatMessageTime } from "@/lib/messages/utils";
import type { Order } from "@/lib/orders/types";
import { formatListingPrice, formatListingPriceIncl } from "@/lib/listing-card/format";
import { formatCurrency } from "@/lib/wallet/utils";
import { AccountIcon } from "@/components/account/AccountIcons";
import "@/styles/rovexo/conversation-hub-v1.css";

type ConversationHubProps = {
  initialConversation: Conversation;
};

type LoadState = "ready" | "loading" | "error" | "offline";

const HISTORY_PAGE = 40;

function MessageBubble({
  message,
  outgoing,
}: {
  message: ChatMessage;
  outgoing: boolean;
}) {
  const content = message.kind === "photo" ? "Shared photo" : message.content;

  return (
    <div className={cn("conv-hub__msg", outgoing ? "conv-hub__msg--out" : "conv-hub__msg--in")}>
      <div>
        <div className={cn("conv-hub__bubble", outgoing ? "conv-hub__bubble--out" : "conv-hub__bubble--in")}>
          {content}
        </div>
        <span className="conv-hub__msg-meta">
          <time dateTime={message.sentAt}>{formatMessageTime(message.sentAt)}</time>
        </span>
      </div>
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div
      className="conv-hub"
      data-conversation-freeze="FINAL-LOCK"
      data-conversation-hub={CONVERSATION_HUB_VERSION}
      aria-busy="true"
    >
      <div className="conv-hub__header">
        <span className="conv-hub__skel conv-hub__skel--icon" />
        <span className="conv-hub__skel conv-hub__skel--title" />
        <span className="conv-hub__skel conv-hub__skel--icon" />
      </div>
      <div className="conv-hub__body">
        <div className="conv-hub__skel conv-hub__skel--card" />
        <div className="conv-hub__skel conv-hub__skel--bubble" />
        <div className="conv-hub__skel conv-hub__skel--bubble conv-hub__skel--bubble-out" />
      </div>
    </div>
  );
}

export function ConversationHub({ initialConversation }: ConversationHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const { refresh: refreshBadges } = useRealtimeNotifications();

  const [conversation, setConversation] = useState(initialConversation);
  const [order, setOrder] = useState<Order | null>(null);
  const [offers, setOffers] = useState<ConversationOfferView[]>([]);
  const [dispute, setDispute] = useState<ConversationDisputeView | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>("ready");
  const [historyCount, setHistoryCount] = useState(HISTORY_PAGE);
  const [counterFor, setCounterFor] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    orderId: string;
    orderNumber?: string | null;
  } | null>(null);
  const [resumeCheckoutOpen, setResumeCheckoutOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const requestedOrderId = searchParams.get("order") ?? searchParams.get("order_id");
  const paymentHandledRef = useRef(false);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [feeSheetOpen, setFeeSheetOpen] = useState(false);
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const pullStartY = useRef<number | null>(null);

  useChatRealtime(conversation.id, conversation.participant.id, setConversation);

  const reloadRelated = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setLoadState("offline");
      return;
    }

    setLoadState("loading");
    try {
      const [ordersRes, offersRes] = await Promise.all([
        fetch("/api/orders", { cache: "no-store" }),
        fetch(`/api/offers?productSlug=${encodeURIComponent(conversation.product.slug)}`, {
          cache: "no-store",
        }),
      ]);

      let nextOrder: Order | null = null;
      if (ordersRes.ok) {
        const payload = (await ordersRes.json()) as { orders?: Order[] };
        const matchingOrders = (payload.orders ?? []).filter(
          (item) =>
            item.product.id === conversation.product.id ||
            item.product.slug === conversation.product.slug,
        );
        nextOrder = requestedOrderId
          ? matchingOrders.find((item) => item.id === requestedOrderId) ?? null
          : matchingOrders.length === 1
            ? matchingOrders[0]
            : null;
        setOrder(nextOrder);
      }

      if (offersRes.ok) {
        const payload = (await offersRes.json()) as {
          offers?: Array<{
            id: string;
            amount: number;
            status: string;
            createdAt: string;
            buyerId: string;
            fromRole?: "buyer" | "seller";
          }>;
        };
        setOffers(
          (payload.offers ?? []).map((offer) => ({
            id: offer.id,
            amount: offer.amount,
            currency: "GBP",
            state: mapOfferDbStatus(offer.status),
            fromRole: offer.fromRole ?? ("buyer" as const),
            createdAt: offer.createdAt,
          })),
        );
      }

      if (nextOrder) {
        const caseRes = await fetch(`/api/protection/cases?orderId=${encodeURIComponent(nextOrder.id)}`, {
          cache: "no-store",
        });
        if (caseRes.ok) {
          const payload = (await caseRes.json()) as {
            case?: {
              id: string;
              status: string;
              reason: string;
              resolvedAt?: string | null;
              adminNotes?: string;
            } | null;
          };
          if (payload.case) {
            const status =
              payload.case.status === "resolved" || payload.case.status === "closed"
                ? "resolved"
                : payload.case.status === "under_review"
                  ? "under_review"
                  : "open";
            setDispute({
              id: payload.case.id,
              status,
              title: payload.case.reason || "Transaction dispute",
              updatedAt: payload.case.resolvedAt ?? new Date().toISOString(),
              decisionSummary: payload.case.adminNotes || null,
            });
          } else {
            setDispute(null);
          }
        }
      }

      setLoadState("ready");
    } catch {
      setLoadState(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
    }
  }, [conversation.product.id, conversation.product.slug, requestedOrderId]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void reloadRelated();
    });
    return () => {
      cancelled = true;
    };
  }, [reloadRelated]);

  useEffect(() => {
    void fetch(`/api/messages/${conversation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read" }),
    }).then(() => void refreshBadges());
  }, [conversation.id, refreshBadges]);

  useEffect(() => {
    const sub = subscribeConversationRealtime(conversation.id, (event) => {
      if (event.type === "badge.updated" || event.type === "message.created") {
        void refreshBadges();
      }
      if (event.type === "offer.updated" || event.type === "tracking.updated" || event.type === "dispute.updated") {
        void reloadRelated();
      }
    });
    return () => sub.unsubscribe();
  }, [conversation.id, refreshBadges, reloadRelated]);

  useEffect(() => {
    const onOnline = () => {
      setLoadState("ready");
      void reloadRelated();
    };
    const onOffline = () => setLoadState("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [reloadRelated]);

  const view = useMemo(
    () =>
      buildConversationHubView({
        conversation,
        order,
        offers,
        dispute,
      }),
    [conversation, order, offers, dispute],
  );

  const acceptedOffer = useMemo(
    () => offers.find((offer) => offer.state === "accepted") ?? null,
    [offers],
  );
  const pendingOffer = useMemo(
    () => (acceptedOffer ? null : offers.find((offer) => offer.state === "open") ?? null),
    [acceptedOffer, offers],
  );

  const timelineWindow = useMemo(() => {
    const items = view.timeline;
    if (items.length <= historyCount) return items;
    return items.slice(items.length - historyCount);
  }, [view.timeline, historyCount]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timelineWindow.length, conversation.messages.length]);

  useEffect(() => {
    if (paymentHandledRef.current) return;
    const paymentStatus = searchParams.get("payment");
    const orderId = searchParams.get("order_id");
    const sessionId = searchParams.get("session_id");
    const cancelledSlug = searchParams.get("slug");
    if (!paymentStatus || !orderId) return;
    paymentHandledRef.current = true;

    if (paymentStatus === "cancelled") {
      router.replace(INBOX_ROUTES.conversation(conversation.id));
      if (cancelledSlug) queueMicrotask(() => setResumeCheckoutOpen(true));
      return;
    }

    if (paymentStatus === "success") {
      void (async () => {
        if (sessionId) {
          const response = await fetch(
            `/api/orders/confirm?session_id=${encodeURIComponent(sessionId)}`,
          );
          const payload = (await response.json()) as {
            order?: { id: string; orderNumber?: string };
          };
          setPaymentSuccess({
            orderId: payload.order?.id ?? orderId,
            orderNumber: payload.order?.orderNumber ?? null,
          });
        } else {
          setPaymentSuccess({ orderId });
        }
        router.replace(INBOX_ROUTES.conversation(conversation.id));
        void reloadRelated();
        void refreshBadges();
      })();
    }
  }, [conversation.id, router, searchParams, reloadRelated, refreshBadges]);

  const resizeComposer = useCallback(() => {
    const node = textareaRef.current;
    if (!node) return;
    // Single-row lock: keep the composer at one compact line height.
    node.style.height = "";
  }, []);

  useEffect(() => {
    resizeComposer();
  }, [draft, resizeComposer]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || sending || conversation.blocked) return;

      setSending(true);
      const isFirstMessage = conversation.messages.length === 0;
      const optimisticId = `optimistic-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: optimisticId,
        senderRole: view.viewerRole,
        kind: "text",
        content: trimmed,
        sentAt: new Date().toISOString(),
        status: "sent",
        reactions: {},
      };

      setConversation((current) => ({
        ...current,
        messages: [...current.messages, optimistic],
        lastMessage: trimmed,
        lastMessageAt: optimistic.sentAt,
      }));

      try {
        const response = await fetch(`/api/messages/${conversation.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: trimmed, senderRole: view.viewerRole, kind: "text" }),
        });
        const payload = (await response.json()) as {
          conversation?: Conversation;
          warning?: string | null;
          error?: string;
        };

        if (!response.ok) {
          setConversation((current) => ({
            ...current,
            messages: current.messages.filter((message) => message.id !== optimisticId),
          }));
          setWarning(payload.error ?? "Unable to send message.");
          return;
        }

        if (payload.conversation) {
          setConversation(payload.conversation);
          if (isFirstMessage) {
            trackGaEvent("chat_started", {
              conversation_id: conversation.id,
              item_id: conversation.product.slug,
              item_name: conversation.product.title,
            });
          }
        }
        setDraft("");
        setWarning(payload.warning ?? null);
        void refreshBadges();
      } finally {
        setSending(false);
      }
    },
    [
      sending,
      conversation.blocked,
      conversation.id,
      conversation.messages.length,
      conversation.product.slug,
      conversation.product.title,
      view.viewerRole,
      refreshBadges,
    ],
  );

  const handleSend = () => void sendMessage(draft);

  const handleDraftChange = (value: string) => {
    setDraft(value);
  };

  const patchOffer = async (offerId: string, action: "accept" | "decline" | "counter", amount?: number) => {
    setActionBusy(offerId);
    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          amount,
          conversationId: conversation.id,
        }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        status?: string;
        offer?: {
          id: string;
          amount: number;
          createdAt: string;
          status: string;
          fromRole?: "buyer" | "seller";
        };
        checkoutHref?: string;
        error?: string;
      };
      if (!response.ok || !payload.success) {
        pushToast({ title: payload.error ?? "Offer action failed.", variant: "error" });
        return;
      }

      if (action === "counter" && payload.offer) {
        const nextOffer = payload.offer;
        setOffers((current) => [
          ...current.map((item) =>
            item.id === offerId ? { ...item, state: "countered" as const } : item,
          ),
          {
            id: nextOffer.id,
            amount: nextOffer.amount,
            currency: "GBP",
            state: mapOfferDbStatus(nextOffer.status),
            fromRole: nextOffer.fromRole ?? view.viewerRole,
            createdAt: nextOffer.createdAt,
          },
        ]);
      } else {
        setOffers((current) =>
          current.map((item) =>
            item.id === offerId
              ? {
                  ...item,
                  state: action === "accept" ? "accepted" : "declined",
                }
              : item,
          ),
        );
      }
      setCounterFor(null);
      setCounterAmount("");
      void refreshBadges();
      if (action === "accept" && view.viewerRole === "buyer" && payload.checkoutHref) {
        router.push(payload.checkoutHref);
      }
    } finally {
      setActionBusy(null);
    }
  };

  const runOrderAction = async (actionId: string) => {
    if (!order) {
      pushToast({ title: "Order details will appear once purchased.", variant: "info" });
      return;
    }

    setActionBusy(actionId);
    try {
      if (actionId === "leave_feedback" || actionId === "leave_review") {
        setReviewOpen(true);
        return;
      }
      if (actionId === "open_dispute") {
        const response = await fetch("/api/protection/cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            caseType: "dispute",
            reason: "Issue with order",
            description: "Opened from Conversation Hub",
          }),
        });
        if (!response.ok) {
          pushToast({ title: "Unable to open dispute.", variant: "error" });
          return;
        }
        pushToast({ title: "Dispute opened.", variant: "success" });
        void reloadRelated();
        return;
      }
      if (actionId === "add_tracking" || actionId === "confirm_shipment") {
        const trackingNumber = window.prompt("Enter tracking number");
        if (!trackingNumber?.trim()) return;
        const response = await fetch(`/api/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "add_tracking", trackingNumber: trackingNumber.trim() }),
        });
        if (!response.ok) {
          pushToast({ title: "Unable to add tracking.", variant: "error" });
          return;
        }
        pushToast({ title: "Tracking updated.", variant: "success" });
        void reloadRelated();
        return;
      }
      if (actionId === "confirm_received" || actionId === "confirm_delivery") {
        const response = await fetch(`/api/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "confirm_ok" }),
        });
        if (!response.ok) {
          pushToast({ title: "Unable to confirm delivery.", variant: "error" });
          return;
        }
        pushToast({ title: "Delivery confirmed.", variant: "success" });
        void reloadRelated();
        return;
      }
      if (actionId === "report_issue") {
        const response = await fetch(`/api/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "report_issue" }),
        });
        if (!response.ok) {
          pushToast({ title: "Unable to report issue.", variant: "error" });
          return;
        }
        pushToast({ title: "Issue reported.", variant: "success" });
        void reloadRelated();
      }
    } finally {
      setActionBusy(null);
    }
  };

  const orderNumber = order
    ? view.orderReference.orderNumber ?? `Order #${order.id.slice(0, 8).toUpperCase()}`
    : "Transaction";

  const copyTracking = async () => {
    if (!view.tracking?.trackingNumber) return;
    try {
      await navigator.clipboard.writeText(view.tracking.trackingNumber);
      pushToast({ title: "Tracking number copied.", variant: "success" });
    } catch {
      pushToast({ title: "Unable to copy tracking number.", variant: "error" });
    }
  };

  if (loadState === "loading" && !order && offers.length === 0 && conversation.messages.length === 0) {
    return (
      <AccountCanonicalShell
        title="Conversation"
        hideBack
        showBottomNav={false}
        bottomNavTab="saved"
        contentClassName="!p-0"
      >
        <ConversationSkeleton />
      </AccountCanonicalShell>
    );
  }

  return (
    <AccountCanonicalShell
      title="Conversation"
      hideBack
      showBottomNav={false}
      bottomNavTab="saved"
      contentClassName="!p-0"
    >
      <div
        className="conv-hub"
        data-conversation-hub={CONVERSATION_HUB_VERSION}
        data-conversation-freeze="FINAL-LOCK"
        data-conversation-hub-ui="v1.1-zoom-out"
        data-transaction-hub-freeze={TRANSACTION_HUB_CANONICAL_STATUS}
        data-conversation-realtime="live"
        data-conversation-shell="fullscreen"
      >
        <header className="conv-hub__header">
          <button
            type="button"
            className="conv-hub__icon-btn"
            aria-label="Back to Inbox"
            onClick={() => router.push(INBOX_ROUTES.hub)}
          >
            <BackLineIcon />
          </button>
          <div className="conv-hub__header-centre">
            <h1 className="conv-hub__header-title">{view.participantName}</h1>
          </div>
          <div className="conv-hub__menu">
            <button
              type="button"
              className="conv-hub__icon-btn"
              aria-label="More options"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreLineIcon />
            </button>
            {menuOpen ? (
              <div className="conv-hub__menu-panel" role="menu">
                <button
                  type="button"
                  className="conv-hub__menu-item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    void runOrderAction("report_issue");
                  }}
                >
                  Report issue
                </button>
              </div>
            ) : null}
          </div>
        </header>

        {loadState === "offline" || loadState === "error" ? (
          <div className={cn("conv-hub__banner", loadState === "error" && "conv-hub__banner--error")}>
            <span>{loadState === "offline" ? "You’re offline." : "Something went wrong."}</span>
            <button type="button" onClick={() => void reloadRelated()}>
              Retry
            </button>
          </div>
        ) : null}

        <div
          ref={bodyRef}
          className="conv-hub__body"
          onScroll={(event) => {
            if (event.currentTarget.scrollTop < 48 && historyCount < view.timeline.length) {
              setHistoryCount((count) => Math.min(view.timeline.length, count + HISTORY_PAGE));
            }
          }}
          onTouchStart={(event) => {
            if (bodyRef.current && bodyRef.current.scrollTop <= 0) {
              pullStartY.current = event.touches[0]?.clientY ?? null;
            }
          }}
          onTouchEnd={(event) => {
            if (pullStartY.current == null) return;
            const endY = event.changedTouches[0]?.clientY ?? pullStartY.current;
            if (endY - pullStartY.current > 72) void reloadRelated();
            pullStartY.current = null;
          }}
        >
          <button
            type="button"
            className="conv-hub__product"
            aria-label="Transaction item"
            onClick={() => router.push(transactionHubListingHref(view.product.slug))}
          >
            <span className="conv-hub__product-stack">
              <span className="conv-hub__product-title">{view.product.title}</span>
              <span className="conv-hub__product-prices">
                <span className="conv-hub__product-price">
                  {formatListingPrice(acceptedOffer?.amount ?? view.product.price)}
                </span>
                <span className="conv-hub__product-incl">
                  {formatListingPriceIncl(acceptedOffer?.amount ?? view.product.price)}
                  <button
                    type="button"
                    className="conv-hub__fee-shield"
                    aria-label="Platform Fee"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFeeSheetOpen(true);
                    }}
                  >
                    <AccountIcon name="security" className="conv-hub__fee-shield-icon" />
                  </button>
                </span>
              </span>
              <span className="conv-hub__product-status-row">
                <span className="conv-hub__product-status">{view.orderStatusLabel}</span>
                <ChevronRightLineIcon className="conv-hub__chevron" />
              </span>
            </span>
          </button>

          {reviewOpen && order ? (
            <div className="conv-hub__inline-review" aria-label="Leave review">
              <OrderReviewCard orderId={order.id} sellerName={view.sellerName} />
            </div>
          ) : null}

          <div className="conv-hub__timeline" aria-live="polite">
            {historyCount < view.timeline.length ? (
              <button
                type="button"
                className="conv-hub__load-more"
                onClick={() => setHistoryCount((count) => Math.min(view.timeline.length, count + HISTORY_PAGE))}
              >
                Load earlier messages
              </button>
            ) : null}

            {timelineWindow.length === 0 ? (
              <div className="conv-hub__timeline-empty">
                <p className="conv-hub__timeline-empty-title">Start conversation</p>
                <p className="conv-hub__timeline-empty-sub">Send a message about this listing to begin.</p>
              </div>
            ) : (
              timelineWindow.map((item) => {
                if (item.kind === "day") {
                  return (
                    <div key={item.id} className="conv-hub__day">
                      <span>{item.label}</span>
                    </div>
                  );
                }
                if (item.kind === "system") {
                  const isTracking =
                    item.event === "tracking_added" || item.event === "tracking_updated";
                  const isLabel =
                    item.event === "label_created" || item.event === "shipping_label_generated";
                  const trackingHref = view.tracking?.carrierUrl ?? null;
                  const parcelCodes = view.tracking?.trackingNumber
                    ? view.tracking.trackingNumber
                        .split(/[,;\s]+/)
                        .map((code) => code.trim())
                        .filter(Boolean)
                    : [];
                  const parcels =
                    parcelCodes.length > 0
                      ? parcelCodes.map((code, index) => ({
                          code,
                          label: `Parcel ${index + 1} of ${parcelCodes.length}`,
                        }))
                      : [];
                  return (
                    <div key={item.id} className="conv-hub__system" data-event={item.event}>
                      <p className="conv-hub__system-brand">ROVEXO</p>
                      <p className="conv-hub__system-title">{item.title}</p>
                      {item.subtitle && !isTracking ? (
                        <p className="conv-hub__system-sub">{item.subtitle}</p>
                      ) : null}
                      {isLabel && view.tracking?.courierName ? (
                        <p className="conv-hub__system-sub">{view.tracking.courierName}</p>
                      ) : null}
                      <p className="conv-hub__system-time">
                        <time dateTime={item.at}>{formatMessageTime(item.at)}</time>
                      </p>
                      {isTracking && parcels.length > 0
                        ? parcels.map((parcel) => (
                            <div key={parcel.code} className="conv-hub__parcel">
                              {parcels.length > 1 ? (
                                <p className="conv-hub__parcel-label">{parcel.label}</p>
                              ) : null}
                              <p className="conv-hub__parcel-code">{parcel.code}</p>
                              <div className="conv-hub__system-actions">
                                {trackingHref ? (
                                  <a
                                    className="conv-hub__system-cta"
                                    href={trackingHref}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    View Tracking
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    className="conv-hub__system-cta"
                                    onClick={() => void copyTracking()}
                                  >
                                    View Tracking
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="conv-hub__system-cta"
                                  disabled={actionBusy === "print_label"}
                                  onClick={() => void runOrderAction("print_label")}
                                >
                                  View Label
                                </button>
                              </div>
                            </div>
                          ))
                        : null}
                      {isLabel && !isTracking ? (
                        <div className="conv-hub__system-actions">
                          <button
                            type="button"
                            className="conv-hub__system-cta"
                            disabled={actionBusy === "print_label"}
                            onClick={() => void runOrderAction("print_label")}
                          >
                            View Label
                          </button>
                        </div>
                      ) : null}
                      {item.event === "dispute_started" ? (
                        <button
                          type="button"
                          className="conv-hub__system-cta"
                          disabled={actionBusy === "open_dispute"}
                          onClick={() => void runOrderAction("open_dispute")}
                        >
                          View dispute
                        </button>
                      ) : null}
                    </div>
                  );
                }
                if (item.kind === "offer") {
                  const offer = item.offer;
                  const isOpen = offer.state === "open";
                  const stateLabel =
                    offer.state === "open"
                      ? "Offer pending"
                      : offer.state === "accepted"
                        ? "Offer accepted"
                        : offer.state === "declined"
                          ? "Offer declined"
                          : `Offer ${offer.state.replace("_", " ")}`;
                  return (
                    <div
                      key={item.id}
                      className={cn("conv-hub__offer", !isOpen && "conv-hub__offer--compact")}
                      data-offer-state={offer.state}
                    >
                      <div className="conv-hub__offer-head">
                        <p className="conv-hub__offer-amount">{formatCurrency(offer.amount)}</p>
                        <p className="conv-hub__offer-state">{stateLabel}</p>
                      </div>
                      {!isOpen ? (
                        <time className="conv-hub__offer-time" dateTime={item.at}>
                          {formatMessageTime(item.at)}
                        </time>
                      ) : null}
                      {isOpen && offer.fromRole !== view.viewerRole ? (
                        <div className="conv-hub__offer-actions">
                          <button
                            type="button"
                            className="conv-hub__offer-btn conv-hub__offer-btn--primary"
                            disabled={actionBusy === offer.id}
                            onClick={() => void patchOffer(offer.id, "accept")}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            className="conv-hub__offer-btn"
                            disabled={actionBusy === offer.id}
                            onClick={() => setCounterFor(offer.id)}
                          >
                            Counter
                          </button>
                          <button
                            type="button"
                            className="conv-hub__offer-btn"
                            disabled={actionBusy === offer.id}
                            onClick={() => void patchOffer(offer.id, "decline")}
                          >
                            Decline
                          </button>
                        </div>
                      ) : null}
                      {counterFor === offer.id ? (
                        <div className="conv-hub__counter">
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={counterAmount}
                            onChange={(event) => setCounterAmount(event.target.value)}
                            placeholder="Counter amount"
                            className="conv-hub__counter-input"
                          />
                          <button
                            type="button"
                            className="conv-hub__offer-btn conv-hub__offer-btn--primary"
                            onClick={() => {
                              const amount = Number(counterAmount);
                              if (!Number.isFinite(amount) || amount <= 0) return;
                              void patchOffer(offer.id, "counter", amount);
                            }}
                          >
                            Send counter
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                }
                return (
                  <MessageBubble
                    key={item.id}
                    message={item.message}
                    outgoing={item.message.senderRole === view.viewerRole}
                  />
                );
              })
            )}

            {null}

            {order?.status === "completed" || order?.completedAt ? (
              <div className="conv-hub__done-summary">
                <p className="conv-hub__done-title">Order completed</p>
                <button
                  type="button"
                  className="conv-hub__system-cta"
                  onClick={() => setReviewSheetOpen(true)}
                >
                  Leave a review
                </button>
              </div>
            ) : null}

            <div ref={threadEndRef} />
          </div>
        </div>

        <div className="conv-hub__footer">
          {warning ? <div className="conv-hub__warning">{warning}</div> : null}

          {reviewOpen ? null : view.dynamicActions.length > 0 ? (
            <div className="conv-hub__order-actions">
              {view.dynamicActions.map((action, index) => (
                <button
                  key={action.id}
                  type="button"
                  className={cn(
                    "conv-hub__order-action",
                    index === 0 && "conv-hub__order-action--primary",
                  )}
                  disabled={actionBusy === action.id}
                  onClick={() => void runOrderAction(action.id)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="conv-hub__hub-actions">
              <TransactionHubBottomActions
                conversationId={conversation.id}
                viewerRole={view.viewerRole}
                product={view.product}
                acceptedOffer={
                  acceptedOffer
                    ? { id: acceptedOffer.id, amount: acceptedOffer.amount }
                    : null
                }
                pendingOffer={
                  pendingOffer
                    ? { id: pendingOffer.id, amount: pendingOffer.amount }
                    : null
                }
                onCancelOffer={(offerId) => void patchOffer(offerId, "decline")}
              />
            </div>
          )}

          <form
            className="conv-hub__composer"
            data-composer-layout="single-row"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              handleSend();
            }}
          >
            <div className="conv-hub__composer-row">
              <label className="sr-only" htmlFor="conv-hub-composer">
                Message about this order
              </label>
              <textarea
                id="conv-hub-composer"
                ref={textareaRef}
                className="conv-hub__composer-field"
                rows={1}
                placeholder="Message about this order…"
                value={draft}
                disabled={conversation.blocked || sending}
                onChange={(event) => handleDraftChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                type="submit"
                className="conv-hub__send"
                aria-label="Send message"
                disabled={conversation.blocked || sending || !draft.trim()}
              >
                SEND
              </button>
            </div>
          </form>
        </div>

        {paymentSuccess ? (
          <TransactionHubPaymentSuccess
            open
            orderId={paymentSuccess.orderId}
            orderNumber={paymentSuccess.orderNumber}
            onContinueChat={() => setPaymentSuccess(null)}
          />
        ) : null}

        <CheckoutHubSheet
          open={resumeCheckoutOpen}
          onClose={() => setResumeCheckoutOpen(false)}
          productSlug={view.product.slug}
          conversationId={conversation.id}
          offerId={acceptedOffer?.id ?? null}
          acceptedOfferPrice={acceptedOffer?.amount ?? null}
        />
        <PlatformFeeSheet
          open={feeSheetOpen}
          itemPrice={acceptedOffer?.amount ?? view.product.price}
          onClose={() => setFeeSheetOpen(false)}
        />
        <ReviewTeaserSheet
          open={reviewSheetOpen}
          rating={5}
          summary="Excellent seller."
          body={"Fast delivery.\nItem exactly as described.\nHighly recommended."}
          onClose={() => setReviewSheetOpen(false)}
        />
      </div>
    </AccountCanonicalShell>
  );
}
