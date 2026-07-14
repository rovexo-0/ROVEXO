"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type SVGProps,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  BackLineIcon,
  ChevronRightLineIcon,
  DoubleCheckLineIcon,
  MoreLineIcon,
} from "@/components/icons/RvxLineIcons";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { useChatRealtime, signalTyping } from "@/features/messages/hooks/use-chat-realtime";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { CheckoutHubSheet } from "@/features/transaction-hub/CheckoutHubSheet";
import { TransactionHubBottomActions } from "@/features/transaction-hub/TransactionHubBottomActions";
import { TransactionHubPaymentSuccess } from "@/features/transaction-hub/TransactionHubPaymentSuccess";
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
  type ConversationOrderStatusStep,
} from "@/lib/inbox";
import { TRANSACTION_HUB_CANONICAL_STATUS } from "@/lib/transaction-hub/canonical";
import { transactionHubListingHref } from "@/lib/transaction-hub/inbox-routes";
import type { ChatMessage, Conversation } from "@/lib/messages/types";
import { formatMessageTime } from "@/lib/messages/utils";
import type { Order } from "@/lib/orders/types";
import { formatCurrency } from "@/lib/wallet/utils";
import { uploadListingImage } from "@/lib/listings/upload-client";
import "@/styles/rovexo/conversation-hub-v1.css";

type ConversationHubProps = {
  initialConversation: Conversation;
};

type LoadState = "ready" | "loading" | "error" | "offline";

type IconProps = SVGProps<SVGSVGElement>;

const HISTORY_PAGE = 40;

function PlusLineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function MessageBubble({
  message,
  outgoing,
  avatarUrl,
  avatarName,
  onOpenPhoto,
}: {
  message: ChatMessage;
  outgoing: boolean;
  avatarUrl?: string | null;
  avatarName: string;
  onOpenPhoto: (url: string) => void;
}) {
  const isRead = message.status === "read";
  const isDelivered = message.status === "delivered" || isRead;
  const isSent = message.status === "sent" || isDelivered;

  return (
    <div className={cn("conv-hub__msg", outgoing ? "conv-hub__msg--out" : "conv-hub__msg--in")}>
      {!outgoing ? <Avatar src={avatarUrl} alt={avatarName} name={avatarName} size="sm" /> : null}
      <div>
        <div className={cn("conv-hub__bubble", outgoing ? "conv-hub__bubble--out" : "conv-hub__bubble--in")}>
          {message.kind === "photo" ? (
            <button
              type="button"
              className="conv-hub__bubble-photo"
              onClick={() => onOpenPhoto(message.content)}
              aria-label="Open photo"
            >
              <SafeImage src={message.content} alt="Shared photo" fill sizes="180px" />
            </button>
          ) : (
            message.content
          )}
        </div>
        <span
          className={cn(
            "conv-hub__msg-meta",
            outgoing && isRead && "conv-hub__msg-meta--read",
            outgoing && isDelivered && !isRead && "conv-hub__msg-meta--delivered",
          )}
          aria-label={
            outgoing
              ? isRead
                ? "Seen"
                : isDelivered
                  ? "Delivered"
                  : isSent
                    ? "Sent"
                    : undefined
              : undefined
          }
        >
          <time dateTime={message.sentAt}>{formatMessageTime(message.sentAt)}</time>
          {outgoing && isDelivered ? <DoubleCheckLineIcon /> : null}
        </span>
      </div>
    </div>
  );
}

const RAIL_DISPLAY_LABELS: Record<ConversationOrderStatusStep["id"], string> = {
  paid: "Paid",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
};

