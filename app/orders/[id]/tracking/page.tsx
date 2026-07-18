import { notFound } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";
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
  const orderHref = `/orders/${order.id}`;

  return (
    <AccountCanonicalShell
      title="Tracking"
      backHref={orderHref}
      showHeaderTitle
      bottomNavTab="account"
    >
      <div className="flex w-full flex-col px-ds-4 pb-ds-5">
        <TrackingView
          orderNumber={commerce.meta.orderNumber}
          itemCount={commerce.meta.itemCount}
          sellerShipments={commerce.sellerShipments}
          orderId={order.id}
          orderHref={orderHref}
          backHref={orderHref}
          embedded
        />
      </div>
    </AccountCanonicalShell>
  );
}
