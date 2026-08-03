"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  subscribeToConversationMessages,
  subscribeToConversationMeta,
  subscribeToPresence,
  updatePresence,
} from "@/lib/messages/realtime";
import {
  isMessagePhotoStoragePath,
  isRenderableMessagePhotoSrc,
  messagePhotoInboxPreview,
} from "@/lib/messages/message-photo-url-v1";
import { resolveMessagePhotoUrl } from "@/lib/messages/resolve-message-photo-url.client";
import { useDocumentVisible } from "@/lib/performance/hooks";
import type { ChatMessage, Conversation } from "@/lib/messages/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

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

/**
 * Never replace a renderable photo URL with a raw storage path (Phase A2 root-cause fix).
 */
function mergeRealtimePhotoContent(existing: ChatMessage | undefined, incoming: ChatMessage): ChatMessage {
  if (incoming.kind !== "photo") return incoming;
  if (
    existing &&
    isRenderableMessagePhotoSrc(existing.content) &&
    isMessagePhotoStoragePath(incoming.content)
  ) {
    return { ...incoming, content: existing.content };
  }
  return incoming;
}

/**
 * Live message/meta/presence transport for Conversation Hub.
 * Stays subscribed while the hub is mounted (visibility only gates presence online flag).
 */
export function useChatRealtime(
  conversationId: string,
  participantId: string,
  setConversation: Dispatch<SetStateAction<Conversation>>,
  enabled = true,
) {
  const visible = useDocumentVisible();

  useEffect(() => {
    if (!enabled) {
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-realtime-messages-status", "DISABLED");
        const root = document.querySelector<HTMLElement>("[data-conversation-realtime='live']");
        root?.setAttribute("data-realtime-messages-status", "DISABLED");
      }
      return;
    }

    const channels: RealtimeChannel[] = [];
    let cancelled = false;

    const stampStatus = (status: string) => {
      if (typeof document === "undefined") return;
      const root = document.querySelector<HTMLElement>("[data-conversation-realtime='live']");
      if (root) root.setAttribute("data-realtime-messages-status", status);
      document.documentElement.setAttribute("data-realtime-messages-status", status);
    };

    stampStatus("INIT");

    const applyIncoming = (incomingRaw: ChatMessage) => {
      setConversation((current) => {
        const existing = current.messages.find((message) => message.id === incomingRaw.id);
        const incoming = mergeRealtimePhotoContent(existing, incomingRaw);
        const messages = existing
          ? current.messages.map((message) => (message.id === incoming.id ? incoming : message))
          : [...current.messages, incoming];
        return {
          ...current,
          messages,
          lastMessage: messagePhotoInboxPreview(incoming.kind, incoming.content),
          lastMessageAt: incoming.sentAt,
        };
      });

      if (
        incomingRaw.kind === "photo" &&
        isMessagePhotoStoragePath(incomingRaw.content) &&
        !isRenderableMessagePhotoSrc(incomingRaw.content)
      ) {
        const path = incomingRaw.content;
        const messageId = incomingRaw.id;
        void resolveMessagePhotoUrl(path).then((url) => {
          if (!url || cancelled) return;
          setConversation((current) => ({
            ...current,
            messages: current.messages.map((message) =>
              message.id === messageId &&
              (message.content === path || isMessagePhotoStoragePath(message.content))
                ? { ...message, content: url }
                : message,
            ),
          }));
        });
      }
    };

    const messageChannel = subscribeToConversationMessages(
      conversationId,
      (row) => {
        applyIncoming(mapRealtimeMessage(row));
      },
      (status) => {
        stampStatus(status);
      },
    );
    if (!messageChannel) {
      stampStatus("NO_CLIENT");
    } else {
      channels.push(messageChannel);
    }

    const metaChannel = subscribeToConversationMeta(conversationId, (row) => {
      setConversation((current) => ({
        ...current,
        lastMessage: String(row.last_message ?? current.lastMessage),
        lastMessageAt: String(row.last_message_at ?? current.lastMessageAt),
      }));
    });
    if (metaChannel) channels.push(metaChannel);

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
    if (presenceChannel) channels.push(presenceChannel);

    return () => {
      cancelled = true;
      void updatePresence({ online: false, typingConversationId: null });
      for (const channel of channels) {
        void channel.unsubscribe();
      }
    };
  }, [conversationId, enabled, participantId, setConversation]);

  useEffect(() => {
    if (!enabled) return;
    void updatePresence({ online: visible });
  }, [enabled, visible]);
}

export async function signalTyping(conversationId: string, typing: boolean): Promise<void> {
  await updatePresence({
    online: true,
    typingConversationId: typing ? conversationId : null,
  });
}
