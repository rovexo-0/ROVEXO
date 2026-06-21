"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  subscribeToConversationMessages,
  subscribeToConversationMeta,
  subscribeToPresence,
  updatePresence,
} from "@/lib/messages/realtime";
import type { ChatMessage, Conversation } from "@/lib/messages/types";

function mapRealtimeMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: String(row.id),
    senderRole: row.sender_role as ChatMessage["senderRole"],
    kind: row.kind as ChatMessage["kind"],
    content: row.deleted_at ? "Message deleted" : String(row.content ?? ""),
    sentAt: String(row.sent_at ?? new Date().toISOString()),
    status: (row.status as ChatMessage["status"]) ?? "delivered",
    replyToId: row.reply_to_id ? String(row.reply_to_id) : null,
    editedAt: row.edited_at ? String(row.edited_at) : null,
    deletedAt: row.deleted_at ? String(row.deleted_at) : null,
    reactions: (row.reactions as Record<string, string[]>) ?? {},
    moderationWarning: row.moderation_warning ? String(row.moderation_warning) : null,
  };
}

export function useChatRealtime(
  conversationId: string,
  participantId: string,
  setConversation: Dispatch<SetStateAction<Conversation>>,
) {
  useEffect(() => {
    void updatePresence({ online: true });

    const messageChannel = subscribeToConversationMessages(conversationId, (row) => {
      const incoming = mapRealtimeMessage(row);
      setConversation((current) => ({
        ...current,
        messages: current.messages.some((message) => message.id === incoming.id)
          ? current.messages.map((message) => (message.id === incoming.id ? incoming : message))
          : [...current.messages, incoming],
        lastMessage: incoming.content,
        lastMessageAt: incoming.sentAt,
      }));
    });

    const metaChannel = subscribeToConversationMeta(conversationId, (row) => {
      setConversation((current) => ({
        ...current,
        lastMessage: String(row.last_message ?? current.lastMessage),
        lastMessageAt: String(row.last_message_at ?? current.lastMessageAt),
      }));
    });

    const presenceChannel = subscribeToPresence(participantId, (row) => {
      setConversation((current) => ({
        ...current,
        participant: {
          ...current.participant,
          online: Boolean(row.online),
          lastSeen: row.last_seen_at ? String(row.last_seen_at) : current.participant.lastSeen,
        },
      }));
    });

    return () => {
      void updatePresence({ online: false, typingConversationId: null });
      void messageChannel.unsubscribe();
      void metaChannel.unsubscribe();
      void presenceChannel.unsubscribe();
    };
  }, [conversationId, participantId, setConversation]);
}

export async function signalTyping(conversationId: string, typing: boolean): Promise<void> {
  await updatePresence({
    online: true,
    typingConversationId: typing ? conversationId : null,
  });
}
