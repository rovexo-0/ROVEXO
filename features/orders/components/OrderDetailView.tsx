"use client";

import { useCallback, useState } from "react";
import {
  CanonicalButton,
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalSection,
} from "@/src/components/canonical";
import { PublishedCheckmark } from "@/features/sell/components/PublishedCheckmark";
import { OrderReviewCard } from "@/features/orders/components/OrderReviewCard";
import { IssueResolutionLink } from "@/features/orders/components/IssueResolutionLink";
import { DeliveryStatusCard } from "@/features/orders/components/DeliveryStatusCard";
import { BuyerCancelOrderCard } from "@/features/orders/components/BuyerCancelOrderCard";
import { RefundStatusCard } from "@/features/orders/components/RefundStatusCard";
import { OrderActionsCard } from "@/features/orders/components/OrderActionsCard";
import { SellerOrderFulfillment } from "@/features/orders/components/SellerOrderFulfillment";
import { OrderProductCard } from "@/features/orders/components/OrderProductCard";
import { OrderSummaryTotals } from "@/features/commerce-ui/components/OrderSummaryTotals";
import { mapOrderToCommerceTotals } from "@/lib/commerce/mappers";
import type { SellerShipmentView } from "@/lib/commerce/view-types";
import { EscrowReleaseCard } from "@/features/commerce/components/EscrowReleaseCard";
import { ResolutionStatusCard } from "@/features/commerce/components/ResolutionStatusCard";
import {
  canConfirmDelivery,
  getDeliveryStages,
  isOrderClosed,
} from "@/lib/orders/delivery";
import { resolveOrderViewRole } from "@/lib/orders/role";
import type { OrderEscrowState } from "@/lib/commerce-engine/read-model";
import type { OrderResolutionSummary } from "@/lib/resolution-engine/types";
import type { Order } from "@/lib/orders/types";

type OrderDetailViewProps = {
  initialOrder: Order;
  userId: string;
  escrowState?: OrderEscrowState;
  resolutionSummary?: OrderResolutionSummary;
  sellerShipment?: SellerShipmentView;
  buyerCanCancel?: boolean;
  buyerCancelReason?: string;
};

export function OrderDetailView({
  initialOrder,
  userId,
  escrowState,
  resolutionSummary,
  sellerShipment,
  buyerCanCancel = false,
  buyerCancelReason,
}: OrderDetailViewProps) {
  const [order, setOrder] = useState(initialOrder);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const view = resolveOrderViewRole(order, userId);

  const handleBuyerAction = useCallback(async (action: "confirm_ok" | "report_issue") => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error("Unable to update order.");
      }

      const payload = (await response.json()) as { order: Order };
      setOrder(payload.order);
    } finally {
      setIsSubmitting(false);
    }
  }, [order.id]);

  if (!view) return null;

  const stages = getDeliveryStages(order);
  const showBuyerConfirm = view === "buyer" && canConfirmDelivery(order.status, order.disputesDisabled);
  const showCompleted = view === "buyer" && order.status === "completed";

  if (showCompleted) {
    return (
      <div className="flex w-full flex-col gap-ds-4">
        <section
          className="flex w-full flex-col items-center gap-ds-4 py-ds-6 text-center"
          aria-labelledby="order-complete-heading"
        >
          <PublishedCheckmark />
          <CanonicalInfoBlock variant="success">
            <p id="order-complete-heading" className="font-medium text-text-primary">
              Thank you
            </p>
            <p className="mt-ds-1 text-sm">
              Funds release 24h after delivery unless claimed.
            </p>
            {order.disputesDisabled ? (
              <p className="mt-ds-1 text-xs text-text-muted">Disputes disabled.</p>
            ) : null}
          </CanonicalInfoBlock>
        </section>
        <OrderReviewCard orderId={order.id} sellerName={order.seller.name} />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-ds-4">
      {view === "seller" && sellerShipment ? (
        <SellerOrderFulfillment
          order={order}
          userId={userId}
          shipment={sellerShipment}
          onOrderUpdated={setOrder}
        />
      ) : (
        <OrderProductCard order={order} userId={userId} />
      )}

      {stages.length > 0 && view === "buyer" ? (
        <DeliveryStatusCard stages={stages} carrier={order.deliveryCarrier} />
      ) : null}

      {order.status === "awaiting_payment" ? (
        <CanonicalInfoBlock variant="description">
          <p>Awaiting payment.</p>
        </CanonicalInfoBlock>
      ) : null}

      <OrderSummaryTotals totals={mapOrderToCommerceTotals(order.totals)} title="Summary" />

      {escrowState && view ? <EscrowReleaseCard escrow={escrowState} view={view} /> : null}

      {resolutionSummary && view ? (
        <ResolutionStatusCard resolution={resolutionSummary} view={view} />
      ) : null}

      <OrderActionsCard order={order} view={view} />

      {view === "buyer" ? (
        <BuyerCancelOrderCard
          order={order}
          canCancel={buyerCanCancel}
          disabledReason={buyerCancelReason}
          onCancelled={setOrder}
        />
      ) : null}

      {view === "buyer" ? <RefundStatusCard order={order} /> : null}

      {showBuyerConfirm ? (
        <CanonicalSection title="Delivery">
          <CanonicalCard variant="medium" className="flex w-full flex-col gap-ds-2">
            <CanonicalButton
              fullWidth
              loading={isSubmitting}
              onClick={() => void handleBuyerAction("confirm_ok")}
            >
              Confirm OK
            </CanonicalButton>
            <CanonicalButton
              variant="outline"
              fullWidth
              disabled={isSubmitting || isOrderClosed(order)}
              onClick={() => void handleBuyerAction("report_issue")}
            >
              Report issue
            </CanonicalButton>
          </CanonicalCard>
        </CanonicalSection>
      ) : null}

      {order.status === "issue_open" ? (
        <CanonicalSection title="Issue">
          <CanonicalInfoBlock variant="warning">
            <p>
              {view === "buyer"
                ? "Under review. Track in Resolution Centre."
                : "Buyer reported an issue. Respond in Resolution Centre."}
            </p>
          </CanonicalInfoBlock>
          <IssueResolutionLink orderId={order.id} className="mt-ds-2" />
        </CanonicalSection>
      ) : null}
    </div>
  );
}
