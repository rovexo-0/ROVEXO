import { redirect } from "next/navigation";
import { resolveOrderConversationHrefForUser } from "@/lib/orders/resolve-order-conversation-href.server";
import { getProfile } from "@/lib/profile/data";

type SellerOrderDetailRouteProps = {
  params: Promise<{ id: string }>;
};

/**
 * Phase I — Seller Order Details removed as a destination.
 * /seller/orders/[id] → Conversation Hub only (routing).
 */
export default async function SellerOrderDetailRoute({ params }: SellerOrderDetailRouteProps) {
  const { id } = await params;
  const profile = await getProfile();

  if (!profile.isSeller) {
    redirect("/account");
  }

  redirect(await resolveOrderConversationHrefForUser(id, profile.id));
}
