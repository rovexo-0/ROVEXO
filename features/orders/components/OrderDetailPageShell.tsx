import { AccountCanonicalShell } from "@/features/account-canonical";
import { cn } from "@/lib/cn";
import { OrdersEngineOrderPanel } from "@/features/orders-engine/OrdersEngineOrderPanel";
import { BuyerOrderDetailCanonical } from "@/features/orders/components/BuyerOrderDetailCanonical";
import { OrderDetailView } from "@/features/orders/components/OrderDetailView";
import { resolveOrderViewRole } from "@/lib/orders/role";
import type { BuyerCommerceOrderView, SellerShipmentView } from "@/lib/commerce/view-types";
import type { OrderEscrowState } from "@/lib/commerce-engine/read-model";
import type { OrderResolutionSummary } from "@/lib/resolution-engine/types";
import type { OrdersEngineOrderContext } from "@/lib/orders-engine/types";
import type { Order } from "@/lib/orders/types";

type OrderDetailPageShellProps = {
  order: Order;
  userId: string;
  backHref: string;
  showBottomNav?: boolean;
  bottomNavTab?: "account" | "sell";
  orderContext?: OrdersEngineOrderContext;
  escrowState?: OrderEscrowState | null;
  resolutionSummary?: OrderResolutionSummary | null;
  commerceView?: BuyerCommerceOrderView;
  sellerShipment?: SellerShipmentView;
  showSuccessBanner?: boolean;
  buyerCanCancel?: boolean;
};

export function OrderDetailPageShell({
  order,
  userId,
  backHref,
  showBottomNav = true,
  bottomNavTab = "account",
  orderContext,
  escrowState,
  resolutionSummary,
  commerceView,
  sellerShipment,
  showSuccessBanner,
  buyerCanCancel,
}: OrderDetailPageShellProps) {
  const role = resolveOrderViewRole(order, userId);
  const isBuyerCanonical = role === "buyer" && Boolean(commerceView);
  const isCompleted = order.status === "completed" || order.status === "cancelled";

  return (
    <AccountCanonicalShell
      title="Order Details"
      backHref={backHref}
      backLabel="Orders"
      showHeaderTitle={!isCompleted}
      showBottomNav={showBottomNav}
      bottomNavTab={bottomNavTab}
      hideBack={isCompleted}
      contentClassName={cn(isCompleted && "flex min-h-[70dvh] items-center justify-center")}
    >
      <div className="flex w-full flex-col gap-ds-4 px-ds-4 pb-ds-5">
        {orderContext && !isCompleted ? <OrdersEngineOrderPanel context={orderContext} /> : null}
        {isBuyerCanonical && commerceView ? (
          <BuyerOrderDetailCanonical
            initialOrder={order}
            commerce={commerceView}
            escrowState={escrowState ?? undefined}
            resolutionSummary={resolutionSummary ?? undefined}
            showSuccessBanner={showSuccessBanner}
            buyerCanCancel={buyerCanCancel}
          />
        ) : (
          <OrderDetailView
            initialOrder={order}
            userId={userId}
            escrowState={escrowState ?? undefined}
            resolutionSummary={resolutionSummary ?? undefined}
            sellerShipment={sellerShipment}
            buyerCanCancel={buyerCanCancel}
          />
        )}
      </div>
    </AccountCanonicalShell>
  );
}
