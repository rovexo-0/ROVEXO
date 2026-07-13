import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ConversationHub } from "@/features/inbox/components/ConversationHub";
import { fetchConversationById } from "@/lib/messages/queries";
import { getProfile } from "@/lib/profile/data";

export const dynamic = "force-dynamic";

type ConversationRouteProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function InboxConversationRoute({ params }: ConversationRouteProps) {
  const { conversationId } = await params;
  await getProfile();
  const conversation = await fetchConversationById(conversationId);

  if (!conversation) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <ConversationHub initialConversation={conversation} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: ConversationRouteProps) {
  const { conversationId } = await params;
  return {
    title: "Conversation | ROVEXO",
    description: `Conversation ${conversationId}`,
    robots: { index: false, follow: false },
  };
}
