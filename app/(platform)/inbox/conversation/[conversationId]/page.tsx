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
import { getAuthContext } from "@/lib/auth/session";

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

  /* Demo gate: light cached auth only — never heavy getProfile fan-out. */
  if (isDemoCandidate) {
    const auth = await getAuthContext();
    const ownerDemoModeEnabled = parseOwnerDemoModeFlag(
      cookieStore.get(OWNER_DEMO_MODE_V1.cookieName)?.value,
    );
    const ownerDemoAllowed = shouldShowOwnerDemoInboxRows({
      authenticated: Boolean(auth?.user.id),
      role: auth?.role ?? null,
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

  /*
   * P0.3 — conversation fetch already requireAuthContext (React.cache).
   * Do NOT also await getProfile (unread scan + seller + business fan-out).
   * Share getAuthContext only when order hydrate needs user id.
   */
  const conversationPromise = fetchConversationById(conversationId);
  const [auth, conversation] = await Promise.all([
    orderId ? getAuthContext() : Promise.resolve(null),
    conversationPromise,
  ]);

  if (!conversation) {
    notFound();
  }

  const initialOrder =
    orderId && auth?.user.id
      ? await fetchOrderForUser(orderId, auth.user.id)
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
