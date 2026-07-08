import { notFound } from "next/navigation";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { TrackingView } from "@/features/commerce-ui/views/TrackingView";
import { getBuyerCommerceOrderView } from "@/lib/commerce/read-model";
import { fetchOrderForUser, getOrderViewRole } from "@/lib/orders/queries";
import { getProfile } from "@/lib/profile/data";

type OrderTrackingRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderTrackingRoute({ params }: OrderTrackingRouteProps) {
  const { id } = await params;
  const profile = await getProfile();
  const order = await fetchOrderForUser(id, profile.id);

  if (!order || getOrderViewRole(order, profile.id) !== "buyer") {
    notFound();
  }

  const commerce = await getBuyerCommerceOrderView(order);

  return (
    <BetaAppShell bottomNavTab="account" showBottomNav>
      <TrackingView
        orderNumber={commerce.meta.orderNumber}
        itemCount={commerce.meta.itemCount}
        sellerName={commerce.sellerName}
        parcels={commerce.parcels}
        orderHref={`/orders/${order.id}`}
        backHref={`/orders/${order.id}`}
      />
    </BetaAppShell>
  );
}
