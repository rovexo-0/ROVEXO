import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ConversationHub } from "@/features/inbox/components/ConversationHub";
import {
  getConversationMockupDemoBundle,
  isConversationMockupDemoEnabled,
  isConversationMockupDemoId,
} from "@/lib/inbox/demo/conversation-mockup-demo-fixture-v1";
import {
  getMessagesLifecycleDemoBundle,
  isMessagesLifecycleDemoEnabled,
  isMessagesLifecycleDemoId,
} from "@/lib/inbox/demo/messages-lifecycle-demo-fixtures-v1";
import { fetchConversationById } from "@/lib/messages/queries";
import { getProfile } from "@/lib/profile/data";

export const dynamic = "force-dynamic";

type ConversationRouteProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function InboxConversationRoute({ params }: ConversationRouteProps) {
  const { conversationId } = await params;
  await getProfile();

  if (isConversationMockupDemoEnabled() && isConversationMockupDemoId(conversationId)) {
    const demo = getConversationMockupDemoBundle();
    return (
      <Suspense fallback={null}>
        <ConversationHub
          initialConversation={demo.conversation}
          initialOffers={demo.offers}
          demoMode
        />
      </Suspense>
    );
  }

  if (isMessagesLifecycleDemoEnabled() && isMessagesLifecycleDemoId(conversationId)) {
    const demo = getMessagesLifecycleDemoBundle(conversationId);
    if (!demo) notFound();
    return (
      <Suspense fallback={null}>
        <ConversationHub
          initialConversation={demo.conversation}
          initialOffers={demo.offers}
          initialOrder={demo.order}
          initialDispute={demo.dispute}
          initialHasShippingLabel={demo.hasShippingLabel}
          initialCheckoutResume={demo.key === "buyer-checkout-ready"}
          demoMode
        />
      </Suspense>
    );
  }

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
