import { redirect } from "next/navigation";
import { confirmOrderCheckoutSession } from "@/lib/orders/checkout";
import { resolveOrderConversationHrefForUser } from "@/lib/orders/resolve-order-conversation-href.server";
import { isStripeConfigured } from "@/lib/stripe/server";
import { getProfile } from "@/lib/profile/data";

type BuyerOrderDetailRouteProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string; session_id?: string }>;
};

/**
 * Phase I — Order Details removed as a destination.
 * /orders/[id] → Conversation Hub only (routing).
 */
export default async function BuyerOrderDetailRoute({
  params,
  searchParams,
}: BuyerOrderDetailRouteProps) {
  const { id } = await params;
  const { session_id: sessionId } = await searchParams;
  const profile = await getProfile();

  if (sessionId && isStripeConfigured()) {
    await confirmOrderCheckoutSession(sessionId, profile.id);
  }

  redirect(await resolveOrderConversationHrefForUser(id, profile.id));
}
