import type { Conversation, MessageFilter } from "@/lib/messages/types";
import { parseBundleMessageMeta } from "@/lib/bundle/bundle-payload-v1";

export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return new Intl.DateTimeFormat("en-IE", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
  }).format(date);
}

/** Inbox list relative time (Vinted-style) — Messages module only. */
export function formatInboxRelativeTime(iso: string, nowMs = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diffMs = Math.max(0, nowMs - then);
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

/**
 * Humanize Inbox conversation preview from existing last_message only.
 * Strips encoded offer/bundle meta — no new fetch.
 */
export function formatInboxLastMessagePreview(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";

  const { bundle, userMessage } = parseBundleMessageMeta(trimmed);
  if (bundle) {
    const body = userMessage?.trim();
    if (body) return body;
    const amount = Number(bundle.listSubtotal);
    const list =
      Number.isFinite(amount) && amount > 0
        ? ` · list £${amount.toFixed(2)}`
        : "";
    return `Bundle offer · ${bundle.itemCount} items${list}`;
  }

  const counter = trimmed.match(
    /^__RVX_COUNTER__:(?:buyer|seller):[0-9a-f-]{36}__(.*)$/i,
  );
  if (counter) {
    const rest = (counter[1] ?? "").trim();
    if (rest) return formatInboxLastMessagePreview(rest);
    return "Counter offer";
  }

  if (trimmed.startsWith("__RVX_")) return "New update";
  return trimmed;
}

export function formatLastSeen(iso: string): string {
  return `Last seen ${formatMessageTime(iso)}`;
}

export function filterConversations(
  conversations: Conversation[],
  filter: MessageFilter,
  query: string,
): Conversation[] {
  const normalizedQuery = query.trim().toLowerCase();

  return conversations.filter((conversation) => {
    if (filter === "unread" && conversation.unreadCount === 0) return false;
    if (filter === "buyers" && conversation.participant.role !== "buyer") return false;
    if (filter === "sellers" && conversation.participant.role !== "seller") return false;

    if (!normalizedQuery) return true;

    return (
      conversation.participant.name.toLowerCase().includes(normalizedQuery) ||
      conversation.lastMessage.toLowerCase().includes(normalizedQuery) ||
      conversation.product.title.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function getPresenceLabel(conversation: Conversation): string {
  if (conversation.participant.online) return "Online";
  if (conversation.participant.lastSeen) {
    return formatLastSeen(conversation.participant.lastSeen);
  }
  return "Offline";
}
