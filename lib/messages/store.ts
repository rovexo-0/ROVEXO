import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types/database";
import type { ChatMessage, Conversation } from "@/lib/messages/types";

type ConversationRow = Tables<"conversations"> & {
  products: Pick<
    Tables<"products">,
    "slug" | "title" | "price" | "condition"
  > & {
    product_images: Pick<Tables<"product_images">, "url" | "is_primary" | "sort_order">[];
  };
  buyer: Pick<Tables<"profiles">, "id" | "full_name" | "avatar_url">;
  seller: Pick<Tables<"profiles">, "id" | "full_name" | "avatar_url">;
  messages: Tables<"messages">[];
};

function productImage(
  images: ConversationRow["products"]["product_images"],
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
    content: row.content,
    sentAt: row.sent_at,
    status: row.status,
  };
}

function mapConversation(row: ConversationRow, viewerId: string): Conversation {
  const isBuyer = row.buyer_id === viewerId;
  const participant = isBuyer ? row.seller : row.buyer;

  return {
    id: row.id,
    participant: {
      id: participant.id,
      name: participant.full_name,
      avatarUrl: participant.avatar_url,
      role: isBuyer ? "seller" : "buyer",
      online: false,
    },
    product: {
      slug: row.products.slug,
      title: row.products.title,
      price: Number(row.products.price),
      condition: row.products.condition,
      imageUrl: productImage(row.products.product_images),
    },
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    unreadCount: isBuyer ? row.buyer_unread_count : row.seller_unread_count,
    messages: (row.messages ?? []).map(mapMessage),
  };
}

export async function listConversations(viewerId: string): Promise<Conversation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select(
      `
      *,
      products ( slug, title, price, condition, product_images ( url, is_primary, sort_order ) ),
      buyer:profiles!conversations_buyer_id_fkey ( id, full_name, avatar_url ),
      seller:profiles!conversations_seller_id_fkey ( id, full_name, avatar_url ),
      messages ( * )
    `,
    )
    .or(`buyer_id.eq.${viewerId},seller_id.eq.${viewerId}`)
    .order("last_message_at", { ascending: false });

  return ((data as ConversationRow[] | null) ?? []).map((row) =>
    mapConversation(row, viewerId),
  );
}

export async function getConversationById(
  id: string,
  viewerId: string,
): Promise<Conversation | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select(
      `
      *,
      products ( slug, title, price, condition, product_images ( url, is_primary, sort_order ) ),
      buyer:profiles!conversations_buyer_id_fkey ( id, full_name, avatar_url ),
      seller:profiles!conversations_seller_id_fkey ( id, full_name, avatar_url ),
      messages ( * )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return mapConversation(data as ConversationRow, viewerId);
}

export async function appendMessage(input: {
  conversationId: string;
  senderId: string;
  senderRole: "buyer" | "seller";
  content: string;
  kind?: "text" | "photo" | "emoji";
}): Promise<ChatMessage | null> {
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
    })
    .select("*")
    .single();

  if (error || !data) {
    return null;
  }

  const isBuyer = input.senderRole === "buyer";

  const { data: conversation } = await supabase
    .from("conversations")
    .select("buyer_unread_count, seller_unread_count")
    .eq("id", input.conversationId)
    .single();

  if (conversation) {
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
  }

  return mapMessage(data);
}

export async function markConversationRead(
  conversationId: string,
  viewerId: string,
): Promise<void> {
  const supabase = await createClient();
  const { data: conversation } = await supabase
    .from("conversations")
    .select("buyer_id, seller_id")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    return;
  }

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
