import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ChatPage } from "@/features/messages/components/ChatPage";
import { fetchConversationById } from "@/lib/messages/queries";
import { getProfile } from "@/lib/profile/data";

type ChatRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function ChatRoute({ params }: ChatRouteProps) {
  const { id } = await params;
  await getProfile();
  const conversation = await fetchConversationById(id);

  if (!conversation) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <ChatPage initialConversation={conversation} />
    </Suspense>
  );
}
