export type MessageFilter = "all" | "unread" | "buyers" | "sellers";

export type MessageStatus = "sent" | "delivered" | "read";

export type MessageKind = "text" | "photo" | "emoji";

export type SenderRole = "buyer" | "seller";

export type ChatMessage = {
  id: string;
  senderRole: SenderRole;
  kind: MessageKind;
  content: string;
  sentAt: string;
  status: MessageStatus;
};

export type ConversationProduct = {
  slug: string;
  title: string;
  price: number;
  condition: string;
  imageUrl: string;
};

export type ConversationParticipant = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: SenderRole;
  online: boolean;
  lastSeen?: string;
};

export type Conversation = {
  id: string;
  participant: ConversationParticipant;
  product: ConversationProduct;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: ChatMessage[];
};

export function getViewerRole(participant: ConversationParticipant): SenderRole {
  return participant.role === "buyer" ? "seller" : "buyer";
}
