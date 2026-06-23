"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PublishedCheckmark } from "@/features/sell/components/PublishedCheckmark";
import { AddTrackingCard } from "@/features/orders/components/AddTrackingCard";
import { IssueResolutionLink } from "@/features/orders/components/IssueResolutionLink";
import { ShippingLabelCard } from "@/features/orders/components/ShippingLabelCard";
import { DeliveryStatusCard } from "@/features/orders/components/DeliveryStatusCard";
import { OrderActionsCard } from "@/features/orders/components/OrderActionsCard";
import { OrderReviewCard } from "@/features/orders/components/OrderReviewCard";
import { SellerFulfillmentCard } from "@/features/orders/components/SellerFulfillmentCard";
import { OrderProductCard } from "@/features/orders/components/OrderProductCard";
import { OrderTrackingCard } from "@/features/orders/components/OrderTrackingCard";
import { OrderSummary } from "@/features/checkout/components/OrderSummary";
import {
  canConfirmDelivery,
  getDeliveryStages,
  isOrderClosed,
} from "@/lib/orders/delivery";
import { resolveOrderViewRole } from "@/lib/orders/role";
import type { Order } from "@/lib/orders/types";

type OrderDetailViewProps = {
  initialOrder: Order;
  userId: string;
};

export function OrderDetailView({ initialOrder, userId }: OrderDetailViewProps) {
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
            Funds enter a 36-hour buyer protection hold, then release to the seller.
          </p>

          {order.disputesDisabled && (
            <p className="mt-ds-1 text-xs text-text-muted">Further disputes are disabled for this order.</p>
          )}
        </section>

        <OrderReviewCard orderId={order.id} sellerName={order.seller.name} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-ds-5">
      <OrderProductCard order={order} userId={userId} />

      {stages.length > 0 && (
        <DeliveryStatusCard stages={stages} carrier={order.deliveryCarrier} />
      )}

      {order.status === "awaiting_payment" && (
        <Card padding="lg" className="">
          <p className="text-sm text-text-secondary">Awaiting payment from buyer.</p>
        </Card>
      )}

      <OrderTrackingCard order={order} />

      <OrderSummary totals={order.totals} title="Payment summary" />

      {view === "seller" && (
        <ShippingLabelCard order={order} />
      )}

      {view === "seller" && (
        <AddTrackingCard order={order} onAdded={setOrder} />
      )}

      {view === "seller" && (
        <SellerFulfillmentCard order={order} onUpdated={setOrder} />
      )}

      <OrderActionsCard order={order} view={view} />

      {showBuyerConfirm && (
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
      )}

      {order.status === "issue_open" && (
        <Card padding="lg" className="">
          <h2 className="text-base font-semibold text-text-primary">Issue Open</h2>
          <p className="mt-ds-2 text-sm text-text-secondary">
            {view === "buyer"
              ? "Your issue is being reviewed. Track progress in the Resolution Centre."
              : "The buyer reported an issue on this order. Respond in the Resolution Centre."}
          </p>
          <IssueResolutionLink orderId={order.id} className="mt-ds-4" />
        </Card>
      )}
    </div>
  );
}
