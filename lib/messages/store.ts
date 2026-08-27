import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables, TablesUpdate } from "@/lib/supabase/types/database";
import { inspectMessageContent, buildAutoReplyWarning } from "@/lib/messages/security";
import { emitSmartNotification } from "@/lib/notifications/events";
import { onSellerMessageReply } from "@/lib/seller-performance/events";
import type { ChatMessage, Conversation, ProductListingStatus } from "@/lib/messages/types";
import { normalizeAvatarUrl } from "@/lib/media/normalize-avatar-url";
import {
  isMessagePhotoStoragePath,
  isRenderableMessagePhotoSrc,
  MESSAGE_PHOTO_PREVIEW_LABEL,
  MESSAGE_PHOTO_SIGN_TTL_SECONDS,
} from "@/lib/messages/message-photo-url-v1";
import { coerceUnreadCount } from "@/lib/inbox/types";

type ConversationRow = Tables<"conversations"> & {
  products: Pick<
    Tables<"products">,
    | "id"
    | "slug"
    | "title"
    | "price"
    | "condition"
    | "status"
    | "listing_type"
    | "accept_offers"
    | "location_city"
  > & {
    product_images: Pick<Tables<"product_images">, "url" | "is_primary" | "sort_order">[];
  } | null;
  buyer: Pick<Tables<"profiles">, "id" | "full_name" | "avatar_url" | "username">;
  seller: Pick<Tables<"profiles">, "id" | "full_name" | "avatar_url" | "username"> & {
    seller_profiles: Pick<Tables<"seller_profiles">, "rating" | "review_count"> | null;
  };
  messages: Tables<"messages">[];
};

const PRODUCT_EMBED_SELECT =
  "id, slug, title, price, condition, status, listing_type, accept_offers, location_city, product_images ( url, is_primary, sort_order )";

/**
 * Sold listings are hidden from marketplace RLS. Conversation parties still need
 * the product card — hydrate via service role when the embed is null.
 */
async function hydrateConversationProduct(row: ConversationRow): Promise<ConversationRow> {
  if (row.products) return row;
  const { tryCreateAdminClient } = await import("@/lib/supabase/admin");
  const admin = tryCreateAdminClient();
  if (!admin || !row.product_id) return row;
  const { data: product } = await admin
    .from("products")
    .select(PRODUCT_EMBED_SELECT)
    .eq("id", row.product_id)
    .maybeSingle();
  if (!product) return row;
  return { ...row, products: product as NonNullable<ConversationRow["products"]> };
}

