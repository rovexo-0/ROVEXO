"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import { Avatar } from "@/components/ui/Avatar";
import {
  ChevronRightLineIcon,
  DoubleCheckLineIcon,
  GalleryLineIcon,
  MoreLineIcon,
  SendLineIcon,
} from "@/components/icons/RvxLineIcons";
import { useChatRealtime } from "@/features/messages/hooks/use-chat-realtime";
import { TransactionHubBottomActions } from "@/features/transaction-hub/TransactionHubBottomActions";
import { TransactionHubPaymentSuccess } from "@/features/transaction-hub/TransactionHubPaymentSuccess";
import { CheckoutHubSheet } from "@/features/transaction-hub/CheckoutHubSheet";
import { getViewerRole } from "@/lib/messages/types";
import type { ChatMessage, Conversation, SenderRole } from "@/lib/messages/types";
import { formatMessageTime } from "@/lib/messages/utils";
import { trackGaEvent } from "@/lib/analytics/ga4-events";

type ChatPageProps = {
  initialConversation: Conversation;
};

const priceFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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

function ChatBubbleRow({
  message,
  viewerRole,
  avatarUrl,
  avatarName,
}: {
  message: ChatMessage;
  viewerRole: SenderRole;
  avatarUrl?: string | null;
  avatarName: string;
}) {
  const outgoing = message.senderRole === viewerRole;
  const isRead = message.status === "read";

  return (
    <div className={outgoing ? "chat-msg chat-msg--out" : "chat-msg chat-msg--in"}>
      {!outgoing ? (
        <Avatar src={avatarUrl} alt={avatarName} name={avatarName} size="sm" className="chat-msg__avatar" />
      ) : null}

      <div className="chat-msg__col">
        <div className={outgoing ? "chat-bubble chat-bubble--out" : "chat-bubble chat-bubble--in"}>
          {message.kind === "photo" ? (
            <span className="chat-bubble__photo">
              <SafeImage src={message.content} alt="Shared photo" fill className="object-cover" sizes="220px" />
            </span>
          ) : (
            message.content
          )}
        </div>
        <span className={outgoing && isRead ? "chat-msg__meta chat-msg__meta--read" : "chat-msg__meta"}>
          <time dateTime={message.sentAt}>{formatMessageTime(message.sentAt)}</time>
          {outgoing ? <DoubleCheckLineIcon /> : null}
        </span>
      </div>
    </div>
  );
}

export function ChatPage({ initialConversation }: ChatPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversation, setConversation] = useState(initialConversation);
  const [warning, setWarning] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    orderId: string;
    orderNumber?: string | null;
  } | null>(null);
  const [resumeCheckoutOpen, setResumeCheckoutOpen] = useState(false);
  const paymentHandledRef = useRef(false);
  const viewerRole = getViewerRole(conversation.participant);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useChatRealtime(conversation.id, conversation.participant.id, setConversation);

  useEffect(() => {
    void fetch(`/api/messages/${conversation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read" }),
    });
  }, [conversation.id]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages.length]);

  useEffect(() => {
    if (paymentHandledRef.current) return;

    const paymentStatus = searchParams.get("payment");
    const orderId = searchParams.get("order_id");
    const sessionId = searchParams.get("session_id");
    const cancelledSlug = searchParams.get("slug");

    if (!paymentStatus || !orderId) return;

    paymentHandledRef.current = true;

    if (paymentStatus === "cancelled") {
      router.replace(`/messages/${conversation.id}`);
      if (cancelledSlug) {
        setResumeCheckoutOpen(true);
      }
      return;
    }

    if (paymentStatus === "success") {
      const confirm = async () => {
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
        router.replace(`/messages/${conversation.id}`);
      };

      void confirm();
    }
  }, [conversation.id, router, searchParams]);

  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || sending || conversation.blocked) return;

    setSending(true);
    const isFirstMessage = conversation.messages.length === 0;

    try {
      const response = await fetch(`/api/messages/${conversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, senderRole: viewerRole }),
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
    viewerRole,
  ]);

  const { participant, product } = conversation;

  const dayGroups = useMemo(() => {
    const groups: Array<{ key: string; label: string; messages: ChatMessage[] }> = [];
    for (const message of conversation.messages) {
      const key = dayKey(message.sentAt);
      const last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.messages.push(message);
      } else {
        groups.push({ key, label: formatDayLabel(message.sentAt), messages: [message] });
      }
    }
    return groups;
  }, [conversation.messages]);

  return (
    <div className="chat-v1" data-messages-version="v1.0">
      <CanonicalPageHeader
        title={participant.name}
        backHref="/messages"
        backLabel="Back to messages"
        rightAction={
          <button type="button" className="chat-v1__icon" aria-label="Conversation options">
            <MoreLineIcon />
          </button>
        }
      />

      <div className="chat-v1__product-wrap">
        <Link href={`/listing/${product.slug}`} className="chat-v1__product">
          <span className="chat-v1__product-image">
            <SafeImage src={product.imageUrl} alt={product.title} fill className="object-cover" sizes="56px" />
          </span>
          <span className="chat-v1__product-body">
            <span className="chat-v1__product-title">{product.title}</span>
            <span className="chat-v1__product-subtitle">{product.condition}</span>
            <span className="chat-v1__product-price">{priceFormatter.format(product.price)}</span>
          </span>
          <span className="chat-v1__product-arrow">
            <ChevronRightLineIcon />
          </span>
        </Link>
      </div>

      {warning ? <div className="chat-v1__warning">{warning}</div> : null}

      <TransactionHubBottomActions
        conversationId={conversation.id}
        viewerRole={viewerRole}
        product={product}
      />

      <div className="chat-v1__thread">
        {dayGroups.map((group) => (
          <div key={group.key}>
            <div className="chat-v1__day">
              <span>{group.label}</span>
            </div>
            {group.messages.map((message) => (
              <ChatBubbleRow
                key={message.id}
                message={message}
                viewerRole={viewerRole}
                avatarUrl={participant.avatarUrl}
                avatarName={participant.name}
              />
            ))}
          </div>
        ))}
        <div ref={threadEndRef} />
      </div>

      <div className="chat-v1__composer">
        <div className="chat-v1__composer-inner">
          <button type="button" className="chat-v1__gallery" aria-label="Add photo" disabled={conversation.blocked}>
            <GalleryLineIcon />
          </button>
          <label className="sr-only" htmlFor="chat-composer-input">
            Type a message
          </label>
          <input
            id="chat-composer-input"
            type="text"
            className="chat-v1__field"
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
            type="button"
            className="chat-v1__send"
            aria-label="Send message"
            disabled={conversation.blocked || sending || !draft.trim()}
            onClick={() => void handleSend()}
          >
            <SendLineIcon />
          </button>
        </div>
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
        productSlug={product.slug}
        conversationId={conversation.id}
      />
    </div>
  );
}
