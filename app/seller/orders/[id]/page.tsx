import { notFound, redirect } from "next/navigation";
import { OrderDetailPageShell } from "@/features/orders/components/OrderDetailPageShell";
import { fetchOrderForUser, getOrderViewRole } from "@/lib/orders/queries";
import { getOrderEscrowState } from "@/lib/commerce-engine/read-model";
import { getSellerShipmentView } from "@/lib/commerce/read-model";
import { getOrderResolutionSummary } from "@/lib/resolution-engine";
import { getProfile } from "@/lib/profile/data";

type SellerOrderDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export default async function SellerOrderDetailRoute({ params }: SellerOrderDetailRouteProps) {
  const { id } = await params;
  const profile = await getProfile();

  if (!profile.isSeller) {
    redirect("/account");
  }

  const order = await fetchOrderForUser(id, profile.id);

  if (!order || getOrderViewRole(order, profile.id) !== "seller") {
    notFound();
  }

  const [escrowState, resolutionSummary, sellerShipment] = await Promise.all([
    getOrderEscrowState(id),
    getOrderResolutionSummary(id),
    getSellerShipmentView(order),
  ]);

  return (
    <OrderDetailPageShell
      order={order}
      userId={profile.id}
      backHref="/seller/orders"
      showBottomNav={false}
      escrowState={escrowState}
      resolutionSummary={resolutionSummary}
      sellerShipment={sellerShipment}
    />
  );
}
