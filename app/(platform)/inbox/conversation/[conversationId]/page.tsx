import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ConversationHub } from "@/features/inbox/components/ConversationHub";
import {
  getConversationMockupDemoBundle,
  isConversationMockupDemoId,
} from "@/lib/inbox/demo/conversation-mockup-demo-fixture-v1";
import {
  getMessagesLifecycleDemoBundle,
  isMessagesLifecycleDemoId,
} from "@/lib/inbox/demo/messages-lifecycle-demo-fixtures-v1";
import {
  OWNER_DEMO_MODE_V1,
  parseOwnerDemoModeFlag,
  shouldShowOwnerDemoInboxRows,
} from "@/lib/inbox/demo/owner-demo-mode-v1";
import { fetchConversationById } from "@/lib/messages/queries";
import { fetchOrderForUser } from "@/lib/orders/queries";
import { getProfile } from "@/lib/profile/data";

export const dynamic = "force-dynamic";

type ConversationRouteProps = {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{
    order?: string;
    order_id?: string;
    focus?: string;
    offerId?: string;
  }>;
};

export default async function InboxConversationRoute({
  params,
  searchParams,
}: ConversationRouteProps) {
  const [{ conversationId }, sp, cookieStore] = await Promise.all([
    params,
    searchParams,
    cookies(),
  ]);

  const isDemoCandidate =
    isConversationMockupDemoId(conversationId) || isMessagesLifecycleDemoId(conversationId);

  /* Demo gate needs profile; production path parallelizes profile + conversation. */
  if (isDemoCandidate) {
    const profile = await getProfile();
    const ownerDemoModeEnabled = parseOwnerDemoModeFlag(
      cookieStore.get(OWNER_DEMO_MODE_V1.cookieName)?.value,
    );
    const ownerDemoAllowed = shouldShowOwnerDemoInboxRows({
      authenticated: Boolean(profile?.id),
      role: profile?.role ?? null,
      ownerDemoModeEnabled,
    });

    if (ownerDemoAllowed && isConversationMockupDemoId(conversationId)) {
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

    if (ownerDemoAllowed && isMessagesLifecycleDemoId(conversationId)) {
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
  }

  const orderId = sp.order?.trim() || sp.order_id?.trim() || null;

  /* P0.2 — parallel hydrate: auth profile + conversation (+ optional order). */
  const [profile, conversation] = await Promise.all([
    getProfile(),
    fetchConversationById(conversationId),
  ]);

  if (!conversation) {
    notFound();
  }

  const initialOrder =
    orderId && profile?.id
      ? await fetchOrderForUser(orderId, profile.id)
      : null;

  return (
    <Suspense fallback={null}>
      <ConversationHub
        initialConversation={conversation}
        initialOrder={initialOrder}
      />
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
