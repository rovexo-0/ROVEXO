import { notFound } from "next/navigation";
import { OrderDetailPageShell } from "@/features/orders/components/OrderDetailPageShell";
import { fetchOrderForUser, getOrderViewRole } from "@/lib/orders/queries";
import { getBuyerCommerceOrderView } from "@/lib/commerce/read-model";
import { getOrderEscrowState } from "@/lib/commerce-engine/read-model";
import { getOrderResolutionSummary } from "@/lib/resolution-engine";
import { getOrdersEngineOrderContext } from "@/lib/orders-engine/reader";
import { getProfile } from "@/lib/profile/data";

type BuyerOrderDetailRouteProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
};

export default async function BuyerOrderDetailRoute({
  params,
  searchParams,
}: BuyerOrderDetailRouteProps) {
  const { id } = await params;
  const { placed } = await searchParams;
  const profile = await getProfile();
  const order = await fetchOrderForUser(id, profile.id);

  if (!order || getOrderViewRole(order, profile.id) !== "buyer") {
    notFound();
  }

  const [orderContext, commerce, escrowState, resolutionSummary] = await Promise.all([
    getOrdersEngineOrderContext(id),
    getBuyerCommerceOrderView(order),
    getOrderEscrowState(id),
    getOrderResolutionSummary(id),
  ]);

  return (
    <OrderDetailPageShell
      order={order}
      userId={profile.id}
      backHref="/orders"
      bottomNavTab="account"
      orderContext={orderContext ?? undefined}
      escrowState={escrowState}
      resolutionSummary={resolutionSummary}
      commerceView={commerce}
      showSuccessBanner={placed === "1"}
    />
  );
}
