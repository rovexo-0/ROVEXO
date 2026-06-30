import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function subscribeToConversationMessages(
  conversationId: string,
  onInsert: (payload: Record<string, unknown>) => void,
): RealtimeChannel {
  const supabase = createClient();
  return supabase
    .channel(`conversation:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onInsert(payload.new as Record<string, unknown>);
      },
    )
    .subscribe();
}

export function subscribeToConversationMeta(
  conversationId: string,
  onUpdate: (payload: Record<string, unknown>) => void,
): RealtimeChannel {
  const supabase = createClient();
  return supabase
    .channel(`conversation-meta:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "conversations",
        filter: `id=eq.${conversationId}`,
      },
      (payload) => {
        onUpdate(payload.new as Record<string, unknown>);
      },
    )
    .subscribe();
}

export function subscribeToPresence(
  userId: string,
  onChange: (payload: Record<string, unknown>) => void,
): RealtimeChannel {
  const supabase = createClient();
  return supabase
    .channel(`presence:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_presence",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onChange((payload.new ?? payload.old) as Record<string, unknown>);
      },
    )
    .subscribe();
}

export async function updatePresence(input: {
  online?: boolean;
  typingConversationId?: string | null;
}): Promise<void> {
  await fetch("/api/messages/presence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
