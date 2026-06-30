import type { Conversation } from "@/lib/messages/types";
import type {
  MessagesEngineConversationStatusId,
  MessagesEngineConversationSummary,
  MessagesEngineConversationTypeId,
  MessagesEngineFilterId,
  MessagesEngineMessageStatusId,
} from "@/lib/messages-engine/types";
import type { MessageStatus } from "@/lib/messages/types";

export function mapConversationType(conversation: Conversation): MessagesEngineConversationTypeId {
  return conversation.participant.role === "buyer" ? "seller-buyer" : "buyer-seller";
}

export function mapConversationStatus(conversation: Conversation): MessagesEngineConversationStatusId {
  if (conversation.blocked) return "blocked";
  if (conversation.archived) return "archived";
  if (conversation.muted) return "muted";
  if (conversation.pinned) return "pinned";
  if (conversation.unreadCount > 0) return "active";
  if (!conversation.lastMessage) return "new";
  return "active";
}

export function mapMessageStatus(status: MessageStatus): MessagesEngineMessageStatusId {
  const map: Record<MessageStatus, MessagesEngineMessageStatusId> = {
    sent: "sent",
    delivered: "delivered",
    read: "read",
  };
  return map[status];
}

export function mapConversationToFilters(conversation: Conversation): MessagesEngineFilterId[] {
  const tags: MessagesEngineFilterId[] = ["all"];
  if (conversation.unreadCount > 0) tags.push("unread", "active");
  if (conversation.archived) tags.push("archived");
  if (conversation.pinned) tags.push("pinned");
  if (conversation.muted) tags.push("muted");
  if (conversation.blocked) tags.push("blocked");
  if (!conversation.archived && !conversation.blocked) tags.push("active");
  return tags;
}

export function mapConversationToSummary(conversation: Conversation): MessagesEngineConversationSummary {
  return {
    conversationId: conversation.id,
    conversationType: mapConversationType(conversation),
    enterpriseStatus: mapConversationStatus(conversation),
    participantName: conversation.participant.name,
    participantRole: conversation.participant.role,
    productTitle: conversation.product.title,
    lastMessage: conversation.lastMessage,
    lastMessageAt: conversation.lastMessageAt,
    unreadCount: conversation.unreadCount,
    pinned: conversation.pinned,
    archived: conversation.archived,
    muted: conversation.muted,
    blocked: conversation.blocked,
    online: conversation.participant.online,
    filterTags: mapConversationToFilters(conversation),
  };
}

export function matchesSummaryFilter(summary: MessagesEngineConversationSummary, filter: MessagesEngineFilterId): boolean {
  if (filter === "all") return true;
  return summary.filterTags.includes(filter);
}

export function matchesSearch(query: string, summary: MessagesEngineConversationSummary): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    summary.participantName.toLowerCase().includes(q) ||
    summary.lastMessage.toLowerCase().includes(q) ||
    summary.productTitle.toLowerCase().includes(q)
  );
}

export function computeAverageResponseHours(conversations: Conversation[]): number {
  let totalHours = 0;
  let pairs = 0;

  for (const conversation of conversations) {
    const messages = [...conversation.messages].sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
    );
    for (let i = 1; i < messages.length; i += 1) {
      const prev = messages[i - 1];
      const current = messages[i];
      if (prev.senderRole !== current.senderRole) {
        const hours =
          (new Date(current.sentAt).getTime() - new Date(prev.sentAt).getTime()) / (1000 * 60 * 60);
        if (hours >= 0 && hours <= 168) {
          totalHours += hours;
          pairs += 1;
        }
      }
    }
  }

  return pairs > 0 ? Math.round((totalHours / pairs) * 10) / 10 : 0;
}

export function computeResponseRate(conversations: Conversation[], role: "buyer" | "seller"): number {
  let opportunities = 0;
  let responses = 0;

  for (const conversation of conversations) {
    const messages = [...conversation.messages].sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
    );
    for (let i = 0; i < messages.length - 1; i += 1) {
      const current = messages[i];
      const next = messages[i + 1];
      if (current.senderRole !== role && next.senderRole === role) {
        opportunities += 1;
        const hours =
          (new Date(next.sentAt).getTime() - new Date(current.sentAt).getTime()) / (1000 * 60 * 60);
        if (hours <= 48) responses += 1;
      }
    }
  }

  return opportunities > 0 ? Math.round((responses / opportunities) * 100) / 100 : 1;
}
