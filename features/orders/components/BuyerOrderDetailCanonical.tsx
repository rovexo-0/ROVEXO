"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
      <div className="flex flex-col gap-ds-5">
        <section
          className="flex w-full flex-col items-center justify-center px-ds-2 py-ds-8 text-center"
          aria-labelledby="order-complete-heading"
        >
          <PublishedCheckmark />
          <h2 id="order-complete-heading" className="mt-ds-6 text-xl font-semibold text-text-primary">
            Thank you!
          </h2>
          <p className="mt-ds-2 text-sm text-text-secondary">
            Seller funds release automatically 24 hours after delivery, unless a claim is opened.
          </p>
          {order.disputesDisabled ? (
            <p className="mt-ds-1 text-xs text-text-muted">
              Further disputes are disabled for this order.
            </p>
          ) : null}
        </section>
        <OrderReviewCard orderId={order.id} sellerName={order.seller.name} />
      </div>
    );
  }

  const showBuyerConfirm = canConfirmDelivery(order.status, order.disputesDisabled);

  return (
    <div className="flex flex-col gap-ds-5">
      <OrderDetailsView
        meta={commerce.meta}
        items={commerce.items}
        totals={commerce.totals}
        sellerShipments={commerce.sellerShipments}
        backHref="/orders"
        showSuccessBanner={showSuccessBanner}
        embedded
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
        <Card padding="lg" className="flex flex-col gap-ds-4">
          <h2 className="text-base font-semibold text-text-primary">Confirm Everything OK</h2>
          <div className="flex flex-col gap-ds-3">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              className="min-h-[60px] rounded-ds-lg text-base"
              disabled={isSubmitting}
              onClick={() => void handleBuyerAction("confirm_ok")}
            >
              Confirm Everything OK
            </Button>
            <Button
              variant="outline"
              fullWidth
              size="lg"
              className="min-h-[60px] rounded-ds-lg text-base"
              disabled={isSubmitting || isOrderClosed(order)}
              onClick={() => void handleBuyerAction("report_issue")}
            >
              I Have an Issue
            </Button>
          </div>
        </Card>
      ) : null}

      {order.status === "issue_open" ? (
        <Card padding="lg">
          <h2 className="text-base font-semibold text-text-primary">Issue Open</h2>
          <p className="mt-ds-2 text-sm text-text-secondary">
            Your issue is being reviewed. Track progress in the Resolution Centre.
          </p>
          <IssueResolutionLink orderId={order.id} className="mt-ds-4" />
        </Card>
      ) : null}
    </div>
  );
}
