import { notFound } from "next/navigation";
import { ChatPage } from "@/features/messages/components/ChatPage";
import { fetchConversationById } from "@/lib/messages/queries";

type ChatRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function ChatRoute({ params }: ChatRouteProps) {
  const { id } = await params;
  const conversation = await fetchConversationById(id);

  if (!conversation) {
    notFound();
  }

  return <ChatPage initialConversation={conversation} />;
}
