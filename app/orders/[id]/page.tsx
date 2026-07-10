import { Suspense } from "react";
import { notFound } from "next/navigation";
import { OrderCheckoutConfirmation } from "@/features/orders/components/OrderCheckoutConfirmation";
import { OrderDetailPageShell } from "@/features/orders/components/OrderDetailPageShell";
import { confirmOrderCheckoutSession } from "@/lib/orders/checkout";
import { fetchOrderForUser, getOrderViewRole } from "@/lib/orders/queries";
import { isStripeConfigured } from "@/lib/stripe/server";
import { getBuyerCommerceOrderView } from "@/lib/commerce/read-model";
import { getOrderEscrowState } from "@/lib/commerce-engine/read-model";
import { getOrderResolutionSummary } from "@/lib/resolution-engine";
import { getOrdersEngineOrderContext } from "@/lib/orders-engine/reader";
import { getBuyerOrderCancellationEligibility } from "@/lib/orders/cancel-order.server";
import { getProfile } from "@/lib/profile/data";

type BuyerOrderDetailRouteProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string; session_id?: string }>;
};

export default async function BuyerOrderDetailRoute({
  params,
  searchParams,
}: BuyerOrderDetailRouteProps) {
  const { id } = await params;
  const { placed, session_id: sessionId } = await searchParams;
  const profile = await getProfile();

  if (sessionId && isStripeConfigured()) {
    await confirmOrderCheckoutSession(sessionId, profile.id);
  }

  const order = await fetchOrderForUser(id, profile.id);

  if (!order || getOrderViewRole(order, profile.id) !== "buyer") {
    notFound();
  }

  const [orderContext, commerce, escrowState, resolutionSummary, cancellationEligibility] =
    await Promise.all([
      getOrdersEngineOrderContext(id),
      getBuyerCommerceOrderView(order),
      getOrderEscrowState(id),
      getOrderResolutionSummary(id),
      getBuyerOrderCancellationEligibility(id, profile.id),
    ]);

  return (
    <>
      <Suspense fallback={null}>
        <OrderCheckoutConfirmation orderId={id} />
      </Suspense>
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
        buyerCanCancel={cancellationEligibility.canCancel}
      />
    </>
  );
}
