import { ConversationPlaceholder } from "@/features/inbox/components/ConversationPlaceholder";

export const dynamic = "force-dynamic";

type ConversationRouteProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function InboxConversationRoute({ params }: ConversationRouteProps) {
  const { conversationId } = await params;
  return <ConversationPlaceholder conversationId={conversationId} />;
}

export async function generateMetadata({ params }: ConversationRouteProps) {
  const { conversationId } = await params;
  return {
    title: "Conversation | ROVEXO",
    description: `Conversation ${conversationId}`,
    robots: { index: false, follow: false },
  };
}
