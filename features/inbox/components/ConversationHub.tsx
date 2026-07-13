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
  GalleryLineIcon,
  MoreLineIcon,
  SendLineIcon,
} from "@/components/icons/RvxLineIcons";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { useChatRealtime } from "@/features/messages/hooks/use-chat-realtime";
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
  subscribeConversationRealtime,
  type ConversationOfferView,
  type ConversationOrderStatusStep,
} from "@/lib/inbox";
import type { ChatMessage, Conversation } from "@/lib/messages/types";
import { formatMessageTime } from "@/lib/messages/utils";
import { formatCurrency } from "@/lib/wallet/utils";
import "@/styles/rovexo/conversation-hub-v1.css";

type ConversationHubProps = {
  initialConversation: Conversation;
};

type IconProps = SVGProps<SVGSVGElement>;

function CameraLineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M4 8h3l2-2h6l2 2h3v11H4V8Z" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function MessageBubble({
  message,
  outgoing,
  avatarUrl,
  avatarName,
}: {
  message: ChatMessage;
  outgoing: boolean;
  avatarUrl?: string | null;
  avatarName: string;
}) {
  const isRead = message.status === "read";
  const isDelivered = message.status === "delivered" || isRead;

  return (
    <div className={cn("conv-hub__msg", outgoing ? "conv-hub__msg--out" : "conv-hub__msg--in")}>
      {!outgoing ? (
        <Avatar src={avatarUrl} alt={avatarName} name={avatarName} size="sm" />
      ) : null}
      <div>
        <div className={cn("conv-hub__bubble", outgoing ? "conv-hub__bubble--out" : "conv-hub__bubble--in")}>
          {message.kind === "photo" ? (
            <span className="conv-hub__bubble-photo">
              <SafeImage src={message.content} alt="Shared photo" fill sizes="180px" />
            </span>
          ) : (
            message.content
          )}
        </div>
        <span className={cn("conv-hub__msg-meta", outgoing && isRead && "conv-hub__msg-meta--read")}>
          <time dateTime={message.sentAt}>{formatMessageTime(message.sentAt)}</time>
          {outgoing && isDelivered ? <DoubleCheckLineIcon /> : null}
        </span>
      </div>
    </div>
  );
}

function OrderStatusRail({
  steps,
  onSelect,
}: {
  steps: ConversationOrderStatusStep[];
  onSelect: (step: ConversationOrderStatusStep) => void;
}) {
  return (
    <div className="conv-hub__rail" role="list" aria-label="Order status">
      {steps.map((step) => (
        <button
          key={step.id}
          type="button"
          role="listitem"
          className={cn(
            "conv-hub__rail-step",
            step.state === "complete" && "conv-hub__rail-step--complete",
            step.state === "current" && "conv-hub__rail-step--current",
          )}
          onClick={() => onSelect(step)}
        >
          <span className="conv-hub__rail-dot" aria-hidden />
          <span className="conv-hub__rail-label">{step.label}</span>
        </button>
      ))}
    </div>
  );
}

