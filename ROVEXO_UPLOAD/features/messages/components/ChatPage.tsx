"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatHeader } from "@/features/messages/components/ChatHeader";
import { ChatInput } from "@/features/messages/components/ChatInput";
import { ChatMessageList } from "@/features/messages/components/ChatMessageList";
import { ChatQuickActions } from "@/features/messages/components/ChatQuickActions";
import { PinnedProductCard } from "@/features/messages/components/PinnedProductCard";
import { useChatRealtime } from "@/features/messages/hooks/use-chat-realtime";
import { getViewerRole } from "@/lib/messages/types";
import type { Conversation } from "@/lib/messages/types";
import { trackGaEvent } from "@/lib/analytics/ga4-events";

type ChatPageProps = {
  initialConversation: Conversation;
};

export function ChatPage({ initialConversation }: ChatPageProps) {
  const [conversation, setConversation] = useState(initialConversation);
  const [warning, setWarning] = useState<string | null>(null);
  const viewerRole = getViewerRole(conversation.participant);

  useChatRealtime(conversation.id, conversation.participant.id, setConversation);

  useEffect(() => {
    void fetch(`/api/messages/${conversation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read" }),
    });
  }, [conversation.id]);

  const handleSend = useCallback(
    async (content: string) => {
      const isFirstMessage = conversation.messages.length === 0;

      const response = await fetch(`/api/messages/${conversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, senderRole: viewerRole }),
      });

      const payload = (await response.json()) as {
        conversation?: Conversation;
        warning?: string | null;
        error?: string;
      };

      if (!response.ok) {
        setWarning(payload.error ?? "Unable to send message.");
        return;
      }

      if (payload.conversation) {
        setConversation(payload.conversation);
        if (isFirstMessage) {
          trackGaEvent("chat_started", {
            conversation_id: conversation.id,
            item_id: conversation.product.slug,
            item_name: conversation.product.title,
          });
        }
      }
      setWarning(payload.warning ?? null);
    },
    [conversation.id, conversation.messages.length, conversation.product.slug, conversation.product.title, viewerRole],
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-text-primary">
      <ChatHeader conversation={conversation} />

      <div className="border-b border-border px-ds-4 py-ds-3">
        <PinnedProductCard product={conversation.product} />
      </div>

      {warning ? (
        <div className="border-b border-warning/30 bg-warning/10 px-ds-4 py-ds-2 text-sm text-warning">
          {warning}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ChatMessageList messages={conversation.messages} />
      </div>

      <div className="mt-auto shrink-0">
        <ChatQuickActions viewerRole={viewerRole} product={conversation.product} />
        <ChatInput onSend={handleSend} disabled={conversation.blocked} />
      </div>
    </div>
  );
}
