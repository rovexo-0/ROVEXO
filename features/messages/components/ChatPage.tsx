"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatHeader } from "@/features/messages/components/ChatHeader";
import { ChatInput } from "@/features/messages/components/ChatInput";
import { ChatMessageList } from "@/features/messages/components/ChatMessageList";
import { ChatQuickActions } from "@/features/messages/components/ChatQuickActions";
import { PinnedProductCard } from "@/features/messages/components/PinnedProductCard";
import { getViewerRole } from "@/lib/messages/types";
import type { Conversation } from "@/lib/messages/types";

type ChatPageProps = {
  initialConversation: Conversation;
};

export function ChatPage({ initialConversation }: ChatPageProps) {
  const [conversation, setConversation] = useState(initialConversation);
  const viewerRole = getViewerRole(conversation.participant);

  useEffect(() => {
    void fetch(`/api/messages/${conversation.id}`, { method: "PATCH" });
  }, [conversation.id]);

  const handleSend = useCallback(
    async (content: string) => {
      const response = await fetch(`/api/messages/${conversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, senderRole: viewerRole }),
      });

      if (!response.ok) return;

      const payload = (await response.json()) as { conversation: Conversation };
      setConversation(payload.conversation);
    },
    [conversation.id, viewerRole],
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-text-primary">
      <ChatHeader conversation={conversation} />

      <div className="border-b border-border px-ds-4 py-ds-3">
        <PinnedProductCard product={conversation.product} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ChatMessageList messages={conversation.messages} />
      </div>

      <div className="mt-auto shrink-0">
        <ChatQuickActions viewerRole={viewerRole} product={conversation.product} />
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}
