"use client";

import { useEffect, useRef } from "react";
import { ChatBubble } from "@/features/messages/components/ChatBubble";
import type { ChatMessage } from "@/lib/messages/types";

type ChatMessageListProps = {
  messages: ChatMessage[];
};

export function ChatMessageList({ messages }: ChatMessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex flex-1 flex-col gap-ds-3 overflow-y-auto px-ds-4 py-ds-4">
      {messages.map((message) => (
        <ChatBubble key={message.id} message={message} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
