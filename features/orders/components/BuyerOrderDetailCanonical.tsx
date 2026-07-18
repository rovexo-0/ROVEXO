"use client";

import { useCallback, useState } from "react";
import {
  CanonicalButton,
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalSection,
} from "@/src/components/canonical";
import { PublishedCheckmark } from "@/features/sell/components/PublishedCheckmark";
import { OrderDetailsView } from "@/features/commerce-ui/views/OrderDetailsView";
import { OrderReviewCard } from "@/features/orders/components/OrderReviewCard";
import { IssueResolutionLink } from "@/features/orders/components/IssueResolutionLink";
import { EscrowReleaseCard } from "@/features/commerce/components/EscrowReleaseCard";
import { ResolutionStatusCard } from "@/features/commerce/components/ResolutionStatusCard";
import {
  canConfirmDelivery,
  isOrderClosed,
} from "@/lib/orders/delivery";
import type { BuyerCommerceOrderView } from "@/lib/commerce/view-types";
import type { OrderEscrowState } from "@/lib/commerce-engine/read-model";
import type { OrderResolutionSummary } from "@/lib/resolution-engine/types";
import { BuyerCancelOrderCard } from "@/features/orders/components/BuyerCancelOrderCard";
import { RefundStatusCard } from "@/features/orders/components/RefundStatusCard";
import type { Order } from "@/lib/orders/types";

type BuyerOrderDetailCanonicalProps = {
  initialOrder: Order;
  commerce: BuyerCommerceOrderView;
  escrowState?: OrderEscrowState;
  resolutionSummary?: OrderResolutionSummary;
  showSuccessBanner?: boolean;
  buyerCanCancel?: boolean;
};

export function BuyerOrderDetailCanonical({
  initialOrder,
  commerce,
  escrowState,
  resolutionSummary,
  showSuccessBanner = false,
  buyerCanCancel = false,
}: BuyerOrderDetailCanonicalProps) {
  const [order, setOrder] = useState(initialOrder);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (order.status === "completed") {
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

  const showBuyerConfirm = canConfirmDelivery(order.status, order.disputesDisabled);

  return (
    <div className="flex w-full flex-col gap-ds-4">
      <OrderDetailsView
        meta={commerce.meta}
        items={commerce.items}
        totals={commerce.totals}
        sellerShipments={commerce.sellerShipments}
        backHref="/orders"
        showSuccessBanner={showSuccessBanner}
        embedded
        className="w-full"
      />

      {escrowState ? <EscrowReleaseCard escrow={escrowState} view="buyer" /> : null}

      <BuyerCancelOrderCard
        order={order}
        canCancel={buyerCanCancel}
        onCancelled={setOrder}
      />

      <RefundStatusCard order={order} />

      {resolutionSummary ? (
        <ResolutionStatusCard resolution={resolutionSummary} view="buyer" />
      ) : null}

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
            <p>Under review. Track in Resolution Centre.</p>
          </CanonicalInfoBlock>
          <IssueResolutionLink orderId={order.id} className="mt-ds-2" />
        </CanonicalSection>
      ) : null}
    </div>
  );
}
