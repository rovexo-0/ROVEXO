import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { HubPageMain } from "@/components/layout/HubPageMain";
import { BetaPageHeader } from "@/components/beta/BetaPageHeader";
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
  showSuccessBanner = false,
  buyerCanCancel = false,
}: OrderDetailPageShellProps) {
  const view = resolveOrderViewRole(order, userId);
  const isCompleted = view === "buyer" && order.status === "completed";
  const isBuyerCanonical = view === "buyer" && commerceView != null;

  return (
    <BetaAppShell bottomNavTab={showBottomNav ? bottomNavTab : undefined} showBottomNav={showBottomNav}>
      {!isCompleted ? <BetaPageHeader title="Order Details" backHref={backHref} /> : null}

      <HubPageMain
        withBottomNav={showBottomNav}
        className={cn(
          "mx-auto flex w-full max-w-2xl flex-col",
          isCompleted
            ? "min-h-[100dvh] justify-center px-ds-4 py-ds-6"
            : "px-ds-4 py-ds-5 ",
        )}
      >
        {orderContext && !isCompleted ? <OrdersEngineOrderPanel context={orderContext} /> : null}
        {isBuyerCanonical ? (
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
      </HubPageMain>
    </BetaAppShell>
  );
}
