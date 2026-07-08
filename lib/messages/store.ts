import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables, TablesUpdate } from "@/lib/supabase/types/database";
import { inspectMessageContent, buildAutoReplyWarning } from "@/lib/messages/security";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import type { ChatMessage, Conversation, ProductListingStatus } from "@/lib/messages/types";
import { normalizeAvatarUrl } from "@/lib/media/normalize-avatar-url";

type ConversationRow = Tables<"conversations"> & {
  products: Pick<Tables<"products">, "slug" | "title" | "price" | "condition" | "status"> & {
    product_images: Pick<Tables<"product_images">, "url" | "is_primary" | "sort_order">[];
  };
  buyer: Pick<Tables<"profiles">, "id" | "full_name" | "avatar_url">;
  seller: Pick<Tables<"profiles">, "id" | "full_name" | "avatar_url">;
  messages: Tables<"messages">[];
};

function productImage(images: ConversationRow["products"]["product_images"]): string {
  const sorted = [...(images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  return sorted[0]?.url ?? "";
}

function mapMessage(row: Tables<"messages">): ChatMessage {
  return {
    id: row.id,
    senderRole: row.sender_role,
    kind: row.kind,
    content: row.deleted_at ? "Message deleted" : row.content,
    sentAt: row.sent_at,
    status: row.status,
    replyToId: row.reply_to_id,
    editedAt: row.edited_at,
    deletedAt: row.deleted_at,
    reactions: (row.reactions as Record<string, string[]>) ?? {},
    moderationWarning: row.moderation_warning,
  };
}

async function getPresence(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("user_presence")
    .select("online, last_seen_at")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

function mapConversation(row: ConversationRow, viewerId: string): Conversation {
  const isBuyer = row.buyer_id === viewerId;
  const participant = isBuyer ? row.seller : row.buyer;

  return {
    id: row.id,
    participant: {
      id: participant.id,
      name: participant.full_name,
      avatarUrl: normalizeAvatarUrl(participant.avatar_url) ?? undefined,
      role: isBuyer ? "seller" : "buyer",
      online: false,
      lastSeen: undefined,
    },
    product: {
      slug: row.products.slug,
      title: row.products.title,
      price: Number(row.products.price),
      condition: row.products.condition,
      imageUrl: productImage(row.products.product_images),
      status: row.products.status as ProductListingStatus,
    },
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    unreadCount: isBuyer ? row.buyer_unread_count : row.seller_unread_count,
    pinned: isBuyer ? row.buyer_pinned : row.seller_pinned,
    archived: isBuyer ? row.buyer_archived : row.seller_archived,
    muted: isBuyer ? row.buyer_muted : row.seller_muted,
    blocked: isBuyer ? row.seller_blocked : row.buyer_blocked,
    messages: (row.messages ?? [])
      .filter((message) => !message.deleted_at || message.sender_id === viewerId)
      .map(mapMessage),
  };
}

const conversationSelect = `
  *,
  products ( slug, title, price, condition, status, product_images ( url, is_primary, sort_order ) ),
  buyer:profiles!conversations_buyer_id_fkey ( id, full_name, avatar_url ),
  seller:profiles!conversations_seller_id_fkey ( id, full_name, avatar_url ),
  messages ( * )
`;

export async function listConversations(viewerId: string): Promise<Conversation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select(conversationSelect)
    .or(`buyer_id.eq.${viewerId},seller_id.eq.${viewerId}`)
    .order("last_message_at", { ascending: false });

  const rows = (data as ConversationRow[] | null) ?? [];
  const enriched = await Promise.all(
    rows.map(async (row) => {
      const conversation = mapConversation(row, viewerId);
      const presence = await getPresence(conversation.participant.id);
      conversation.participant.online = presence?.online ?? false;
      conversation.participant.lastSeen = presence?.last_seen_at ?? undefined;
      return conversation;
    }),
  );

  return enriched.sort((a, b) => Number(b.pinned) - Number(a.pinned));
}

export async function getConversationById(id: string, viewerId: string): Promise<Conversation | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select(conversationSelect)
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  const conversation = mapConversation(data as ConversationRow, viewerId);
  const presence = await getPresence(conversation.participant.id);
  conversation.participant.online = presence?.online ?? false;
  conversation.participant.lastSeen = presence?.last_seen_at ?? undefined;
  return conversation;
}

export async function appendMessage(input: {
  conversationId: string;
  senderId: string;
  senderRole: "buyer" | "seller";
  content: string;
  kind?: "text" | "photo" | "emoji";
  replyToId?: string;
}): Promise<{ message: ChatMessage | null; error?: string; warning?: string | null }> {
  const security = inspectMessageContent(input.content);
  if (security.blocked) {
    return { message: null, error: security.warning ?? "Message blocked by safety filters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      sender_role: input.senderRole,
      content: input.content,
      kind: input.kind ?? "text",
      status: "sent",
      reply_to_id: input.replyToId ?? null,
      moderation_decision: security.result.decision,
      moderation_warning: security.warning,
      delivered_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error || !data) {
    return { message: null, error: "Unable to send message." };
  }

  const isBuyer = input.senderRole === "buyer";
  const { data: conversation } = await supabase
    .from("conversations")
    .select("buyer_id, seller_id, buyer_unread_count, seller_unread_count, buyer_blocked, seller_blocked")
    .eq("id", input.conversationId)
    .single();

  if (conversation) {
    const recipientBlocked = isBuyer ? conversation.seller_blocked : conversation.buyer_blocked;
    if (recipientBlocked) {
      return { message: null, error: "You cannot message this user." };
    }

    await supabase
      .from("conversations")
      .update({
        last_message: input.content,
        last_message_at: new Date().toISOString(),
        buyer_unread_count: isBuyer
          ? conversation.buyer_unread_count
          : conversation.buyer_unread_count + 1,
        seller_unread_count: isBuyer
          ? conversation.seller_unread_count + 1
          : conversation.seller_unread_count,
      })
      .eq("id", input.conversationId);

    const recipientId = isBuyer ? conversation.seller_id : conversation.buyer_id;
    const admin = createAdminClient();
    const { data: recipientProfile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", recipientId)
      .maybeSingle();

    await dispatchNotification({
      userId: recipientId,
      type: "message",
      title: "New message",
      subtitle: input.content.slice(0, 120),
      href: `/messages/${input.conversationId}`,
      detail: buildAutoReplyWarning(security.warning) ?? undefined,
      email: recipientProfile?.email
        ? {
            to: recipientProfile.email,
            subject: "New ROVEXO message",
            body: `${input.content.slice(0, 500)}\n\nOpen: /messages/${input.conversationId}`,
          }
        : undefined,
    });
  }

  await supabase.from("messages").update({ status: "delivered" }).eq("id", data.id);

  return {
    message: mapMessage({ ...data, status: "delivered" }),
    warning: buildAutoReplyWarning(security.warning),
  };
}

export async function editMessage(input: {
  conversationId: string;
  messageId: string;
  senderId: string;
  content: string;
}): Promise<ChatMessage | null> {
  const security = inspectMessageContent(input.content);
  if (security.blocked) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .update({
      content: input.content,
      edited_at: new Date().toISOString(),
      moderation_decision: security.result.decision,
      moderation_warning: security.warning,
    })
    .eq("id", input.messageId)
    .eq("conversation_id", input.conversationId)
    .eq("sender_id", input.senderId)
    .select("*")
    .maybeSingle();

  return data ? mapMessage(data) : null;
}

export async function deleteMessage(input: {
  conversationId: string;
  messageId: string;
  senderId: string;
}): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("messages")
    .update({ deleted_at: new Date().toISOString(), content: "Message deleted" })
    .eq("id", input.messageId)
    .eq("conversation_id", input.conversationId)
    .eq("sender_id", input.senderId);

  return !error;
}

export async function reactToMessage(input: {
  conversationId: string;
  messageId: string;
  userId: string;
  emoji: string;
}): Promise<ChatMessage | null> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("messages")
    .select("reactions")
    .eq("id", input.messageId)
    .eq("conversation_id", input.conversationId)
    .maybeSingle();

  if (!existing) return null;

  const reactions = { ...((existing.reactions as Record<string, string[]>) ?? {}) };
  const current = new Set(reactions[input.emoji] ?? []);
  if (current.has(input.userId)) {
    current.delete(input.userId);
  } else {
    current.add(input.userId);
  }
  reactions[input.emoji] = [...current];

  const { data } = await supabase
    .from("messages")
    .update({ reactions })
    .eq("id", input.messageId)
    .select("*")
    .maybeSingle();

  return data ? mapMessage(data) : null;
}

export async function updateConversationPreferences(input: {
  conversationId: string;
  viewerId: string;
  patch: Partial<{
    archived: boolean;
    muted: boolean;
    pinned: boolean;
    blocked: boolean;
  }>;
}): Promise<boolean> {
  const supabase = await createClient();
  const { data: conversation } = await supabase
    .from("conversations")
    .select("buyer_id, seller_id")
    .eq("id", input.conversationId)
    .maybeSingle();

  if (!conversation) return false;
  const isBuyer = conversation.buyer_id === input.viewerId;
  const update: TablesUpdate<"conversations"> = {};

  if (input.patch.archived !== undefined) {
    update[isBuyer ? "buyer_archived" : "seller_archived"] = input.patch.archived;
  }
  if (input.patch.muted !== undefined) {
    update[isBuyer ? "buyer_muted" : "seller_muted"] = input.patch.muted;
  }
  if (input.patch.pinned !== undefined) {
    update[isBuyer ? "buyer_pinned" : "seller_pinned"] = input.patch.pinned;
  }
  if (input.patch.blocked !== undefined) {
    update[isBuyer ? "buyer_blocked" : "seller_blocked"] = input.patch.blocked;
  }

  const { error } = await supabase.from("conversations").update(update).eq("id", input.conversationId);
  return !error;
}

export async function markConversationRead(conversationId: string, viewerId: string): Promise<void> {
  const supabase = await createClient();
  const { data: conversation } = await supabase
    .from("conversations")
    .select("buyer_id, seller_id")
    .eq("id", conversationId)
    .single();

  if (!conversation) return;

  const patch =
    conversation.buyer_id === viewerId
      ? { buyer_unread_count: 0 }
      : { seller_unread_count: 0 };

  await supabase.from("conversations").update(patch).eq("id", conversationId);
  await supabase
    .from("messages")
    .update({ status: "read" })
    .eq("conversation_id", conversationId)
    .neq("sender_id", viewerId);
}

export async function upsertPresence(input: {
  userId: string;
  online?: boolean;
  typingConversationId?: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from("user_presence").upsert({
    user_id: input.userId,
    online: input.online ?? true,
    typing_conversation_id: input.typingConversationId ?? null,
    last_seen_at: new Date().toISOString(),
  });
}

export async function searchConversationMessages(
  viewerId: string,
  query: string,
): Promise<Array<{ conversationId: string; messageId: string; excerpt: string }>> {
  const supabase = await createClient();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .or(`buyer_id.eq.${viewerId},seller_id.eq.${viewerId}`);

  const ids = (conversations ?? []).map((row) => row.id);
  if (!ids.length) return [];

  const { data } = await supabase
    .from("messages")
    .select("id, conversation_id, content")
    .in("conversation_id", ids)
    .ilike("content", `%${query.trim()}%`)
    .limit(20);

  return (data ?? []).map((row) => ({
    conversationId: row.conversation_id,
    messageId: row.id,
    excerpt: row.content.slice(0, 120),
  }));
}
