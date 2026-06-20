import {
  appendMessage,
  getConversationById,
  listConversations,
  markConversationRead,
} from "@/lib/messages/store";
import type { Conversation } from "@/lib/messages/types";
import { requireAuthContext } from "@/lib/auth/session";

export async function fetchConversations(): Promise<Conversation[]> {
  const { user } = await requireAuthContext();
  return listConversations(user.id);
}

export async function fetchConversationById(id: string): Promise<Conversation | null> {
  const { user } = await requireAuthContext();
  return getConversationById(id, user.id);
}

export async function sendConversationMessage(
  conversationId: string,
  content: string,
  senderRole: "buyer" | "seller",
): Promise<Conversation | null> {
  const { user } = await requireAuthContext();
  await appendMessage({
    conversationId,
    senderId: user.id,
    senderRole,
    content: content.trim(),
  });
  return getConversationById(conversationId, user.id);
}

export async function readConversation(id: string): Promise<Conversation | null> {
  const { user } = await requireAuthContext();
  await markConversationRead(id, user.id);
  return getConversationById(id, user.id);
}
