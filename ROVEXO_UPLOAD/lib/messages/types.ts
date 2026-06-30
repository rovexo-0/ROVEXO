export type MessageFilter = "all" | "unread" | "buyers" | "sellers" | "archived" | "pinned";

export type MessageStatus = "sent" | "delivered" | "read";

export type MessageKind = "text" | "photo" | "emoji";

export type SenderRole = "buyer" | "seller";

export type ProductListingStatus = "published" | "paused" | "sold" | "draft";

export type ChatMessage = {
  id: string;
  senderRole: SenderRole;
  kind: MessageKind;
  content: string;
  sentAt: string;
  status: MessageStatus;
  replyToId?: string | null;
  editedAt?: string | null;
  deletedAt?: string | null;
  reactions: Record<string, string[]>;
  moderationWarning?: string | null;
};

export type ConversationProduct = {
  slug: string;
  title: string;
  price: number;
  condition: string;
  imageUrl: string;
  status: ProductListingStatus;
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
  pinned: boolean;
  archived: boolean;
  muted: boolean;
  blocked: boolean;
  messages: ChatMessage[];
};

export function getViewerRole(participant: ConversationParticipant): SenderRole {
  return participant.role === "buyer" ? "seller" : "buyer";
}