export function ConversationHub({ initialConversation }: ConversationHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const [conversation, setConversation] = useState(initialConversation);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    orderId: string;
    orderNumber?: string | null;
  } | null>(null);
  const [resumeCheckoutOpen, setResumeCheckoutOpen] = useState(false);
  const paymentHandledRef = useRef(false);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useChatRealtime(conversation.id, conversation.participant.id, setConversation);

  useEffect(() => {
    void fetch(`/api/messages/${conversation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read" }),
    });
  }, [conversation.id]);

  useEffect(() => {
    const sub = subscribeConversationRealtime(conversation.id, (event) => {
      if (event.type === "typing.started") {
        setTypingLabel(`${conversation.participant.name} is typing…`);
      }
      if (event.type === "typing.stopped") {
        setTypingLabel(null);
      }
    });
    return () => sub.unsubscribe();
  }, [conversation.id, conversation.participant.name]);

  const view = useMemo(
    () =>
      buildConversationHubView({
        conversation,
        typingLabel,
      }),
    [conversation, typingLabel],
  );

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [view.timeline.length, typingLabel]);

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
      if (cancelledSlug) {
        queueMicrotask(() => setResumeCheckoutOpen(true));
      }
      return;
    }

    if (paymentStatus === "success") {
      void (async () => {
        if (sessionId) {
          const response = await fetch(
            `/api/orders/confirm?session_id=${encodeURIComponent(sessionId)}`,
          );
          const payload = (await response.json()) as {
            success?: boolean;
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
      })();
    }
  }, [conversation.id, router, searchParams]);

  const resizeComposer = useCallback(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    const max = 1.4 * 16 * 6 + 20;
    node.style.height = `${Math.min(node.scrollHeight, max)}px`;
  }, []);

  useEffect(() => {
    resizeComposer();
  }, [draft, resizeComposer]);

  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || sending || conversation.blocked) return;

    setSending(true);
    const isFirstMessage = conversation.messages.length === 0;

    try {
      const response = await fetch(`/api/messages/${conversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, senderRole: view.viewerRole }),
      });

      const payload = (await response.json()) as {
        conversation?: Conversation;
        warning?: string | null;
        error?: string;
      };

      if (!response.ok) {
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
    } finally {
      setSending(false);
    }
  }, [
    draft,
    sending,
    conversation.blocked,
    conversation.id,
    conversation.messages.length,
    conversation.product.slug,
    conversation.product.title,
    view.viewerRole,
  ]);

  const handleComposerSubmit = (event: FormEvent) => {
    event.preventDefault();
    void handleSend();
  };

  const showComingSoon = (label: string) => {
    pushToast({
      title: `${label} opens in Sprint 3`,
      variant: "info",
    });
  };

  const renderOffer = (offer: ConversationOfferView) => (
    <div key={offer.id} className="conv-hub__offer" data-offer-state={offer.state}>
      <p className="conv-hub__offer-amount">{formatCurrency(offer.amount)}</p>
      <p className="conv-hub__offer-state">{offer.state.replace("_", " ")}</p>
      {offer.state === "open" ? (
        <div className="conv-hub__offer-actions">
          <button
            type="button"
            className="conv-hub__offer-btn conv-hub__offer-btn--primary"
            onClick={() => showComingSoon("Accept offer")}
          >
            Accept
          </button>
          <button type="button" className="conv-hub__offer-btn" onClick={() => showComingSoon("Decline offer")}>
            Decline
          </button>
          <button type="button" className="conv-hub__offer-btn" onClick={() => showComingSoon("Counter offer")}>
            Counter
          </button>
        </div>
      ) : null}
    </div>
  );

  const orderNumber =
    view.orderReference.orderNumber ?? `Order #${view.orderReference.orderId.slice(0, 8).toUpperCase()}`;

  return (
    <AccountCanonicalShell
      title="Conversation"
      hideBack
      bottomNavTab="saved"
      contentClassName="!p-0"
    >
      <div
        className="conv-hub"
        data-conversation-hub={CONVERSATION_HUB_VERSION}
        data-conversation-realtime="foundation"
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
              {orderNumber} · {view.orderStatusLabel}
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
                    showComingSoon("Mute");
                  }}
                >
                  Mute conversation
                </button>
                <button
                  type="button"
                  className="conv-hub__menu-item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    showComingSoon("Report");
                  }}
                >
                  Report issue
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <div className="conv-hub__body">
          <Link href={view.orderDetailsHref} className="conv-hub__product">
            <span className="conv-hub__product-thumb">
              <SafeImage
                src={view.product.imageUrl}
                alt={view.product.title}
                fill
                sizes="64px"
              />
            </span>
            <span className="conv-hub__product-body">
              <span className="conv-hub__product-title">{view.product.title}</span>
              <span className="conv-hub__product-price">{formatCurrency(view.product.price)}</span>
              <span className="conv-hub__product-meta">
                {orderNumber} · Buyer {view.buyerName} · Seller {view.sellerName}
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
                      ? "This is the current order stage."
                      : "This step is complete.",
                variant: "info",
              })
            }
          />

          {view.tracking ? (
            <section className="conv-hub__section" aria-label="Tracking">
              <h2 className="conv-hub__section-title">Tracking</h2>
              <div className="conv-hub__section-row">
                <span>Courier</span>
                <span className="conv-hub__section-value">{view.tracking.courierName}</span>
              </div>
              <div className="conv-hub__section-row">
                <span>Tracking number</span>
                <span className="conv-hub__section-value">{view.tracking.trackingNumber}</span>
              </div>
              <div className="conv-hub__section-row">
                <span>Status</span>
                <span className="conv-hub__section-value">{view.tracking.statusLabel}</span>
              </div>
              {view.tracking.latestScan ? (
                <div className="conv-hub__section-row">
                  <span>Latest scan</span>
                  <span className="conv-hub__section-value">{view.tracking.latestScan}</span>
                </div>
              ) : null}
              <button
                type="button"
                className="conv-hub__section-cta"
                onClick={() => showComingSoon("Carrier tracking")}
              >
                Open carrier tracking
              </button>
            </section>
          ) : (
            <section className="conv-hub__section" aria-label="Tracking">
              <h2 className="conv-hub__section-title">Tracking</h2>
              <p className="conv-hub__empty-note">Waiting for shipment</p>
            </section>
          )}

          <section className="conv-hub__section" aria-label="Dispute">
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
              </>
            ) : (
              <>
                <p className="conv-hub__empty-note">Transaction running normally</p>
                <button
                  type="button"
                  className="conv-hub__section-cta conv-hub__section-cta--ghost"
                  onClick={() => showComingSoon("Open dispute")}
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
                  <a
                    key={attachment.id}
                    className="conv-hub__attachment"
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {attachment.label}
                  </a>
                ))}
              </div>
            </section>
          ) : null}

          <div className="conv-hub__timeline" aria-live="polite">
            {view.timeline.length === 0 ? (
              <div className="conv-hub__timeline-empty">
                <p className="conv-hub__timeline-empty-title">Start conversation</p>
                <p className="conv-hub__timeline-empty-sub">
                  Send a message about this listing to begin.
                </p>
              </div>
            ) : (
              view.timeline.map((item) => {
                if (item.kind === "day") {
                  return (
                    <div key={item.id} className="conv-hub__day">
                      <span>{item.label}</span>
                    </div>
                  );
                }
                if (item.kind === "system") {
                  return (
                    <div key={item.id} className="conv-hub__system">
                      <p className="conv-hub__system-title">{item.title}</p>
                      {item.subtitle ? <p className="conv-hub__system-sub">{item.subtitle}</p> : null}
                      <p className="conv-hub__system-sub">
                        <time dateTime={item.at}>{formatMessageTime(item.at)}</time>
                      </p>
                    </div>
                  );
                }
                if (item.kind === "offer") {
                  return renderOffer(item.offer);
                }
                return (
                  <MessageBubble
                    key={item.id}
                    message={item.message}
                    outgoing={item.message.senderRole === view.viewerRole}
                    avatarUrl={view.participantAvatarUrl}
                    avatarName={view.participantName}
                  />
                );
              })
            )}

            {view.offers
              .filter((offer) => !view.timeline.some((item) => item.kind === "offer" && item.offer.id === offer.id))
              .map((offer) => renderOffer(offer))}

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
                  onClick={() => showComingSoon(action.label)}
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
              />
            </div>
          )}

          <form className="conv-hub__composer" onSubmit={handleComposerSubmit}>
            <button
              type="button"
              className="conv-hub__icon-btn"
              aria-label="Add photo"
              disabled={conversation.blocked}
              onClick={() => fileInputRef.current?.click()}
            >
              <GalleryLineIcon />
            </button>
            <button
              type="button"
              className="conv-hub__icon-btn"
              aria-label="Open camera"
              disabled={conversation.blocked}
              onClick={() => showComingSoon("Camera")}
            >
              <CameraLineIcon />
            </button>
            <label className="sr-only" htmlFor="conv-hub-composer">
              Type a message
            </label>
            <textarea
              id="conv-hub-composer"
              ref={textareaRef}
              className="conv-hub__composer-field"
              rows={1}
              placeholder="Type a message..."
              value={draft}
              disabled={conversation.blocked || sending}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
            />
            <button
              type="submit"
              className="conv-hub__send"
              aria-label="Send message"
              disabled={conversation.blocked || sending || !draft.trim()}
            >
              <SendLineIcon />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              onChange={() => showComingSoon("Photo attachment")}
            />
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
        />
      </div>
    </AccountCanonicalShell>
  );
}