function OrderStatusRail({
  steps,
  onSelect,
}: {
  steps: ConversationOrderStatusStep[];
  onSelect: (step: ConversationOrderStatusStep) => void;
}) {
  return (
    <div className="conv-hub__rail" role="list" aria-label="Order status">
      {steps.map((step) => {
        const label = RAIL_DISPLAY_LABELS[step.id];
        return (
          <button
            key={step.id}
            type="button"
            role="listitem"
            aria-label={label}
            className={cn(
              "conv-hub__rail-step",
              step.state === "complete" && "conv-hub__rail-step--complete",
              step.state === "current" && "conv-hub__rail-step--current",
            )}
            onClick={() => onSelect({ ...step, label })}
          >
            <span className="conv-hub__rail-dot" aria-hidden />
            <span className="conv-hub__rail-label" aria-hidden>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div
      className="conv-hub"
      data-conversation-hub={CONVERSATION_HUB_VERSION}
      data-conversation-freeze="FROZEN"
      aria-busy="true"
    >
      <div className="conv-hub__header">
        <span className="conv-hub__skel conv-hub__skel--icon" />
        <span className="conv-hub__skel conv-hub__skel--title" />
        <span className="conv-hub__skel conv-hub__skel--icon" />
      </div>
      <div className="conv-hub__body">
        <div className="conv-hub__skel conv-hub__skel--card" />
        <div className="conv-hub__skel conv-hub__skel--rail" />
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
  const [uploading, setUploading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("ready");
  const [historyCount, setHistoryCount] = useState(HISTORY_PAGE);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [counterFor, setCounterFor] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    orderId: string;
    orderNumber?: string | null;
  } | null>(null);
  const [resumeCheckoutOpen, setResumeCheckoutOpen] = useState(false);
  const paymentHandledRef = useRef(false);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachSheetOpen, setAttachSheetOpen] = useState(false);
  const pullStartY = useRef<number | null>(null);
  const typingTimer = useRef<number | null>(null);

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
        nextOrder =
          (payload.orders ?? []).find(
            (item) =>
              item.product.id === conversation.product.id ||
              item.product.slug === conversation.product.slug,
          ) ?? null;
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
          }>;
        };
        setOffers(
          (payload.offers ?? []).map((offer) => ({
            id: offer.id,
            amount: offer.amount,
            currency: "GBP",
            state: mapOfferDbStatus(offer.status),
            fromRole: "buyer" as const,
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
  }, [conversation.product.id, conversation.product.slug]);

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
      if (event.type === "typing.started") {
        setTypingLabel(`${conversation.participant.name} is typing…`);
      }
      if (event.type === "typing.stopped") setTypingLabel(null);
      if (event.type === "badge.updated" || event.type === "message.created") {
        void refreshBadges();
      }
      if (event.type === "offer.updated" || event.type === "tracking.updated" || event.type === "dispute.updated") {
        void reloadRelated();
      }
    });
    return () => sub.unsubscribe();
  }, [conversation.id, conversation.participant.name, refreshBadges, reloadRelated]);

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
        typingLabel,
      }),
    [conversation, order, offers, dispute, typingLabel],
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
  }, [timelineWindow.length, typingLabel, conversation.messages.length]);

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
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 1.4 * 16 * 6 + 20)}px`;
  }, []);

  useEffect(() => {
    resizeComposer();
  }, [draft, resizeComposer]);

  const sendMessage = useCallback(
    async (content: string, kind: "text" | "photo" | "emoji" = "text") => {
      const trimmed = content.trim();
      if (!trimmed || sending || conversation.blocked) return;

      setSending(true);
      const isFirstMessage = conversation.messages.length === 0;
      const optimisticId = `optimistic-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: optimisticId,
        senderRole: view.viewerRole,
        kind,
        content: trimmed,
        sentAt: new Date().toISOString(),
        status: "sent",
        reactions: {},
      };

      setConversation((current) => ({
        ...current,
        messages: [...current.messages, optimistic],
        lastMessage: kind === "photo" ? "Photo" : trimmed,
        lastMessageAt: optimistic.sentAt,
      }));

      try {
        const response = await fetch(`/api/messages/${conversation.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: trimmed, senderRole: view.viewerRole, kind }),
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
        void signalTyping(conversation.id, false);
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

  const handleSend = () => void sendMessage(draft, "text");

  const handleDraftChange = (value: string) => {
    setDraft(value);
    void signalTyping(conversation.id, value.trim().length > 0);
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      void signalTyping(conversation.id, false);
    }, 1200);
  };

  const handleUploadFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || conversation.blocked) return;
    setAttachSheetOpen(false);
    setUploading(true);
    try {
      const uploaded = await uploadListingImage({ file, productId: conversation.product.id });
      await sendMessage(uploaded.url, "photo");
    } catch (error) {
      pushToast({
        title: error instanceof Error ? error.message : "Unable to upload photo.",
        variant: "error",
      });
    } finally {
      setUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const sharePayload = async (title: string, url: string) => {
    setAttachSheetOpen(false);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      pushToast({ title: "Link copied.", variant: "success" });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        pushToast({ title: "Link copied.", variant: "success" });
      } catch {
        pushToast({ title: "Unable to share.", variant: "error" });
      }
    }
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
        offer?: { id: string; amount: number; createdAt: string; status: string };
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
            fromRole: view.viewerRole,
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
        router.push(`${view.orderDetailsHref}?review=1`);
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
        const payload = (await response.json()) as { case?: { id: string } };
        pushToast({ title: "Dispute opened.", variant: "success" });
        if (payload.case?.id) router.push(`/resolution/${payload.case.id}`);
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

  const orderNumber =
    view.orderReference.orderNumber ?? `Order #${view.orderReference.orderId.slice(0, 8).toUpperCase()}`;

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
        data-conversation-freeze="FROZEN"
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
            <h1 className="conv-hub__header-title">{view.product.title}</h1>
            <p className="conv-hub__header-sub">
              <span>{orderNumber}</span>
              <span className="conv-hub__header-badge">{view.orderStatusLabel}</span>
            </p>
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
                    router.push(view.orderDetailsHref);
                  }}
                >
                  View order
                </button>
                <button
                  type="button"
                  className="conv-hub__menu-item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    void fetch(`/api/messages/${conversation.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "mute", value: !conversation.muted }),
                    }).then((response) => {
                      if (!response.ok) return;
                      setConversation((current) => ({ ...current, muted: !current.muted }));
                      pushToast({
                        title: conversation.muted ? "Conversation unmuted." : "Conversation muted.",
                        variant: "success",
                      });
                    });
                  }}
                >
                  {conversation.muted ? "Unmute" : "Mute"} conversation
                </button>
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
          <Link href={view.orderDetailsHref} className="conv-hub__product">
            <span className="conv-hub__product-thumb">
              <SafeImage src={view.product.imageUrl} alt={view.product.title} fill sizes="52px" />
            </span>
            <span className="conv-hub__product-body">
              <span className="conv-hub__product-title">{view.product.title}</span>
              <span className="conv-hub__product-price">{formatCurrency(view.product.price)}</span>
              <span className="conv-hub__product-meta">
                <Avatar
                  src={view.sellerAvatarUrl ?? view.participantAvatarUrl}
                  alt={view.sellerName}
                  name={view.sellerName}
                  size="sm"
                  className="conv-hub__product-seller-avatar"
                />
                <span>{view.sellerName}</span>
                <span>· {orderNumber}</span>
              </span>
            </span>
            <span className="conv-hub__product-aside">
              <span className="conv-hub__product-status">{view.orderStatusLabel}</span>
              <ChevronRightLineIcon className="conv-hub__chevron" />
            </span>
          </Link>

          <OrderStatusRail
            steps={view.statusSteps}
            onSelect={(step) =>
              pushToast({
                title: step.label,
                description:
                  step.state === "future"
                    ? "This step has not started yet."
                    : step.state === "current"
                      ? "Current order stage."
                      : "Step complete.",
                variant: "info",
              })
            }
          />

          {view.tracking ? (
            <section className="conv-hub__section conv-hub__section--delivery" aria-label="Tracking">
              <h2 className="conv-hub__section-title">Expected delivery:</h2>
              <p className="conv-hub__delivery-line">
                <span className="conv-hub__delivery-name">
                  {view.tracking.estimatedDelivery ?? "Pending"}
                </span>
                <span className="conv-hub__delivery-meta">{view.tracking.courierName}</span>
              </p>
              {view.tracking.trackingNumber ? (
                <div className="conv-hub__section-row">
                  <span>Tracking</span>
                  <span className="conv-hub__section-value">{view.tracking.trackingNumber}</span>
                </div>
              ) : null}
              <div className="conv-hub__section-actions">
                <a
                  className="conv-hub__section-cta"
                  href={
                    view.tracking.carrierUrl ??
                    (order ? `/orders/${order.id}/tracking` : view.orderDetailsHref)
                  }
                  target={view.tracking.carrierUrl ? "_blank" : undefined}
                  rel={view.tracking.carrierUrl ? "noreferrer" : undefined}
                >
                  Open tracking
                </a>
                <button type="button" className="conv-hub__section-cta conv-hub__section-cta--ghost" onClick={() => void copyTracking()}>
                  Copy tracking
                </button>
              </div>
            </section>
          ) : (
            <section className="conv-hub__section conv-hub__section--delivery" aria-label="Tracking">
              <h2 className="conv-hub__section-title">Expected delivery:</h2>
              <p className="conv-hub__empty-note">Waiting for shipment</p>
            </section>
          )}

          <section className="conv-hub__section conv-hub__section--dispute" aria-label="Dispute">
            <h2 className="conv-hub__section-title">Dispute</h2>
            {view.dispute ? (
              <>
                <div className="conv-hub__section-row">
                  <span>{view.dispute.title}</span>
                  <span className="conv-hub__section-value">{view.dispute.status}</span>
                </div>
                {view.dispute.decisionSummary ? (
                  <p className="conv-hub__empty-note">{view.dispute.decisionSummary}</p>
                ) : null}
                <Link href={`/resolution/${view.dispute.id}`} className="conv-hub__section-cta">
                  Continue dispute
                </Link>
              </>
            ) : (
              <>
                <p className="conv-hub__empty-note">Transaction running normally</p>
                <button
                  type="button"
                  className="conv-hub__section-cta conv-hub__section-cta--ghost"
                  onClick={() => void runOrderAction("open_dispute")}
                >
                  Open dispute
                </button>
              </>
            )}
          </section>

          {view.attachments.length > 0 ? (
            <section className="conv-hub__section" aria-label="Attachments">
              <h2 className="conv-hub__section-title">Attachments</h2>
              <div className="conv-hub__attachments">
                {view.attachments.map((attachment) => (
                  <button
                    key={attachment.id}
                    type="button"
                    className="conv-hub__attachment"
                    onClick={() => setPreviewUrl(attachment.url)}
                  >
                    {attachment.label}
                  </button>
                ))}
              </div>
            </section>
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
                  const compactOfferSystem =
                    item.event === "offer_accepted" || item.event === "offer_declined";
                  return (
                    <div
                      key={item.id}
                      className={cn("conv-hub__system", compactOfferSystem && "conv-hub__system--offer")}
                      data-event={item.event}
                    >
                      <p className="conv-hub__system-title">{item.title}</p>
                      {!compactOfferSystem && item.subtitle ? (
                        <p className="conv-hub__system-sub">{item.subtitle}</p>
                      ) : null}
                      <p className="conv-hub__system-sub">
                        <time dateTime={item.at}>{formatMessageTime(item.at)}</time>
                      </p>
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
                      {isOpen && view.viewerRole === "seller" ? (
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
                            onClick={() => void patchOffer(offer.id, "decline")}
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            className="conv-hub__offer-btn"
                            disabled={actionBusy === offer.id}
                            onClick={() => setCounterFor(offer.id)}
                          >
                            Counter Offer
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
                    avatarUrl={view.participantAvatarUrl}
                    avatarName={view.participantName}
                    onOpenPhoto={setPreviewUrl}
                  />
                );
              })
            )}

            {typingLabel ? <div className="conv-hub__typing">{typingLabel}</div> : null}
            <div ref={threadEndRef} />
          </div>
        </div>

        <div className="conv-hub__footer">
          {warning ? <div className="conv-hub__warning">{warning}</div> : null}

          {view.dynamicActions.length > 0 ? (
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
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              handleSend();
            }}
          >
            <button
              type="button"
              className="conv-hub__icon-btn"
              aria-label="Add attachment"
              aria-expanded={attachSheetOpen}
              disabled={conversation.blocked || uploading}
              onClick={() => setAttachSheetOpen(true)}
            >
              <PlusLineIcon />
            </button>
            <label className="sr-only" htmlFor="conv-hub-composer">
              Write a message
            </label>
            <textarea
              id="conv-hub-composer"
              ref={textareaRef}
              className="conv-hub__composer-field"
              rows={1}
              placeholder={uploading ? "Uploading…" : "Write a message..."}
              value={draft}
              disabled={conversation.blocked || sending || uploading}
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
              disabled={conversation.blocked || sending || uploading || !draft.trim()}
            >
              Send
            </button>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => void handleUploadFiles(event.target.files)}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => void handleUploadFiles(event.target.files)}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              capture="environment"
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => void handleUploadFiles(event.target.files)}
            />
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => void handleUploadFiles(event.target.files)}
            />
          </form>

          {attachSheetOpen ? (
            <div
              className="conv-hub__attach-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Add attachment"
            >
              <button
                type="button"
                className="conv-hub__attach-backdrop"
                aria-label="Close attachment options"
                onClick={() => setAttachSheetOpen(false)}
              />
              <div className="conv-hub__attach-panel">
                <p className="conv-hub__attach-title">Add</p>
                <button
                  type="button"
                  className="conv-hub__attach-item"
                  disabled={conversation.blocked || uploading}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  Take photo
                </button>
                <button
                  type="button"
                  className="conv-hub__attach-item"
                  disabled={conversation.blocked || uploading}
                  onClick={() => galleryInputRef.current?.click()}
                >
                  Gallery
                </button>
                <button
                  type="button"
                  className="conv-hub__attach-item"
                  disabled={conversation.blocked || uploading}
                  onClick={() => videoInputRef.current?.click()}
                >
                  Video
                </button>
                <button
                  type="button"
                  className="conv-hub__attach-item"
                  disabled={conversation.blocked || uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Files
                </button>
                <button
                  type="button"
                  className="conv-hub__attach-item"
                  onClick={() => {
                    const path = transactionHubListingHref(view.product.slug);
                    void sharePayload(
                      view.product.title,
                      `${window.location.origin}${path}`,
                    );
                  }}
                >
                  Share listing
                </button>
                <button
                  type="button"
                  className="conv-hub__attach-item"
                  disabled={!view.tracking?.trackingNumber}
                  onClick={() => {
                    if (!view.tracking?.trackingNumber) {
                      pushToast({ title: "Tracking is not available yet.", variant: "info" });
                      setAttachSheetOpen(false);
                      return;
                    }
                    const href =
                      view.tracking.carrierUrl ??
                      (order ? `/orders/${order.id}/tracking` : view.orderDetailsHref);
                    void sharePayload(
                      `Tracking ${view.tracking.trackingNumber}`,
                      href.startsWith("http") ? href : `${window.location.origin}${href}`,
                    );
                  }}
                >
                  Share tracking
                </button>
                <button
                  type="button"
                  className="conv-hub__attach-item"
                  onClick={() => {
                    void sharePayload(
                      `Order ${orderNumber}`,
                      `${window.location.origin}${view.orderDetailsHref}`,
                    );
                  }}
                >
                  Share order details
                </button>
                <button
                  type="button"
                  className="conv-hub__attach-item conv-hub__attach-item--cancel"
                  onClick={() => setAttachSheetOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {previewUrl ? (
          <div className="conv-hub__preview" role="dialog" aria-modal="true" aria-label="Attachment preview">
            <button type="button" className="conv-hub__preview-close" onClick={() => setPreviewUrl(null)}>
              Close
            </button>
            <div className="conv-hub__preview-frame">
              <SafeImage src={previewUrl} alt="Attachment preview" fill sizes="100vw" />
            </div>
            <a className="conv-hub__preview-download" href={previewUrl} download target="_blank" rel="noreferrer">
              Download
            </a>
          </div>
        ) : null}

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
      </div>
    </AccountCanonicalShell>
  );
}
