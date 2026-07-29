import { redirect } from "next/navigation";
import { resolveOrderConversationHrefForUser } from "@/lib/orders/resolve-order-conversation-href.server";
import { getProfile } from "@/lib/profile/data";

type OrderTrackingRouteProps = {
  params: Promise<{ id: string }>;
};

/**
 * Phase I — Tracking opens Conversation Hub (focus=tracking), not a separate page.
 */
export default async function OrderTrackingRoute({ params }: OrderTrackingRouteProps) {
  const { id } = await params;
  const profile = await getProfile();
  redirect(await resolveOrderConversationHrefForUser(id, profile.id, { focus: "tracking" }));
}