function productImage(
  images: NonNullable<ConversationRow["products"]>["product_images"],
): string {
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

/** Private `messages` bucket paths → signed URLs for Conversation bubble display. */
async function signSinglePhotoPath(path: string): Promise<string | null> {
  const { tryCreateAdminClient } = await import("@/lib/supabase/admin");
  const admin = tryCreateAdminClient();
  const client = admin ?? (await createClient());
  const { data, error } = await client.storage
    .from("messages")
    .createSignedUrl(path, MESSAGE_PHOTO_SIGN_TTL_SECONDS);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

async function signPhotoMessageContents(messages: ChatMessage[]): Promise<ChatMessage[]> {
  const needsSign = messages.some(
    (message) =>
      message.kind === "photo" &&
      Boolean(message.content) &&
      !message.deletedAt &&
      isMessagePhotoStoragePath(message.content),
  );
  if (!needsSign) return messages;

  return Promise.all(
    messages.map(async (message) => {
      if (
        message.kind !== "photo" ||
        !message.content ||
        message.deletedAt ||
        isRenderableMessagePhotoSrc(message.content)
      ) {
        return message;
      }
      if (!isMessagePhotoStoragePath(message.content)) return message;
      const signedUrl = await signSinglePhotoPath(message.content);
      if (!signedUrl) return message;
      return { ...message, content: signedUrl };
    }),
  );
}

async function getPresence(userId: string) {
  const { tryCreateAdminClient } = await import("@/lib/supabase/admin");
  const admin = tryCreateAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("user_presence")
    .select("online, last_seen_at")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

function mapConversation(row: ConversationRow, viewerId: string): Conversation {
  if (!row.products) {
    throw new Error("Conversation product unavailable");
  }
  const product = row.products;
  const isBuyer = row.buyer_id === viewerId;
  const participant = isBuyer ? row.seller : row.buyer;
  const sellerProfileRaw = row.seller?.seller_profiles;
  const sellerProfile = Array.isArray(sellerProfileRaw)
    ? sellerProfileRaw[0]
    : sellerProfileRaw;

  return {
    id: row.id,
    participant: {
      id: participant.id,
      name: participant.full_name,
      username: participant.username ?? null,
      avatarUrl: normalizeAvatarUrl(participant.avatar_url) ?? undefined,
      role: isBuyer ? "seller" : "buyer",
      online: false,
      lastSeen: undefined,
      rating: isBuyer ? (sellerProfile?.rating ?? null) : null,
      reviewCount: isBuyer ? (sellerProfile?.review_count ?? null) : null,
    },
    product: {
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: Number(product.price),
      condition: product.condition,
      imageUrl: productImage(product.product_images),
      status: product.status as ProductListingStatus,
      listingType: product.listing_type === "auction" ? "auction" : "fixed",
      acceptOffers: Boolean(product.accept_offers),
      locationCity: product.location_city ?? null,
    },
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    unreadCount: coerceUnreadCount(
      isBuyer ? row.buyer_unread_count : row.seller_unread_count,
      0,
    ),
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
  products ( id, slug, title, price, condition, status, listing_type, accept_offers, location_city, product_images ( url, is_primary, sort_order ) ),
  buyer:profiles!conversations_buyer_id_fkey ( id, full_name, avatar_url, username ),
  seller:profiles!conversations_seller_id_fkey ( id, full_name, avatar_url, username, seller_profiles ( rating, review_count ) ),
  messages ( * )
`;

type DataClient = Awaited<ReturnType<typeof createClient>>;

export async function listConversations(
  viewerId: string,
  client?: DataClient,
): Promise<Conversation[]> {
  const supabase = client ?? (await createClient());
  const { data } = await supabase
    .from("conversations")
    .select(conversationSelect)
    .or(`buyer_id.eq.${viewerId},seller_id.eq.${viewerId}`)
    .order("last_message_at", { ascending: false });

  const rows = (data as ConversationRow[] | null) ?? [];
  const enriched = await Promise.all(
    rows.map(async (row) => {
      const hydrated = await hydrateConversationProduct({ ...row, messages: row.messages ?? [] });
      if (!hydrated.products) return null;
      const conversation = mapConversation(hydrated, viewerId);
      const presence = await getPresence(conversation.participant.id);
      conversation.participant.online = presence?.online ?? false;
      conversation.participant.lastSeen = presence?.last_seen_at ?? undefined;
      return conversation;
    }),
  );

  return enriched
    .filter((conversation): conversation is Conversation => conversation != null)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));
}

export async function getConversationById(
  id: string,
  viewerId: string,
  client?: DataClient,
): Promise<Conversation | null> {
  const supabase = client ?? (await createClient());
  const { data } = await supabase
    .from("conversations")
    .select(conversationSelect)
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;

  const hydrated = await hydrateConversationProduct(data as unknown as ConversationRow);
  if (!hydrated.products) return null;

  const conversation = mapConversation(hydrated, viewerId);
  conversation.messages = await signPhotoMessageContents(conversation.messages);
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
  client?: DataClient;
}): Promise<{ message: ChatMessage | null; error?: string; warning?: string | null }> {
  const kind = input.kind ?? "text";
  const security =
    kind === "photo"
      ? inspectMessageContent(MESSAGE_PHOTO_PREVIEW_LABEL)
      : inspectMessageContent(input.content);
  if (security.blocked) {
    return { message: null, error: security.warning ?? "Message blocked by safety filters." };
  }

  const previewText = kind === "photo" ? MESSAGE_PHOTO_PREVIEW_LABEL : input.content;

  const supabase = input.client ?? (await createClient());
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: input.senderId,
      sender_role: input.senderRole,
      content: input.content,
      kind,
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
        last_message: previewText,
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

    await emitSmartNotification({
      userId: recipientId,
      eventType: "new_message",
      idempotencyKey: `new-message-${data.id}`,
      notificationType: "message",
      title: "New message",
      subtitle: previewText.slice(0, 120),
      href: `/inbox/conversation/${input.conversationId}`,
      detail: buildAutoReplyWarning(security.warning) ?? undefined,
      payload: { conversationId: input.conversationId, messageId: data.id },
      email: recipientProfile?.email
        ? {
            to: recipientProfile.email,
            subject: "New ROVEXO message",
            body: `${previewText.slice(0, 500)}\n\nOpen: /inbox/conversation/${input.conversationId}`,
          }
        : undefined,
    });
  }

  await supabase.from("messages").update({ status: "delivered" }).eq("id", data.id);

  if (input.senderRole === "seller" && conversation) {
    void onSellerMessageReply({ sellerId: conversation.seller_id });
  }

  const mapped = mapMessage({ ...data, status: "delivered" });
  if (kind === "photo" && isMessagePhotoStoragePath(mapped.content)) {
    const signedUrl = await signSinglePhotoPath(mapped.content);
    if (signedUrl) {
      return {
        message: { ...mapped, content: signedUrl },
        warning: buildAutoReplyWarning(security.warning),
      };
    }
  }

  return {
    message: mapped,
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
