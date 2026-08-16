"use client";

/* P0-01: page-scoped — do not also import via styles/rovexo/index.css (Turbopack dual-import). */
import "@/styles/rovexo/conversation-hub-v1.css";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BackLineIcon,
} from "@/components/icons/RvxLineIcons";
import { RovexoHeaderCloseButton } from "@/components/navigation/RovexoHeaderCloseButton";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { useChatRealtime } from "@/features/messages/hooks/use-chat-realtime";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { CheckoutHubSheet } from "@/features/transaction-hub/CheckoutHubSheet";
import { TransactionHubPaymentSuccess } from "@/features/transaction-hub/TransactionHubPaymentSuccess";
import { TransactionActionBar } from "@/features/inbox/components/TransactionActionBar";
import { TransactionStatusCard } from "@/features/inbox/components/TransactionStatusCard";
import { BuyerIssueReasonCard } from "@/features/inbox/components/BuyerIssueReasonCard";
import { PlatformFeeSheet } from "@/features/inbox/components/PlatformFeeSheet";
import { OfferBundleDetailsSheet } from "@/features/inbox/components/OfferBundleDetailsSheet";
import { OrderReviewCard } from "@/features/orders/components/OrderReviewCard";
import { OrderDetailView } from "@/features/orders/components/OrderDetailView";
import { ResolutionDetailsView } from "@/features/inbox/components/ResolutionDetailsView";
import { resolveResolutionDetailsView } from "@/lib/inbox/resolution-details-v1";
import {
  ShippingLabelViewer,
  cacheShippingLabelUrl,
} from "@/features/shipping/components/ShippingLabelViewer";
import { NativeImageFileInput } from "@/components/ui/NativeImageFileInput";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { SafeImage } from "@/components/ui/SafeImage";
import { useToast } from "@/components/ui/Toast";
import { ProductFullscreenImageViewer } from "@/features/product-detail/ProductFullscreenImageViewer";
import { cn } from "@/lib/cn";
import { isBuyerCancellableOrderStatus } from "@/lib/orders/cancellation";
import { isRenderableImageSrc } from "@/lib/media/is-valid-image-src";
import { sanitizeNativeImagePickerId } from "@/lib/media/native-image-picker";
import {
  isMessagePhotoStoragePath,
  isRenderableMessagePhotoSrc,
  MESSAGE_PHOTO_PREVIEW_LABEL,
} from "@/lib/messages/message-photo-url-v1";
import { prepareMessagePhotoFile } from "@/lib/messages/prepare-message-photo-v1";
import { resolveMessagePhotoUrl } from "@/lib/messages/resolve-message-photo-url.client";
import { resolvePublicProfileHref } from "@/lib/profile/public-profile-href";
import { trackGaEvent } from "@/lib/analytics/ga4-events";
import Link from "next/link";
import {
  CONVERSATION_HUB_VERSION,
  INBOX_ROUTES,
  MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1,
  BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1,
  MASTER_STACK_BUYER_HUB_V1,
  buildConversationHubView,
  mapOfferDbStatus,
  resolveSprint1PaymentUi,
  resolveConversationHubTransactionCardView,
  isTransactionStatusCardActive,
  subscribeConversationRealtime,
  type ActiveShippingLabelView,
  type ConversationDisputeView,
  type ConversationOfferView,
} from "@/lib/inbox";
import {
  parseProtectionCaseOutcome,
  parseProtectionCaseStatus,
  parseProtectionCaseType,
} from "@/lib/inbox/seller-resolution-lifecycle-v1";
import { shouldOmitOfferFromChatTimeline } from "@/lib/supreme-blood-code-viii-v1";
import { Avatar } from "@/components/ui/Avatar";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { TRANSACTION_HUB_CANONICAL_STATUS } from "@/lib/transaction-hub/canonical";
import { transactionHubListingHref } from "@/lib/transaction-hub/inbox-routes";
import {
  buildBuyNowCheckoutHref,
  useBuyNowNavigation,
} from "@/features/checkout/hooks/use-buy-now-navigation";
import type { ChatMessage, Conversation } from "@/lib/messages/types";
import { getViewerRole } from "@/lib/messages/types";
import { formatMessageTime } from "@/lib/messages/utils";
import { getTrackingUrl } from "@/lib/orders/status";
import type { Order } from "@/lib/orders/types";
import type { CanonicalResolutionActionId } from "@/lib/inbox/canonical-buyer-seller-resolution-v1";
import { isUnauthorizedSellerResolutionAction } from "@/lib/inbox/canonical-buyer-seller-resolution-v1";
import {
  canSubmitBuyerIssue,
  isBuyerIssueReasonFlowAvailable,
  type BuyerIssueReasonId,
} from "@/lib/inbox/buyer-issue-reason-v1";
import { NON_DELIVERY_RESOLUTION_CASE_V1 } from "@/lib/inbox/non-delivery-resolution-case-v1";
import { formatCurrency } from "@/lib/wallet/utils";
import { WALLET_ROUTES } from "@/lib/wallet/canonical-routes";
import { calculateOrderTotals } from "@/lib/orders/pricing";
import { AccountIcon, type AccountIconName } from "@/components/account/AccountIcons";
import { invalidateShareInflight, shareInflightJson } from "@/lib/performance/fetch";
import { bumpInboxConversationPreview } from "@/lib/inbox/inbox-list-cache";
import { logPushRtFlow } from "@/lib/push/push-realtime-flow-log-v1";
/* conversation-hub-v1.css is page-scoped on this module (P0-01) — do not dual-import via index.css. */

/**
 * Compact Offer/Counter product thumb(s) — horizontal, max 3 slots, no overlap stack.
 * ≤3 products → up to 3 real thumbs · >3 → first 2 thumbs + "+N" remaining.
 * Images from bundle.lines[].imageUrl · else conversation product image.
 * No fetch · no N+1 · no Hub redesign · no sheet.
 */
const OFFER_CARD_THUMB_MAX = 3;

function resolveOfferCardProductThumbs(input: {
  bundle?: ConversationOfferView["bundle"];
  productImageUrl?: string | null;
}): { urls: string[]; moreCount: number } {
  const lines = Array.isArray(input.bundle?.lines) ? input.bundle.lines : [];
  const totalProducts =
    typeof input.bundle?.itemCount === "number" && input.bundle.itemCount > 0
      ? input.bundle.itemCount
      : lines.length;

  const allUrls: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string | null | undefined) => {
    const url = typeof raw === "string" ? raw.trim() : "";
    if (!url || seen.has(url) || !isRenderableImageSrc(url)) return;
    seen.add(url);
    allUrls.push(url);
  };
  for (const line of lines) push(line?.imageUrl);
  if (allUrls.length === 0) push(input.productImageUrl);

  if (totalProducts > OFFER_CARD_THUMB_MAX) {
    const visible = allUrls.slice(0, 2);
    return {
      urls: visible,
      moreCount: Math.max(0, totalProducts - visible.length),
    };
  }

  return {
    urls: allUrls.slice(0, OFFER_CARD_THUMB_MAX),
    moreCount: 0,
  };
}

/**
 * After text/photo send — update Messages list preview via existing XLIII inbox-sync.
 * No polling · no second cache engine · no Hub UI redesign.
 */
function syncMessagesListAfterSend(input: {
  conversationId: string;
  lastMessage: string;
  lastMessageAt: string;
  source: "message_sent" | "photo_sent";
}) {
  invalidateShareInflight("GET:/api/messages");
  bumpInboxConversationPreview({
    conversationId: input.conversationId,
    lastMessage: input.lastMessage,
    lastMessageAt: input.lastMessageAt,
  });
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("rovexo:inbox-sync", {
      detail: {
        conversationId: input.conversationId,
        bloodLaw: "XLIII",
        source: input.source,
        lastMessage: input.lastMessage,
        lastMessageAt: input.lastMessageAt,
      },
    }),
  );
}

