import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChatPage } from "@/features/messages/components/ChatPage";
import { MessagesEngineConversationPanel } from "@/features/messages-engine/MessagesEngineConversationPanel";
import { getMessagesEngineConversationContext } from "@/lib/messages-engine/reader";
import { fetchConversationById } from "@/lib/messages/queries";
import { getProfile } from "@/lib/profile/data";

type ChatRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function ChatRoute({ params }: ChatRouteProps) {
  const { id } = await params;
  const profile = await getProfile();
  const [conversation, engineContext] = await Promise.all([
    fetchConversationById(id),
    getMessagesEngineConversationContext(id, profile.id),
  ]);

  if (!conversation) {
    notFound();
  }

  return (
    <>
      {engineContext ? (
        <Suspense fallback={null}>
          <MessagesEngineConversationPanel context={engineContext} />
        </Suspense>
      ) : null}
      <ChatPage initialConversation={conversation} />
    </>
  );
}
