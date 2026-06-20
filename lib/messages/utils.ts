import type { Conversation, MessageFilter } from "@/lib/messages/types";

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