function formatCompactSystemWhen(iso: string): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${day} • ${time}`;
}

/** Same AccountIcon family + Profile colour language — no emoji / alternate icon sets. */
function systemEventIcon(event: string): { name: AccountIconName; color: string } {
  switch (event) {
    case "payment_received":
    case "payment_confirmed":
    case "funds_released":
    case "completed":
      return { name: "payment", color: "#06B6D4" };
    case "shipping_label_generated":
    case "label_created":
      return { name: "shipping", color: "#F59E0B" };
    case "tracking_updated":
    case "tracking_added":
    case "parcel_collected":
    case "delivered":
    case "parcel_delivered":
      return { name: "tracking", color: "#9333EA" };
    case "dispute_started":
      return { name: "disputes", color: "#EF4444" };
    case "cancelled":
    case "offer_declined":
      return { name: "support", color: "#DC2626" };
    case "offer_accepted":
      return { name: "orders", color: "#22C55E" };
    case "refund":
    case "refund_issued":
    case "refund_completed":
      return { name: "refunds", color: "#60A5FA" };
    case "review_available":
      return { name: "reviews", color: "#FFD54A" };
    default:
      return { name: "notifications", color: "#9333EA" };
  }
}

type ConversationHubProps = {
  initialConversation: Conversation;
  /** Dev-only mockup fixture offers — never from live DB. */
  initialOffers?: ConversationOfferView[];
  /** Dev-only lifecycle fixture order — never from live DB. */
  initialOrder?: Order | null;
  /** Dev-only lifecycle fixture dispute. */
  initialDispute?: ConversationDisputeView | null;
  /** Dev-only label availability for shipping states. */
  initialHasShippingLabel?: boolean;
  /** Dev-only: open checkout resume sheet for Checkout Ready scenario. */
  initialCheckoutResume?: boolean;
  /** When true: in-memory demo only — no API/DB mutations. */
  demoMode?: boolean;
};

type LoadState = "ready" | "loading" | "error" | "offline";

const HISTORY_PAGE = 40;

function MessagePhotoBubble({
  content,
  onOpen,
}: {
  content: string;
  onOpen: (originalUrl: string) => void;
}) {
  const [src, setSrc] = useState<string | null>(() =>
    isRenderableMessagePhotoSrc(content) ? content : null,
  );

  useEffect(() => {
    let cancelled = false;
    if (isRenderableMessagePhotoSrc(content)) {
      setSrc(content);
      return () => {
        cancelled = true;
      };
    }
    if (!isMessagePhotoStoragePath(content)) {
      setSrc(null);
      return () => {
        cancelled = true;
      };
    }
    setSrc(null);
    void resolveMessagePhotoUrl(content).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [content]);

  if (src && isRenderableImageSrc(src)) {
    return (
      <button
        type="button"
        className="conv-hub__bubble-photo-btn"
        aria-label="Open photo fullscreen"
        onClick={() => onOpen(src)}
      >
        <SafeImage
          src={src}
          alt=""
          width={200}
          height={200}
          className="conv-hub__bubble-photo"
          sizes="200px"
        />
      </button>
    );
  }

  return (
    <span className="conv-hub__bubble-photo-pending" aria-busy="true" aria-label="Loading photo">
      {MESSAGE_PHOTO_PREVIEW_LABEL}
    </span>
  );
}

function MessageBubble({
  message,
  avatarSrc,
  avatarName,
  onOpenPhoto,
}: {
  message: ChatMessage;
  avatarSrc?: string | null;
  avatarName: string;
  onOpenPhoto: (originalUrl: string) => void;
}) {
  /** Canonical mockup: Buyer left · Seller right. */
  const isBuyer = message.senderRole === "buyer";
  const isPhoto = message.kind === "photo";
  const content = isPhoto ? MESSAGE_PHOTO_PREVIEW_LABEL : message.content;
  const avatar = (
    <Avatar
      src={avatarSrc}
      alt={avatarName}
      name={avatarName}
      size="sm"
      className="conv-hub__msg-avatar"
    />
  );

  return (
    <div className={cn("conv-hub__msg", isBuyer ? "conv-hub__msg--buyer" : "conv-hub__msg--seller")}>
      {isBuyer ? avatar : null}
      <div className="conv-hub__msg-stack">
        <div className={cn("conv-hub__bubble", isBuyer ? "conv-hub__bubble--buyer" : "conv-hub__bubble--seller")}>
          {isPhoto ? (
            <MessagePhotoBubble content={message.content} onOpen={onOpenPhoto} />
          ) : (
            content
          )}
        </div>
        <span className="conv-hub__msg-meta">
          <time dateTime={message.sentAt}>{formatMessageTime(message.sentAt)}</time>
          {!isBuyer && (message.status === "delivered" || message.status === "read") ? (
            <span className="conv-hub__msg-ticks" aria-hidden>
              ✓✓
            </span>
          ) : null}
        </span>
      </div>
      {!isBuyer ? avatar : null}
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

export function ConversationHub({
  initialConversation,
  initialOffers,
  initialOrder = null,
  initialDispute = null,
  initialHasShippingLabel = false,
  initialCheckoutResume = false,
  demoMode = false,
}: ConversationHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const { profile } = useProfile();
  const { refresh: refreshBadges } = useRealtimeNotifications();
  const { executeBuyNow } = useBuyNowNavigation();
  const cameraPickerId = sanitizeNativeImagePickerId(`conv-hub-camera-${useId()}`);

  const [conversation, setConversation] = useState(initialConversation);
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [buyerNonDeliveryUi, setBuyerNonDeliveryUi] = useState(false);
  const [nonDeliveryInformationHint, setNonDeliveryInformationHint] = useState(false);
  const [issueReasonOpen, setIssueReasonOpen] = useState(false);
  const [issueReasonId, setIssueReasonId] = useState<BuyerIssueReasonId | null>(null);
  const [issueReasonDescription, setIssueReasonDescription] = useState("");
  const [issueReasonPhotos, setIssueReasonPhotos] = useState<
    { previewUrl: string; file: File }[]
  >([]);
  const [hasShippingLabel, setHasShippingLabel] = useState(initialHasShippingLabel);
  const [activeShippingLabel, setActiveShippingLabel] = useState<ActiveShippingLabelView | null>(
    null,
  );
  /* Phase A1 — paint immediately from initialConversation; related hydrates in background. */
  const [relatedReady, setRelatedReady] = useState(true);
  const [offers, setOffers] = useState<ConversationOfferView[]>(initialOffers ?? []);
  const [dispute, setDispute] = useState<ConversationDisputeView | null>(initialDispute);
  const [draft, setDraft] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState<{ file: File; previewUrl: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("ready");
  const [historyCount, setHistoryCount] = useState(HISTORY_PAGE);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    orderId: string;
    orderNumber?: string | null;
  } | null>(null);
  const [resumeCheckoutOpen, setResumeCheckoutOpen] = useState(initialCheckoutResume);
  const [reviewOpen, setReviewOpen] = useState(false);
  const requestedOrderId = searchParams.get("order") ?? searchParams.get("order_id");
  const highlightOfferId = searchParams.get("offerId");
  const paymentHandledRef = useRef(false);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const refreshBadgesRef = useRef(refreshBadges);
  const pushToastRef = useRef(pushToast);
  const focusSyncAtRef = useRef(0);
  const reloadGenerationRef = useRef(0);

  // Keep latest callbacks in refs for async/event handlers — sync in layout, not during render.
  useLayoutEffect(() => {
    refreshBadgesRef.current = refreshBadges;
  }, [refreshBadges]);
  useLayoutEffect(() => {
    pushToastRef.current = pushToast;
  }, [pushToast]);

  const [feeSheetOpen, setFeeSheetOpen] = useState(false);
  /** VIEW ORDER — canonical OrderDetailView sheet (not same-page hub redirect). */
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [resolutionDetailsOpen, setResolutionDetailsOpen] = useState(false);
  const [bundleDetailsOffer, setBundleDetailsOffer] = useState<{
    offer: ConversationOfferView;
    isCounter: boolean;
  } | null>(null);
  const [imageViewer, setImageViewer] = useState<{
    open: boolean;
    images: string[];
    initialIndex: number;
    title: string;
  }>({ open: false, images: [], initialIndex: 0, title: "Photo" });
  const [labelViewer, setLabelViewer] = useState<{
    pdfUrl: string | null;
    orderId: string;
    carrierName?: string | null;
  } | null>(null);

  useChatRealtime(conversation.id, conversation.participant.id, setConversation, !demoMode);

  /* Phase A2 — sign any photo storage paths present on first paint (failed server sign / stale cache). */
  useEffect(() => {
    if (demoMode) return;
    let cancelled = false;
    for (const message of conversation.messages) {
      if (message.kind !== "photo" || !isMessagePhotoStoragePath(message.content)) continue;
      const path = message.content;
      const messageId = message.id;
      void resolveMessagePhotoUrl(path).then((url) => {
        if (!url || cancelled) return;
        setConversation((current) => ({
          ...current,
          messages: current.messages.map((item) =>
            item.id === messageId &&
            (item.content === path || isMessagePhotoStoragePath(item.content))
              ? { ...item, content: url }
              : item,
          ),
        }));
      });
    }
    return () => {
      cancelled = true;
    };
    // Only on conversation identity change — not every message append.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Phase A2 mount hydrate
  }, [conversation.id, demoMode]);

  const reloadRelated = useCallback(async () => {
    if (demoMode) {
      setLoadState("ready");
      setRelatedReady(true);
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setLoadState("offline");
      setRelatedReady(true);
      return;
    }

    /* Soft background hydrate — never blank the hub (Phase A1). */
    try {
      const ordersKey = "GET:/api/orders";
      const offersKey = `GET:/api/offers?productSlug=${conversation.product.slug}`;
      const [ordersPayload, offersPayload] = await Promise.all([
        shareInflightJson<{ orders?: Order[] }>(ordersKey, "/api/orders", { ttlMs: 1500 }).catch(
          () => ({ orders: [] as Order[] }),
        ),
        shareInflightJson<{
          offers?: Array<{
            id: string;
            amount: number;
            status: string;
            createdAt: string;
            buyerId: string;
            fromRole?: "buyer" | "seller";
            parentOfferId?: string | null;
            bundle?: {
              bundleId: string | null;
              itemCount: number;
              listSubtotal: number;
              quantitySum: number;
              lines?: Array<{
                productId: string;
                imageUrl: string;
                title?: string;
                quantity?: number;
                unitPrice?: number;
              }>;
            } | null;
          }>;
        }>(
          offersKey,
          `/api/offers?productSlug=${encodeURIComponent(conversation.product.slug)}`,
          { ttlMs: 1500 },
        ).catch(() => ({ offers: [] as Array<{
          id: string;
          amount: number;
          status: string;
          createdAt: string;
          buyerId: string;
          fromRole?: "buyer" | "seller";
          parentOfferId?: string | null;
          bundle?: {
            bundleId: string | null;
            itemCount: number;
            listSubtotal: number;
            quantitySum: number;
            lines?: Array<{
              productId: string;
              imageUrl: string;
              title?: string;
              quantity?: number;
              unitPrice?: number;
            }>;
          } | null;
        }> })),
      ]);

      let nextOrder: Order | null = null;
      const matchingOrders = (ordersPayload.orders ?? []).filter(
        (item) =>
          item.product.id === conversation.product.id ||
          item.product.slug === conversation.product.slug,
      );
      nextOrder = requestedOrderId
        ? matchingOrders.find((item) => item.id === requestedOrderId) ?? null
        : matchingOrders.length === 0
          ? null
          : [...matchingOrders].sort(
              (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
            )[0] ?? null;
      setOrder(nextOrder);
      if (!nextOrder) {
        setHasShippingLabel(false);
        setActiveShippingLabel(null);
      }

      setOffers(
        (offersPayload.offers ?? []).map((offer) => ({
          id: offer.id,
          amount: offer.amount,
          currency: "GBP",
          state: mapOfferDbStatus(offer.status),
          fromRole: offer.fromRole === "seller" || offer.fromRole === "buyer" ? offer.fromRole : "buyer",
          createdAt: offer.createdAt,
          parentOfferId: offer.parentOfferId ?? null,
          bundle: offer.bundle
            ? {
                bundleId: offer.bundle.bundleId ?? null,
                itemCount: offer.bundle.itemCount,
                listSubtotal: offer.bundle.listSubtotal,
                quantitySum: offer.bundle.quantitySum,
                /* Already on offers API payload — no extra image fetch. */
                lines: offer.bundle.lines,
              }
            : null,
        })),
      );

      if (nextOrder) {
        const labelKey = `GET:/api/shipping/labels?orderId=${nextOrder.id}`;
        const caseKey = `GET:/api/protection/cases?orderId=${nextOrder.id}`;
        const [labelPayload, casePayload] = await Promise.all([
          shareInflightJson<{
            ok?: boolean;
            pdfUrl?: string | null;
            trackingNumber?: string | null;
            carrier?: string | null;
            serviceName?: string | null;
            shippingService?: string | null;
          }>(
            labelKey,
            `/api/shipping/labels?orderId=${encodeURIComponent(nextOrder.id)}`,
            { ttlMs: 2000 },
          ).catch(() => null),
          shareInflightJson<{
            case?: {
              id: string;
              status: string;
              caseType?: string;
              outcome?: string | null;
              reason: string;
              resolvedAt?: string | null;
              adminNotes?: string;
              sellerResolution?: {
                reasonId?: string | null;
                offer?: ConversationDisputeView["sellerOffer"];
              } | null;
            } | null;
          }>(
            caseKey,
            `/api/protection/cases?orderId=${encodeURIComponent(nextOrder.id)}`,
            { ttlMs: 2000 },
          ).catch(() => null),
        ]);

        if (labelPayload) {
          setHasShippingLabel(
            Boolean(
              labelPayload.ok ||
                labelPayload.pdfUrl ||
                labelPayload.trackingNumber ||
                nextOrder.trackingNumber ||
                nextOrder.status === "shipped" ||
                nextOrder.status === "delivered" ||
                nextOrder.status === "completed",
            ),
          );
          const labelCarrier = labelPayload.carrier?.trim();
          if (labelCarrier) {
            setActiveShippingLabel({
              carrier: labelCarrier,
              serviceName:
                labelPayload.serviceName?.trim() ||
                labelPayload.shippingService?.trim() ||
                null,
              trackingNumber: labelPayload.trackingNumber?.trim() || null,
            });
          } else {
            setActiveShippingLabel(null);
          }
        } else {
          setHasShippingLabel(
            Boolean(
              nextOrder.trackingNumber ||
                nextOrder.status === "shipped" ||
                nextOrder.status === "delivered" ||
                nextOrder.status === "completed",
            ),
          );
          setActiveShippingLabel(null);
        }

        if (casePayload?.case) {
          setDispute({
            id: casePayload.case.id,
            status: parseProtectionCaseStatus(casePayload.case.status) ?? "open",
            caseType: parseProtectionCaseType(casePayload.case.caseType) ?? undefined,
            outcome: parseProtectionCaseOutcome(casePayload.case.outcome),
            title: casePayload.case.reason || "Transaction dispute",
            updatedAt: casePayload.case.resolvedAt ?? new Date().toISOString(),
            decisionSummary: casePayload.case.adminNotes?.startsWith("RVX_SR_V1:")
              ? null
              : casePayload.case.adminNotes || null,
            reasonId: casePayload.case.sellerResolution?.reasonId ?? casePayload.case.reason ?? null,
            sellerOffer: casePayload.case.sellerResolution?.offer ?? null,
          });
        } else if (casePayload) {
          setDispute(null);
        }
      }

      setLoadState("ready");
      setRelatedReady(true);
    } catch {
      setLoadState(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
      setRelatedReady(true);
    }
  }, [conversation.product.id, conversation.product.slug, demoMode, requestedOrderId]);

  /* Ignore stale background hydrates after conversation switch / unmount (Phase A1 memory). */
  useEffect(() => {
    const generation = ++reloadGenerationRef.current;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled || generation !== reloadGenerationRef.current) return;
      void reloadRelated();
    });
    return () => {
      cancelled = true;
    };
  }, [reloadRelated]);

  useEffect(() => {
    if (demoMode) return;
    let cancelled = false;
    const sourceParam = searchParams.get("focus");
    const source =
      sourceParam === "counter"
        ? ("counter_offer" as const)
        : searchParams.get("offerId")
          ? ("offer" as const)
          : searchParams.get("order") || searchParams.get("order_id")
            ? ("order" as const)
            : ("hub_mount" as const);

    void fetch(`/api/messages/${conversation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", source }),
    })
      .then(async (response) => {
        if (cancelled) return;
        const payload = (await response.json().catch(() => null)) as {
          success?: boolean;
          sync?: { ok?: boolean };
          conversation?: typeof conversation;
        } | null;
        if (!response.ok || payload?.success === false) {
          pushToastRef.current({
            title: "Inbox sync failed. Conversation may stay unread.",
            variant: "error",
          });
          return;
        }
        if (payload?.conversation) {
          setConversation((current) => ({
            ...current,
            ...payload.conversation,
            unreadCount: 0,
          }));
        } else {
          setConversation((current) => ({ ...current, unreadCount: 0 }));
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("rovexo:inbox-sync", {
              detail: {
                conversationId: conversation.id,
                bloodLaw: "XLIII",
                source,
              },
            }),
          );
        }
        await refreshBadgesRef.current();
      })
      .catch(() => {
        if (!cancelled) {
          pushToastRef.current({
            title: "Inbox sync failed. Conversation may stay unread.",
            variant: "error",
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // Mount / conversation change only — unstable callback identities must not re-fire XLIII sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: conversation.id only
  }, [conversation.id, demoMode]);

  useEffect(() => {
    if (demoMode) return;
    /* XLIII mark-read on focus only — lifecycle data is realtime-driven. */
    const syncOpen = (source: "hub_focus") => {
      const now = Date.now();
      if (now - focusSyncAtRef.current < 8_000) return;
      focusSyncAtRef.current = now;
      void fetch(`/api/messages/${conversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read", source }),
      }).then(async (response) => {
        if (!response.ok) return;
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("rovexo:inbox-sync", {
              detail: { conversationId: conversation.id, bloodLaw: "XLIII", source },
            }),
          );
        }
        await refreshBadgesRef.current();
      });
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      syncOpen("hub_focus");
    };
    const onFocus = () => {
      syncOpen("hub_focus");
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [conversation.id, demoMode]);

  useEffect(() => {
    if (demoMode) return;
    const viewerRole =
      conversation.participant.role === "buyer" ? "seller" : "buyer";
    const selfId = profile?.id ?? null;
    const buyerId =
      viewerRole === "buyer" ? selfId : conversation.participant.id;
    const sellerId =
      viewerRole === "seller" ? selfId : conversation.participant.id;
    const sub = subscribeConversationRealtime(
      conversation.id,
      (event) => {
        if (event.type === "message.created" && event.payload) {
          const row = event.payload;
          const id = String(row.id ?? "");
          if (id) {
            setConversation((current) => {
              if (current.messages.some((message) => message.id === id)) return current;
              const incoming: ChatMessage = {
                id,
                senderRole: (row.sender_role as ChatMessage["senderRole"]) ?? "buyer",
                kind: (row.kind as ChatMessage["kind"]) ?? "text",
                content: row.deleted_at ? "Message deleted" : String(row.content ?? ""),
                sentAt: String(row.sent_at ?? new Date().toISOString()),
                status: (row.status as ChatMessage["status"]) ?? "delivered",
                replyToId: row.reply_to_id ? String(row.reply_to_id) : null,
                editedAt: row.edited_at ? String(row.edited_at) : null,
                deletedAt: row.deleted_at ? String(row.deleted_at) : null,
                reactions: (row.reactions as Record<string, string[]>) ?? {},
                moderationWarning: row.moderation_warning
                  ? String(row.moderation_warning)
                  : null,
              };
              return {
                ...current,
                messages: [...current.messages, incoming],
                lastMessage: incoming.content,
                lastMessageAt: incoming.sentAt,
              };
            });
          }
        }
        if (
          event.type === "badge.updated" ||
          event.type === "message.created" ||
          event.type === "message.updated"
        ) {
          void refreshBadgesRef.current();
        }
        if (
          event.type === "offer.updated" ||
          event.type === "tracking.updated" ||
          event.type === "dispute.updated" ||
          event.type === "order.updated"
        ) {
          logPushRtFlow("REALTIME_EVENT_RECEIVED", {
            type: event.type,
            conversationId: conversation.id,
            productId: conversation.product.id,
          });
          // Bust soft cache so peer Offer/Order UI updates without Refresh.
          invalidateShareInflight("GET:/api/offers?");
          invalidateShareInflight("GET:/api/orders");
          void reloadRelated().then(() => {
            logPushRtFlow("UI_UPDATED", {
              type: event.type,
              conversationId: conversation.id,
            });
          });
        }
      },
      {
        productId: conversation.product.id,
        orderId: order?.id ?? null,
        buyerId,
        sellerId,
      },
    );
    return () => sub.unsubscribe();
  }, [
    conversation.id,
    conversation.participant.id,
    conversation.participant.role,
    conversation.product.id,
    demoMode,
    order?.id,
    profile?.id,
    reloadRelated,
  ]);

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

  const hubQa = useMemo(
    () =>
      resolveConversationHubTransactionCardView({
        viewerRole: getViewerRole(conversation.participant),
        order,
        hasAcceptedOffer: offers.some((offer) => offer.state === "accepted"),
        hasShippingLabel,
        tracking: null,
        checkoutResumeAvailable: resumeCheckoutOpen,
        liveDispute: dispute,
        buyerNonDeliveryUi,
        reasonId: dispute?.reasonId ?? null,
      }),
    [
      conversation.participant,
      order,
      offers,
      hasShippingLabel,
      resumeCheckoutOpen,
      dispute,
      buyerNonDeliveryUi,
    ],
  );
  const uiOrder = hubQa.uiOrder;

  const view = useMemo(
    () =>
      buildConversationHubView({
        conversation,
        order: uiOrder,
        offers,
        dispute: hubQa.dispute,
        hasShippingLabel,
        activeShippingLabel,
      }),
    [conversation, uiOrder, offers, hubQa.dispute, hasShippingLabel, activeShippingLabel],
  );

  const buyerAvatar = useMemo(() => {
    if (view.viewerRole === "buyer") {
      return {
        src: profile?.avatarUrl ?? null,
        name: profile?.fullName || "Buyer",
      };
    }
    return {
      src: view.participantAvatarUrl ?? null,
      name: view.participantName,
    };
  }, [profile?.avatarUrl, profile?.fullName, view.participantAvatarUrl, view.participantName, view.viewerRole]);

  const sellerAvatar = useMemo(() => {
    if (view.viewerRole === "seller") {
      return {
        src: profile?.avatarUrl ?? null,
        name: profile?.fullName || "Seller",
      };
    }
    return {
      src: view.participantAvatarUrl ?? null,
      name: view.participantName,
    };
  }, [profile?.avatarUrl, profile?.fullName, view.participantAvatarUrl, view.participantName, view.viewerRole]);

  const acceptedOffer = useMemo(
    () => offers.find((offer) => offer.state === "accepted") ?? null,
    [offers],
  );
  const pendingOffer = useMemo(() => {
    if (acceptedOffer) return null;
    const open = offers.filter((offer) => offer.state === "open");
    if (open.length === 0) return null;
    return [...open].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0] ?? null;
  }, [acceptedOffer, offers]);
  const terminalOffer = useMemo(() => {
    if (acceptedOffer || pendingOffer) return null;
    const terminal = offers.filter(
      (offer) => offer.state === "declined" || offer.state === "expired",
    );
    if (terminal.length === 0) return null;
    const latest = [...terminal].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    )[0];
    if (!latest || (latest.state !== "declined" && latest.state !== "expired")) return null;
    return { id: latest.id, amount: latest.amount, state: latest.state };
  }, [acceptedOffer, pendingOffer, offers]);
  const paymentUi = useMemo(
    () =>
      resolveSprint1PaymentUi({
        viewerRole: view.viewerRole,
        order: uiOrder,
        listingPrice: view.product.price,
        acceptedOfferAmount: acceptedOffer?.amount ?? null,
      }),
    [view.viewerRole, view.product.price, uiOrder, acceptedOffer],
  );
  const itemPrice = acceptedOffer?.amount ?? view.product.price;
  const buyerTotalIncl = paymentUi.buyerBreakdown?.total ?? calculateOrderTotals(itemPrice, 0).total;
  const compactStatus =
    view.productCardStatus === "Sold" || view.productCardStatus === "Completed"
      ? "Sold"
      : view.productCardStatus === "Offer Pending" || acceptedOffer
        ? "Reserved"
        : "Available";
  const feeLine =
    view.viewerRole === "buyer"
      ? `£${buyerTotalIncl.toFixed(2)} incl. Platform Fee`
      : null;

  const transactionStatusCard = useMemo(
    () =>
      resolveConversationHubTransactionCardView({
        viewerRole: view.viewerRole,
        order,
        hasAcceptedOffer: Boolean(acceptedOffer),
        hasShippingLabel,
        tracking: view.tracking,
        checkoutResumeAvailable: resumeCheckoutOpen,
        liveDispute: dispute,
        buyerNonDeliveryUi,
        reasonId: dispute?.reasonId ?? null,
      }).card,
    [
      view.viewerRole,
      view.tracking,
      order,
      acceptedOffer,
      hasShippingLabel,
      resumeCheckoutOpen,
      dispute,
      buyerNonDeliveryUi,
    ],
  );

  const resolutionDetails = useMemo(
    () =>
      resolveResolutionDetailsView({
        viewerRole: view.viewerRole,
        order: uiOrder,
        overlay: {
          reasonId: dispute?.reasonId ?? null,
          sellerOffer: dispute?.sellerOffer ?? null,
          protectionStatus: dispute?.status ?? null,
          protectionCaseType: dispute?.caseType ?? null,
          protectionOutcome: dispute?.outcome ?? null,
        },
        dispute: hubQa.dispute,
        tracking: view.tracking,
      }),
    [view.viewerRole, uiOrder, dispute, hubQa.dispute, view.tracking],
  );

  const timelineWindow = useMemo(() => {
    const items = view.timeline;
    if (items.length <= historyCount) return items;
    return items.slice(items.length - historyCount);
  }, [view.timeline, historyCount]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [
    timelineWindow.length,
    conversation.messages.length,
    offers.length,
    acceptedOffer?.id,
    pendingOffer?.id,
  ]);

  useEffect(() => {
    if (!highlightOfferId) return;
    const node = document.getElementById(`offer-${highlightOfferId}`);
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [highlightOfferId, offers, timelineWindow.length]);

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

  const activateCanonicalComposer = useCallback(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.focus();
    node.scrollIntoView({ block: "end", behavior: "smooth" });
  }, []);

  useEffect(() => {
    resizeComposer();
  }, [draft, resizeComposer]);

  useLayoutEffect(() => {
    if (!nonDeliveryInformationHint) return;
    activateCanonicalComposer();
  }, [nonDeliveryInformationHint, activateCanonicalComposer]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || sending || conversation.blocked) return;

      if (demoMode) {
        pushToast({
          title: "Demo conversation — messaging is read-only.",
          variant: "info",
        });
        return;
      }

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
        syncMessagesListAfterSend({
          conversationId: conversation.id,
          lastMessage: payload.conversation?.lastMessage ?? trimmed,
          lastMessageAt: payload.conversation?.lastMessageAt ?? optimistic.sentAt,
          source: "message_sent",
        });
        setDraft("");
        setNonDeliveryInformationHint(false);
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
      demoMode,
      pushToast,
      view.viewerRole,
      refreshBadges,
    ],
  );

  const clearPendingPhoto = useCallback(() => {
    setPendingPhoto((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  }, []);

  const resetIssueReasonForm = useCallback(() => {
    setIssueReasonOpen(false);
    setIssueReasonId(null);
    setIssueReasonDescription("");
    setIssueReasonPhotos((current) => {
      for (const photo of current) URL.revokeObjectURL(photo.previewUrl);
      return [];
    });
  }, []);

  /** Clear composer pending without revoking — blob may still be the optimistic bubble src. */
  const dismissPendingPhotoKeepBlob = useCallback(() => {
    setPendingPhoto(null);
  }, []);

  const photoUploadLockRef = useRef(false);

  const handlePhotoSelected = useCallback(
    (files: FileList) => {
      const file = files.item(0);
      if (!file || conversation.blocked || sending || photoUploadLockRef.current) return;

      void (async () => {
        try {
          const prepared = await prepareMessagePhotoFile(file);
          const previewUrl = URL.createObjectURL(prepared);
          setPendingPhoto((current) => {
            if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
            return { file: prepared, previewUrl };
          });
        } catch {
          pushToast({
            title: "This photo could not be processed. Try JPEG or PNG.",
            variant: "error",
          });
        }
      })();
    },
    [conversation.blocked, sending, pushToast],
  );

  const sendPhoto = useCallback(async () => {
    if (!pendingPhoto || sending || conversation.blocked || photoUploadLockRef.current) return;

    if (demoMode) {
      pushToast({
        title: "Demo conversation — messaging is read-only.",
        variant: "info",
      });
      return;
    }

    photoUploadLockRef.current = true;
    setSending(true);
    const isFirstMessage = conversation.messages.length === 0;
    const optimisticId = `optimistic-photo-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: optimisticId,
      senderRole: view.viewerRole,
      kind: "photo",
      content: pendingPhoto.previewUrl,
      sentAt: new Date().toISOString(),
      status: "sent",
      reactions: {},
    };

    setConversation((current) => ({
      ...current,
      messages: [...current.messages, optimistic],
      lastMessage: MESSAGE_PHOTO_PREVIEW_LABEL,
      lastMessageAt: optimistic.sentAt,
    }));

    const attachment = pendingPhoto;
    dismissPendingPhotoKeepBlob();

    try {
      const body = new FormData();
      body.append("file", attachment.file);
      body.append("senderRole", view.viewerRole);
      const response = await fetch(`/api/messages/${conversation.id}/photo`, {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as {
        conversation?: Conversation;
        message?: ChatMessage;
        warning?: string | null;
        error?: string;
      };

      if (!response.ok) {
        setConversation((current) => ({
          ...current,
          messages: current.messages.filter((message) => message.id !== optimisticId),
        }));
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
        setWarning(payload.error ?? "Unable to send photo.");
        return;
      }

      if (payload.conversation) {
        setConversation((current) => {
          const next = payload.conversation!;
          const signedFromAppend =
            payload.message && isRenderableMessagePhotoSrc(payload.message.content)
              ? payload.message
              : null;

          const mergedMessages = next.messages.map((serverMessage) => {
            if (signedFromAppend && serverMessage.id === signedFromAppend.id) {
              return { ...serverMessage, content: signedFromAppend.content };
            }
            if (serverMessage.kind !== "photo") return serverMessage;
            if (isRenderableMessagePhotoSrc(serverMessage.content)) return serverMessage;
            const optimisticMatch = current.messages.find(
              (message) =>
                message.id === optimisticId && isRenderableMessagePhotoSrc(message.content),
            );
            if (optimisticMatch) {
              return { ...serverMessage, content: optimisticMatch.content };
            }
            return serverMessage;
          });
          return { ...next, messages: mergedMessages };
        });

        for (const message of payload.conversation.messages) {
          if (message.kind === "photo" && isMessagePhotoStoragePath(message.content)) {
            void resolveMessagePhotoUrl(message.content).then((url) => {
              if (!url) return;
              setConversation((current) => ({
                ...current,
                messages: current.messages.map((item) =>
                  item.id === message.id &&
                  (item.content === message.content ||
                    item.content === attachment.previewUrl ||
                    isMessagePhotoStoragePath(item.content))
                    ? { ...item, content: url }
                    : item,
                ),
              }));
              if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
            });
          }
        }

        if (
          payload.message &&
          isRenderableMessagePhotoSrc(payload.message.content) &&
          attachment.previewUrl
        ) {
          URL.revokeObjectURL(attachment.previewUrl);
        }

        if (isFirstMessage) {
          trackGaEvent("chat_started", {
            conversation_id: conversation.id,
            item_id: conversation.product.slug,
            item_name: conversation.product.title,
          });
        }
      }
      syncMessagesListAfterSend({
        conversationId: conversation.id,
        lastMessage: payload.conversation?.lastMessage ?? MESSAGE_PHOTO_PREVIEW_LABEL,
        lastMessageAt: payload.conversation?.lastMessageAt ?? optimistic.sentAt,
        source: "photo_sent",
      });
      setWarning(payload.warning ?? null);
      setNonDeliveryInformationHint(false);
      void refreshBadges();
    } finally {
      photoUploadLockRef.current = false;
      setSending(false);
    }
  }, [
    pendingPhoto,
    sending,
    conversation.blocked,
    conversation.id,
    conversation.messages.length,
    conversation.product.slug,
    conversation.product.title,
    demoMode,
    pushToast,
    view.viewerRole,
    dismissPendingPhotoKeepBlob,
    refreshBadges,
  ]);

  const handleSend = () => {
    if (pendingPhoto) {
      void sendPhoto();
      return;
    }
    void sendMessage(draft);
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
  };

  useEffect(() => {
    return () => {
      if (pendingPhoto?.previewUrl) URL.revokeObjectURL(pendingPhoto.previewUrl);
    };
  }, [pendingPhoto]);

  const patchOffer = async (offerId: string, action: "accept" | "decline" | "counter", amount?: number) => {
    if (demoMode) {
      pushToast({
        title: "Demo conversation — offer actions are UI-only.",
        variant: "info",
      });
      return;
    }
    setActionBusy(offerId);
    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          amount,
          conversationId: conversation.id,
          expectedStatus: "pending",
        }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        status?: string;
        code?: string;
        parentOfferId?: string;
        offer?: {
          id: string;
          amount: number;
          createdAt: string;
          status: string;
          fromRole?: "buyer" | "seller";
          parentOfferId?: string;
        };
        checkoutHref?: string;
        error?: string;
      };
      if (!response.ok || !payload.success) {
        const exactError = payload.error?.trim() || "Offer action failed.";
        pushToast({ title: exactError, variant: "error" });
        // Fail-closed UI sync: if backend says offer is no longer pending, hide actions.
        const closedCodes = new Set([
          "OFFER_EXPIRED",
          "OFFER_ALREADY_ACCEPTED",
          "OFFER_ALREADY_DECLINED",
          "OFFER_CANCELLED",
          "OFFER_ALREADY_COUNTERED",
          "OFFER_LOCKED",
          "OFFER_VERSION_MISMATCH",
          "OFFER_NOT_PENDING",
        ]);
        if (payload.code && closedCodes.has(payload.code)) {
          setOffers((current) =>
            current.map((item) =>
              item.id === offerId
                ? {
                    ...item,
                    state:
                      payload.code === "OFFER_ALREADY_ACCEPTED"
                        ? ("accepted" as const)
                        : payload.code === "OFFER_EXPIRED"
                          ? ("expired" as const)
                          : payload.code === "OFFER_ALREADY_COUNTERED"
                            ? ("countered" as const)
                            : ("declined" as const),
                  }
                : item,
            ),
          );
        }
        // Refresh from server to resolve any desync.
        void reloadRelated();
        return;
      }

      if (action === "counter" && payload.offer) {
        const nextOffer = payload.offer;
        setOffers((current) => {
          const parent = current.find((item) => item.id === offerId);
          return [
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
              parentOfferId: nextOffer.parentOfferId ?? offerId,
              /* Reuse parent bundle lines already in Hub state — no new fetch. */
              bundle: parent?.bundle ?? null,
            },
          ];
        });
        pushToast({
          title:
            view.viewerRole === "seller"
              ? "Counter Sent · Waiting for Buyer"
              : "Counter Sent · Waiting for Seller",
          variant: "success",
        });
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
      void refreshBadges();
      void reloadRelated();
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("rovexo:inbox-sync", {
            detail: {
              conversationId: conversation.id,
              bloodLaw: "XLIII",
              source: `offer_${action}`,
            },
          }),
        );
      }
      if (action === "accept" && view.viewerRole === "buyer" && payload.checkoutHref) {
        router.push(payload.checkoutHref);
      }
    } finally {
      setActionBusy(null);
    }
  };

  const runResolutionAction = (actionId: CanonicalResolutionActionId, amount?: number) => {
    if (isUnauthorizedSellerResolutionAction(actionId)) {
      pushToast({ title: "This action is not available.", variant: "info" });
      return;
    }
    if (!dispute?.id || !order?.id) {
      pushToast({ title: "Resolution details are not available yet.", variant: "info" });
      return;
    }
    void (async () => {
      const response = await fetch(`/api/protection/cases/${dispute.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "seller_resolution",
          actionId,
          amount,
          reasonId: dispute.reasonId ?? null,
          eligibleAmount: order.totals.itemPrice ?? order.product.price,
        }),
      });
      if (!response.ok) {
        pushToast({ title: "Unable to update resolution.", variant: "error" });
        return;
      }
      pushToast({ title: "Resolution updated.", variant: "success" });
      void reloadRelated();
    })();
  };

  const runOrderAction = async (actionId: string) => {
    if (actionId === "view_order") {
      /*
       * orderDetailsHref points at this Conversation Hub (?order=).
       * router.push same URL produces no visible transition — open canonical OrderDetailView.
       */
      if (!order) {
        pushToast({ title: "Order details will appear once purchased.", variant: "info" });
        return;
      }
      if (!profile?.id) {
        pushToast({ title: "Sign in again to view order details.", variant: "error" });
        return;
      }
      setOrderDetailsOpen(true);
      return;
    }
    if (actionId === "cancel_order") {
      /*
       * Cancel is compact inside Order Details (BuyerCancelOrderCard).
       * Legacy status-card cancel_order opens the same canonical surface.
       */
      if (view.viewerRole !== "buyer") {
        pushToast({ title: "Only the buyer can cancel this order.", variant: "info" });
        return;
      }
      if (!order) {
        pushToast({ title: "Order details will appear once purchased.", variant: "info" });
        return;
      }
      if (!profile?.id) {
        pushToast({ title: "Sign in again to view order details.", variant: "error" });
        return;
      }
      setOrderDetailsOpen(true);
      return;
    }
    if (actionId === "withdraw") {
      /* Messages Master Rewrite: Wallet is the only financial location.
         Never surface Withdraw inside Messages — soft-redirect if legacy action id arrives. */
      router.push(WALLET_ROUTES.hub);
      return;
    }
    if (actionId === "report_issue") {
      if (view.viewerRole !== "buyer") {
        return;
      }
      if (uiOrder?.status === "shipped" || !isBuyerIssueReasonFlowAvailable(uiOrder?.status)) {
        pushToast({
          title: "This issue type is available after delivery.",
          variant: "info",
        });
        return;
      }
      setIssueReasonOpen(true);
      return;
    }
    if (actionId === "add_information") {
      if (view.viewerRole !== "buyer") {
        return;
      }
      setNonDeliveryInformationHint(true);
      activateCanonicalComposer();
      return;
    }
    if (actionId === "contact_seller") {
      setNonDeliveryInformationHint(false);
      setDraft("");
      clearPendingPhoto();
      activateCanonicalComposer();
      return;
    }
    if (actionId === "track_parcel") {
      const trackingNumber = (
        activeShippingLabel?.trackingNumber ||
        view.tracking?.trackingNumber ||
        order?.trackingNumber ||
        ""
      ).trim();
      if (!trackingNumber) {
        pushToast({
          title: "Tracking will appear once the carrier scans your parcel.",
          variant: "info",
        });
        return;
      }
      const carrier = (
        activeShippingLabel?.carrier ||
        view.tracking?.courierName ||
        order?.deliveryCarrier ||
        "Royal Mail"
      ).trim() as Order["deliveryCarrier"];
      const trackingUrl = getTrackingUrl(carrier, trackingNumber);
      if (!trackingUrl) {
        pushToast({
          title: "Tracking will appear once the carrier scans your parcel.",
          variant: "info",
        });
        return;
      }
      window.location.assign(trackingUrl);
      return;
    }
    if (actionId === "buy_now" || actionId === "resume_payment") {
      if (demoMode) {
        pushToast({
          title: "Demo conversation — Buy Now is UI-only (no checkout).",
          variant: "info",
        });
        return;
      }
      const result = await executeBuyNow({
        productSlug: conversation.product.slug,
        offerId: acceptedOffer?.id ?? null,
        conversationId: conversation.id,
        bundleId: acceptedOffer?.bundle?.bundleId ?? null,
        onError: (message) => pushToast({ title: message, variant: "error" }),
      });
      if (!result.ok) return;
      router.push(buildBuyNowCheckoutHref(conversation.product.slug, result.checkoutPath));
      return;
    }
    if (actionId === "view_dispute") {
      setResolutionDetailsOpen(true);
      return;
    }

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
      if (actionId === "view_label") {
        if (view.viewerRole !== "seller") {
          pushToast({ title: "Only the seller can open the shipping label.", variant: "info" });
          return;
        }
        /* Always resolve latest document URL — demo presentation must not use stale cache. */
        const response = await fetch(
          `/api/shipping/labels?orderId=${encodeURIComponent(order.id)}`,
          { cache: "no-store" },
        );
        if (!response.ok) {
          setLabelViewer({
            pdfUrl: null,
            orderId: order.id,
            carrierName: order.deliveryCarrier ?? null,
          });
          return;
        }
        const payload = (await response.json()) as {
          pdfUrl?: string | null;
          labelUrl?: string | null;
          label?: { pdfUrl?: string | null; labelUrl?: string | null } | null;
          carrier?: string | null;
        };
        const url =
          payload.pdfUrl ||
          payload.labelUrl ||
          payload.label?.pdfUrl ||
          payload.label?.labelUrl ||
          null;
        if (url) cacheShippingLabelUrl(order.id, url);
        setLabelViewer({
          pdfUrl: url,
          orderId: order.id,
          carrierName: payload.carrier ?? order.deliveryCarrier ?? null,
        });
        return;
      }
      if (actionId === "print_label" || actionId === "download_label") {
        if (view.viewerRole !== "seller") {
          pushToast({ title: "Only the seller can manage shipping labels.", variant: "info" });
          return;
        }
        const response = hasShippingLabel
          ? await fetch(`/api/shipping/labels?orderId=${encodeURIComponent(order.id)}`, {
              cache: "no-store",
            })
          : await fetch("/api/shipping/labels", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: order.id }),
            });
        if (!response.ok) {
          let toastTitle = "Unable to get shipping label.";
          try {
            const failure = (await response.json()) as { error?: unknown };
            if (typeof failure.error === "string") {
              const apiError = failure.error.trim();
              if (apiError.length > 0 && apiError.length <= 280) {
                toastTitle = apiError;
              }
            }
          } catch {
            /* keep fallback when body is missing or not JSON */
          }
          pushToast({ title: toastTitle, variant: "error" });
          return;
        }
        const payload = (await response.json()) as {
          pdfUrl?: string | null;
          labelUrl?: string | null;
          label?: {
            pdfUrl?: string | null;
            labelUrl?: string | null;
            carrier?: string | null;
            trackingNumber?: string | null;
          } | null;
          carrier?: string | null;
          trackingNumber?: string | null;
          serviceName?: string | null;
          shippingService?: string | null;
          parcel?: { shippingService?: string | null; carrier?: string | null } | null;
          record?: { pricing?: { quotes?: Array<{ serviceName?: string }> } | null } | null;
        };
        setHasShippingLabel(true);
        const url =
          payload.pdfUrl ||
          payload.labelUrl ||
          payload.label?.pdfUrl ||
          payload.label?.labelUrl ||
          null;
        const createdCarrier =
          payload.carrier?.trim() ||
          payload.label?.carrier?.trim() ||
          payload.parcel?.carrier?.trim() ||
          null;
        if (createdCarrier) {
          setActiveShippingLabel({
            carrier: createdCarrier,
            serviceName:
              payload.serviceName?.trim() ||
              payload.shippingService?.trim() ||
              payload.parcel?.shippingService?.trim() ||
              null,
            trackingNumber:
              payload.trackingNumber?.trim() ||
              payload.label?.trackingNumber?.trim() ||
              null,
          });
        }
        if (url) {
          cacheShippingLabelUrl(order.id, url);
          setLabelViewer({
            pdfUrl: url,
            orderId: order.id,
            carrierName: createdCarrier ?? order.deliveryCarrier ?? null,
          });
        }
        pushToast({ title: "Shipping label ready.", variant: "success" });
        void reloadRelated();
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
        /* MES: carrier scan owns tracking after label — no manual Mark as Sent / Add Tracking. */
        pushToast({
          title: "Tracking updates automatically after the carrier scans your parcel.",
          variant: "info",
        });
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
        pushToast({ title: "Everything OK — payment release started.", variant: "success" });
        void reloadRelated();
        return;
      }
      if (actionId === "report_not_arrived") {
        setBuyerNonDeliveryUi(true);
        return;
      }
      if (actionId === "submit_issue") {
        if (!issueReasonId || !isBuyerIssueReasonFlowAvailable(uiOrder?.status)) {
          return;
        }
        if (
          !canSubmitBuyerIssue({
            reasonId: issueReasonId,
            description: issueReasonDescription,
            photoCount: issueReasonPhotos.length,
          })
        ) {
          return;
        }
        const response = await fetch(`/api/orders/${order.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "report_issue",
            reasonId: issueReasonId,
            description: issueReasonDescription.trim(),
          }),
        });
        if (!response.ok) {
          pushToast({ title: "Unable to report issue.", variant: "error" });
          return;
        }
        resetIssueReasonForm();
        void reloadRelated();
      }
    } finally {
      setActionBusy(null);
    }
  };

  if (!relatedReady && !demoMode) {
    return (
      <AccountCanonicalShell
        title="Conversation"
        hideBack
        showBottomNav={false}
        contentClassName="!p-0"
      >
        <ConversationSkeleton />
      </AccountCanonicalShell>
    );
  }

  const headerPrice = itemPrice;
  const participantProfileHref = resolvePublicProfileHref(
    conversation.participant.username,
  );

  /* Accepted + no order: Transaction Status Card owns CTA — skip empty sticky spacer. */
  const hideStickyActions =
    Boolean(acceptedOffer) &&
    !view.hasOrder &&
    view.dynamicActions.length === 0 &&
    !view.actionBarPanel;

  return (
    <AccountCanonicalShell
      title="Conversation"
      hideBack
      showBottomNav={false}
      contentClassName="!p-0"
    >
      <div
        className="conv-hub"
        data-conversation-hub={CONVERSATION_HUB_VERSION}
        data-conversation-freeze="FINAL-LOCK"
        data-conversation-hub-ui="v2-canonical"
        data-blood-code-viii="v1"
        data-hub-purified="true"
        data-master-buyer-hub={MASTER_BUYER_CONVERSATION_HUB_FREEZE_V1.version}
        data-master-ui-freeze={BUYER_CONVERSATION_HUB_MASTER_UI_FREEZE_V1.version}
        data-master-stack={MASTER_STACK_BUYER_HUB_V1.version}
        data-transaction-hub-freeze={TRANSACTION_HUB_CANONICAL_STATUS}
        data-conversation-realtime={demoMode ? "demo" : "live"}
        data-conversation-shell="fullscreen"
        data-bottom-nav="hidden"
        data-omit-offer-fn={shouldOmitOfferFromChatTimeline.name}
        data-demo-conversation={demoMode ? "mockup-v1" : undefined}
      >
        <header className="conv-hub__header" data-master-stack-layer="HEADER">
          <button
            type="button"
            className="conv-hub__icon-btn"
            aria-label="Back to Inbox"
            onClick={() => router.push(INBOX_ROUTES.hub)}
          >
            <BackLineIcon />
          </button>
          <div className="conv-hub__header-centre conv-hub__header-centre--identity">
            {participantProfileHref ? (
              <Link
                href={participantProfileHref}
                className="conv-hub__header-profile-link"
                aria-label={`View ${view.participantName} profile`}
              >
                <Avatar
                  src={view.participantAvatarUrl}
                  alt={view.participantName}
                  name={view.participantName}
                  size="sm"
                  className="conv-hub__header-avatar"
                />
                <div className="conv-hub__header-identity">
                  <p className="conv-hub__header-title">{view.participantName}</p>
                  <p
                    className={cn(
                      "conv-hub__header-sub",
                      conversation.participant.online && "conv-hub__header-sub--online",
                    )}
                  >
                    {conversation.participant.online ? (
                      <span className="conv-hub__online-dot" aria-hidden />
                    ) : null}
                    {view.participantActiveLabel}
                  </p>
                </div>
              </Link>
            ) : (
              <>
                <Avatar
                  src={view.participantAvatarUrl}
                  alt={view.participantName}
                  name={view.participantName}
                  size="sm"
                  className="conv-hub__header-avatar"
                />
                <div className="conv-hub__header-identity">
                  <p className="conv-hub__header-title">{view.participantName}</p>
                  <p
                    className={cn(
                      "conv-hub__header-sub",
                      conversation.participant.online && "conv-hub__header-sub--online",
                    )}
                  >
                    {conversation.participant.online ? (
                      <span className="conv-hub__online-dot" aria-hidden />
                    ) : null}
                    {view.participantActiveLabel}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="conv-hub__menu">
            <RovexoHeaderCloseButton
              className="conv-hub__close"
              fallbackHref={INBOX_ROUTES.hub}
            />
          </div>
        </header>

        {loadState === "offline" || loadState === "error" ? (
          <div className={cn("conv-hub__banner", loadState === "error" && "conv-hub__banner--error")}>
            <span>
              {loadState === "offline"
                ? "You’re offline."
                : "This conversation is temporarily unavailable."}
            </span>
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
        >
          <div className="conv-hub__scroll-stack">
          <div
            className="conv-hub__product conv-hub__product--compact"
            data-master-stack-layer="PRODUCT_CARD"
            role="link"
            tabIndex={0}
            aria-label="Open listing"
            onClick={() => {
              if (demoMode) {
                pushToast({
                  title: "Demo conversation — listing is fixture-only.",
                  variant: "info",
                });
                return;
              }
              router.push(transactionHubListingHref(view.product.slug));
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (demoMode) {
                  pushToast({
                    title: "Demo conversation — listing is fixture-only.",
                    variant: "info",
                  });
                  return;
                }
                router.push(transactionHubListingHref(view.product.slug));
              }
            }}
          >
            <span className="conv-hub__product-thumb">
              <button
                type="button"
                className="conv-hub__product-thumb-btn"
                aria-label={`Open ${view.product.title} photo fullscreen`}
                onClick={(event) => {
                  event.stopPropagation();
                  const url = view.product.imageUrl;
                  if (!isRenderableImageSrc(url)) return;
                  setImageViewer({
                    open: true,
                    images: [url],
                    initialIndex: 0,
                    title: view.product.title,
                  });
                }}
              >
                <SafeImage
                  src={view.product.imageUrl || "/placeholder-product.svg"}
                  alt={view.product.title}
                  fill
                  sizes="52px"
                  className="conv-hub__product-thumb-img"
                />
              </button>
            </span>
            <span className="conv-hub__product-body">
              <span className="conv-hub__product-title">{view.product.title}</span>
              <span className="conv-hub__product-price">{formatCurrency(headerPrice)}</span>
              {feeLine ? (
                <span className="conv-hub__product-incl">
                  {feeLine}
                  <button
                    type="button"
                    className="conv-hub__fee-shield"
                    aria-label="Platform Fee information"
                    onClick={(event) => {
                      event.stopPropagation();
                      setFeeSheetOpen(true);
                    }}
                  >
                    <AccountIcon name="verification" className="conv-hub__fee-shield-icon" />
                  </button>
                </span>
              ) : null}
            </span>
            <span className="conv-hub__product-aside">
              <span
                className={cn(
                  "conv-hub__product-status",
                  compactStatus === "Available" && "conv-hub__product-status--available",
                  compactStatus === "Reserved" && "conv-hub__product-status--reserved",
                  compactStatus === "Sold" && "conv-hub__product-status--sold",
                )}
              >
                {compactStatus}
              </span>
              <span className="conv-hub__chevron" aria-hidden>
                ›
              </span>
            </span>
          </div>

          {isTransactionStatusCardActive(transactionStatusCard) ? (
            <TransactionStatusCard
              status={transactionStatusCard.status}
              title={transactionStatusCard.title}
              description={transactionStatusCard.description}
              icon={transactionStatusCard.icon}
              primaryAction={transactionStatusCard.primaryAction}
              secondaryAction={transactionStatusCard.secondaryAction}
              trackingDetail={transactionStatusCard.trackingDetail}
              resolutionCase={transactionStatusCard.resolutionCase}
              informationHint={nonDeliveryInformationHint}
              busy={Boolean(actionBusy)}
              onAction={(actionId) => void runOrderAction(actionId)}
            />
          ) : null}

          {issueReasonOpen &&
          view.viewerRole === "buyer" &&
          isBuyerIssueReasonFlowAvailable(uiOrder?.status) ? (
            <BuyerIssueReasonCard
              reasonId={issueReasonId}
              description={issueReasonDescription}
              photoPreviews={issueReasonPhotos.map((photo) => photo.previewUrl)}
              busy={Boolean(actionBusy)}
              onReasonChange={setIssueReasonId}
              onDescriptionChange={setIssueReasonDescription}
              onPhotosSelected={(files) => {
                const next = Array.from(files).map((file) => ({
                  file,
                  previewUrl: URL.createObjectURL(file),
                }));
                setIssueReasonPhotos((current) => [...current, ...next]);
              }}
              onRemovePhoto={(index) => {
                setIssueReasonPhotos((current) => {
                  const removed = current[index];
                  if (removed) URL.revokeObjectURL(removed.previewUrl);
                  return current.filter((_, photoIndex) => photoIndex !== index);
                });
              }}
              onSubmit={() => void runOrderAction("submit_issue")}
            />
          ) : null}

          {reviewOpen && order ? (
            <div className="conv-hub__inline-review" aria-label="Leave feedback">
              <OrderReviewCard
                orderId={order.id}
                sellerName={
                  view.viewerRole === "seller"
                    ? view.participantName || "buyer"
                    : view.sellerName
                }
              />
            </div>
          ) : null}

          <div
            className="conv-hub__timeline"
            data-master-stack-layer="CHAT_HISTORY"
            aria-live="polite"
          >
            {historyCount < view.timeline.length ? (
              <button
                type="button"
                className="conv-hub__load-more"
                onClick={() => setHistoryCount((count) => Math.min(view.timeline.length, count + HISTORY_PAGE))}
              >
                Load earlier messages
              </button>
            ) : null}

            {timelineWindow.length === 0 && !conversation.lastMessage.trim() ? (
              <div className="conv-hub__timeline-empty">
                <p className="conv-hub__timeline-empty-title">Start conversation</p>
                <p className="conv-hub__timeline-empty-sub">Send a message about this listing to begin.</p>
              </div>
            ) : timelineWindow.length === 0 ? (
              <div className="conv-hub__timeline-empty" role="status">
                <p className="conv-hub__timeline-empty-title">Loading messages…</p>
              </div>
            ) : (
              timelineWindow.map((item) => {
                if (item.kind === "day") {
                  return (
                    <div key={item.id} className="conv-hub__day">
                      <span className="conv-hub__day-label">{item.label}</span>
                    </div>
                  );
                }
                if (item.kind === "system") {
                  const title = item.title.replace(/\.$/, "");
                  const isLabel =
                    item.event === "shipping_label_generated" || item.event === "label_created";
                  const isOfferAccepted = item.event === "offer_accepted";
                  const icon = systemEventIcon(item.event);
                  /* DEFECT #3: Transaction Status Card owns Offer Accepted — never duplicate in chat. */
                  if (isOfferAccepted) {
                    return null;
                  }
                  /* Messages Master Rewrite: Dynamic Card owns lifecycle — suppress financial/status duplicates. */
                  if (
                    item.event === "funds_released" ||
                    item.event === "completed" ||
                    item.event === "delivered" ||
                    item.event === "parcel_delivered" ||
                    item.event === "tracking_added" ||
                    item.event === "tracking_updated" ||
                    item.event === "shipping_label_generated" ||
                    item.event === "label_created" ||
                    item.event === "parcel_collected" ||
                    item.event === "payment_received" ||
                    item.event === "payment_confirmed"
                  ) {
                    return null;
                  }
                  return (
                    <div
                      key={item.id}
                      className="conv-hub__system conv-hub__system--compact"
                      data-event={item.event}
                    >
                      <div
                        className={cn(
                          "conv-hub__system-row",
                          isLabel && "conv-hub__system-row--label",
                        )}
                      >
                        <div className="conv-hub__system-copy">
                          <p className="conv-hub__system-title">
                            <span
                              className="conv-hub__system-glyph"
                              style={{ color: icon.color }}
                              aria-hidden
                            >
                              <AccountIcon name={icon.name} className="conv-hub__system-glyph-icon" />
                            </span>
                            {title}
                          </p>
                          {item.subtitle ? (
                            <p className="conv-hub__system-sub">{item.subtitle}</p>
                          ) : null}
                          <p className="conv-hub__system-time">
                            <time dateTime={item.at}>{formatCompactSystemWhen(item.at)}</time>
                          </p>
                        </div>
                        {isLabel && view.viewerRole === "seller" ? (
                          <button
                            type="button"
                            className="conv-hub__system-view"
                            disabled={actionBusy === "view_label"}
                            onClick={() => void runOrderAction("view_label")}
                          >
                            View
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                }
                if (item.kind === "offer") {
                  const offer = item.offer;
                  const listingPrice = view.product.price;
                  const fromBuyer = offer.fromRole === "buyer";
                  /** Mockup: Counter offer = seller side only (right · light purple). */
                  const isCounterCard =
                    !fromBuyer &&
                    (offer.state === "open" ||
                      offer.state === "countered" ||
                      Boolean(offer.parentOfferId));
                  const stateLabel =
                    offer.state === "accepted"
                      ? "Offer accepted"
                      : offer.state === "declined"
                        ? "Offer declined"
                        : offer.state === "expired"
                          ? "Offer expired"
                          : isCounterCard
                            ? "Counter offer"
                            : "Offer made";
                  const visualState =
                    offer.state === "accepted"
                      ? "accepted"
                      : offer.state === "declined"
                        ? "declined"
                        : offer.state === "expired"
                          ? "expired"
                          : isCounterCard
                            ? "countered"
                            : "pending";
                  const offerAvatar = fromBuyer ? buyerAvatar : sellerAvatar;
                  const offerProductThumbs = resolveOfferCardProductThumbs({
                      bundle: offer.bundle,
                      productImageUrl: view.product.imageUrl,
                    });
                  const offerThumbUrls =
                    offerProductThumbs.urls.length > 0
                      ? offerProductThumbs.urls
                      : ["/placeholder-product.svg"];
                  const offerThumbMore = offerProductThumbs.moreCount;
                  const hasBundleDetails = Boolean(offer.bundle);
                  const OfferCardTag = hasBundleDetails ? "button" : "div";
                  return (
                    <div
                      key={item.id}
                      id={`offer-${offer.id}`}
                      className={cn(
                        "conv-hub__offer-row",
                        fromBuyer ? "conv-hub__offer-row--buyer" : "conv-hub__offer-row--seller",
                      )}
                      data-offer-side={fromBuyer ? "buyer" : "seller"}
                    >
                      {fromBuyer ? (
                        <Avatar
                          src={offerAvatar.src}
                          alt={offerAvatar.name}
                          name={offerAvatar.name}
                          size="sm"
                          className="conv-hub__offer-avatar"
                        />
                      ) : null}
                      <OfferCardTag
                        {...(hasBundleDetails
                          ? {
                              type: "button" as const,
                              "aria-label": "View bundle details",
                              onClick: () =>
                                setBundleDetailsOffer({
                                  offer,
                                  isCounter: isCounterCard,
                                }),
                            }
                          : {})}
                        className={cn(
                          "conv-hub__offer",
                          "conv-hub__offer--timeline",
                          fromBuyer ? "conv-hub__offer--buyer" : "conv-hub__offer--seller",
                          `conv-hub__offer--${visualState}`,
                          highlightOfferId === offer.id && "conv-hub__offer--highlight",
                          hasBundleDetails && "conv-hub__offer--interactive",
                        )}
                        data-offer-state={offer.state}
                        data-offer-visual={visualState}
                        data-offer-from={offer.fromRole}
                        data-offer-actions="footer"
                        data-blood-law="XLIII"
                        data-offer-pending={offer.state === "open" ? "true" : "false"}
                        data-offer-bundle-open={hasBundleDetails ? "true" : undefined}
                      >
                        <div className="conv-hub__offer-main">
                          <span
                            className={cn(
                              "conv-hub__offer-thumbs",
                              (offerThumbUrls.length > 1 || offerThumbMore > 0) &&
                                "conv-hub__offer-thumbs--multi",
                            )}
                            data-offer-product-thumb="true"
                            data-offer-thumb-count={
                              offerThumbUrls.length + (offerThumbMore > 0 ? 1 : 0)
                            }
                            data-offer-thumb-more={
                              offerThumbMore > 0 ? String(offerThumbMore) : undefined
                            }
                            aria-hidden
                          >
                            {offerThumbUrls.map((src, thumbIndex) => (
                              <span
                                key={`${offer.id}-thumb-${thumbIndex}`}
                                className="conv-hub__offer-thumb"
                              >
                                <SafeImage
                                  src={src}
                                  alt=""
                                  width={36}
                                  height={36}
                                  className="conv-hub__offer-thumb-img"
                                />
                              </span>
                            ))}
                            {offerThumbMore > 0 ? (
                              <span
                                className="conv-hub__offer-thumb conv-hub__offer-thumb--more"
                                data-offer-thumb-overflow="true"
                              >
                                +{offerThumbMore}
                              </span>
                            ) : null}
                          </span>
                          <div className="conv-hub__offer-copy">
                            <p className="conv-hub__offer-label">{stateLabel}</p>
                            <div className="conv-hub__offer-head">
                              <p className="conv-hub__offer-amount">
                                {formatCurrency(offer.amount)}
                              </p>
                              {!offer.bundle &&
                              listingPrice > 0 &&
                              listingPrice !== offer.amount ? (
                                <p className="conv-hub__offer-list conv-hub__offer-list--struck">
                                  {formatCurrency(listingPrice)}
                                </p>
                              ) : null}
                            </div>
                            {offer.bundle ? (
                              <p className="conv-hub__offer-meta">
                                Bundle · {offer.bundle.itemCount} items · list{" "}
                                {formatCurrency(offer.bundle.listSubtotal)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </OfferCardTag>
                      {!fromBuyer ? (
                        <Avatar
                          src={offerAvatar.src}
                          alt={offerAvatar.name}
                          name={offerAvatar.name}
                          size="sm"
                          className="conv-hub__offer-avatar"
                        />
                      ) : null}
                    </div>
                  );
                }
                const msgAvatar =
                  item.message.senderRole === "buyer" ? buyerAvatar : sellerAvatar;
                return (
                  <MessageBubble
                    key={item.id}
                    message={item.message}
                    avatarSrc={msgAvatar.src}
                    avatarName={msgAvatar.name}
                    onOpenPhoto={(originalUrl) => {
                      setImageViewer({
                        open: true,
                        images: [originalUrl],
                        initialIndex: 0,
                        title: "Photo",
                      });
                    }}
                  />
                );
              })
            )}

            <div ref={threadEndRef} />
          </div>
          </div>
        </div>

        <div className="conv-hub__footer" data-master-stack-layer="STICKY_BUY_NOW_BUTTON">
          {warning ? <div className="conv-hub__warning">{warning}</div> : null}

          {reviewOpen || hideStickyActions ? null : (
            <div
              className="conv-hub__sticky-actions"
              data-sticky-cta="total-buyer-pays"
              aria-label="Conversation actions"
            >
              <TransactionActionBar
                conversationId={conversation.id}
                viewerRole={view.viewerRole}
                product={view.product}
                hasOrder={view.hasOrder}
                acceptedOffer={
                  acceptedOffer
                    ? { id: acceptedOffer.id, amount: acceptedOffer.amount }
                    : null
                }
                pendingOffer={
                  pendingOffer
                    ? {
                        id: pendingOffer.id,
                        amount: pendingOffer.amount,
                        fromRole: pendingOffer.fromRole,
                        parentOfferId: pendingOffer.parentOfferId ?? null,
                      }
                    : null
                }
                terminalOffer={terminalOffer}
                onCancelOffer={(offerId) => void patchOffer(offerId, "decline")}
                onAcceptOffer={(offerId) => void patchOffer(offerId, "accept")}
                onDeclineOffer={(offerId) => void patchOffer(offerId, "decline")}
                onCounterOffer={(offerId, amount) => void patchOffer(offerId, "counter", amount)}
                onOfferSent={() => {
                  void reloadRelated();
                  void refreshBadges();
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(
                      new CustomEvent("rovexo:inbox-sync", {
                        detail: {
                          conversationId: conversation.id,
                          bloodLaw: "XLIII",
                          source: "offer_created",
                        },
                      }),
                    );
                  }
                }}
                dynamicActions={view.dynamicActions}
                actionBarPanel={view.actionBarPanel}
                actionBusy={actionBusy}
                onAction={(id) => void runOrderAction(id)}
                hidden={resumeCheckoutOpen}
                demoMode={demoMode}
                relatedReady={relatedReady}
              />
            </div>
          )}

          {nonDeliveryInformationHint ? (
            <p
              className="conv-hub__composer-hint"
              data-add-information-hint="true"
            >
              {NON_DELIVERY_RESOLUTION_CASE_V1.addInformationHint}
            </p>
          ) : null}
          <form
            className="conv-hub__composer"
            data-composer-layout="single-row"
            data-master-stack-layer="MESSAGE_INPUT"
            data-add-information-active={nonDeliveryInformationHint ? "true" : undefined}
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              handleSend();
            }}
          >
            {pendingPhoto ? (
              <div className="conv-hub__composer-pending" data-photo-attachment="pending">
                <div className="conv-hub__composer-pending-thumb">
                  {/* Local object URL — plain img bypasses next/image remote restrictions. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pendingPhoto.previewUrl}
                    alt=""
                    className="conv-hub__composer-pending-img"
                  />
                </div>
                <button
                  type="button"
                  className="conv-hub__composer-pending-remove"
                  aria-label="Remove photo"
                  disabled={sending}
                  onClick={clearPendingPhoto}
                >
                  Remove
                </button>
              </div>
            ) : null}
            <div className="conv-hub__composer-row">
              <button
                type="button"
                className="conv-hub__composer-cam"
                aria-label="Add photo"
                disabled={conversation.blocked || sending}
                onClick={() => {
                  if (conversation.blocked || sending) return;
                  const input = document.getElementById(cameraPickerId);
                  if (input instanceof HTMLInputElement) input.click();
                }}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden fill="currentColor">
                  <path d="M9.4 5.5 8.2 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.2l-1.2-1.5a1.5 1.5 0 0 0-1.2-.5H10.6a1.5 1.5 0 0 0-1.2.5ZM12 17.2A3.7 3.7 0 1 1 12 9.8a3.7 3.7 0 0 1 0 7.4Zm0-1.8a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z" />
                </svg>
              </button>
              <NativeImageFileInput
                id={cameraPickerId}
                intent="gallery"
                placement="associated"
                disabled={conversation.blocked || sending}
                onFilesSelected={handlePhotoSelected}
              />
              <label className="sr-only" htmlFor="conv-hub-composer">
                Message about this order
              </label>
              <textarea
                id="conv-hub-composer"
                ref={textareaRef}
                className="conv-hub__composer-field"
                rows={1}
                placeholder={
                  nonDeliveryInformationHint
                    ? NON_DELIVERY_RESOLUTION_CASE_V1.addInformationHint
                    : "Write a message..."
                }
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
                disabled={conversation.blocked || sending || (!draft.trim() && !pendingPhoto)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                  <path d="M3.4 20.6 21 12 3.4 3.4l.1 6.6L15 12 3.5 14z" />
                </svg>
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
          sessionUnavailable={demoMode}
        />
        <ProductFullscreenImageViewer
          open={imageViewer.open}
          onClose={() => setImageViewer((current) => ({ ...current, open: false, images: [] }))}
          images={imageViewer.images}
          title={imageViewer.title}
          initialIndex={imageViewer.initialIndex}
        />
        <PlatformFeeSheet
          open={feeSheetOpen}
          itemPrice={acceptedOffer?.amount ?? view.product.price}
          onClose={() => setFeeSheetOpen(false)}
        />
        <OfferBundleDetailsSheet
          open={Boolean(bundleDetailsOffer)}
          offer={bundleDetailsOffer?.offer ?? null}
          isCounter={bundleDetailsOffer?.isCounter ?? false}
          onClose={() => setBundleDetailsOffer(null)}
        />
        <ShippingLabelViewer
          open={Boolean(labelViewer)}
          onClose={() => setLabelViewer(null)}
          pdfUrl={labelViewer?.pdfUrl ?? null}
          orderId={labelViewer?.orderId ?? null}
          carrierName={labelViewer?.carrierName ?? null}
        />
        <ModalContainer
          open={resolutionDetailsOpen && Boolean(resolutionDetails)}
          onClose={() => setResolutionDetailsOpen(false)}
          variant="sheet"
          zIndex={130}
          ariaLabel="Resolution Details"
          panelClassName="conv-hub__order-details-panel"
        >
          <div className="conv-hub__order-details-sheet" data-resolution-details-sheet="v1.0">
            <header className="conv-hub__order-details-header">
              <h2 className="conv-hub__order-details-title">Resolution Details</h2>
              <button
                type="button"
                className="conv-hub__order-details-close"
                aria-label="Close resolution details"
                onClick={() => setResolutionDetailsOpen(false)}
              >
                ✕
              </button>
            </header>
            <div className="conv-hub__order-details-body">
              {resolutionDetails ? (
                <ResolutionDetailsView
                  model={resolutionDetails}
                  onAction={(actionId, amount) => {
                    void runResolutionAction(actionId, amount);
                  }}
                />
              ) : null}
            </div>
          </div>
        </ModalContainer>
        <ModalContainer
          open={orderDetailsOpen && Boolean(order) && Boolean(profile?.id)}
          onClose={() => {
            setOrderDetailsOpen(false);
            void reloadRelated();
          }}
          variant="sheet"
          zIndex={130}
          ariaLabel="Order Details"
          panelClassName="conv-hub__order-details-panel"
        >
          <div className="conv-hub__order-details-sheet" data-order-details-sheet="v1.0">
            <header className="conv-hub__order-details-header">
              <h2 className="conv-hub__order-details-title">Order Details</h2>
              <button
                type="button"
                className="conv-hub__order-details-close"
                aria-label="Close order details"
                onClick={() => {
                  setOrderDetailsOpen(false);
                  void reloadRelated();
                }}
              >
                ✕
              </button>
            </header>
            {order && profile?.id ? (
              <div className="conv-hub__order-details-body">
                <OrderDetailView
                  key={order.id}
                  initialOrder={order}
                  userId={profile.id}
                  activeLabelCarrier={activeShippingLabel?.carrier ?? null}
                  buyerCanCancel={
                    view.viewerRole === "buyer" &&
                    isBuyerCancellableOrderStatus(order.status) &&
                    !hasShippingLabel
                  }
                  buyerCancelReason={
                    view.viewerRole === "buyer" &&
                    isBuyerCancellableOrderStatus(order.status) &&
                    hasShippingLabel
                      ? "A shipping label has already been generated for this order."
                      : undefined
                  }
                  onOpenMessages={() => {
                    setOrderDetailsOpen(false);
                    void reloadRelated();
                  }}
                  onOrderUpdated={(next) => {
                    void reloadRelated();
                    if (next.status === "cancelled") {
                      pushToast({ title: "Order cancelled.", variant: "success" });
                    }
                  }}
                />
              </div>
            ) : null}
          </div>
        </ModalContainer>
      </div>
    </AccountCanonicalShell>
  );
}
