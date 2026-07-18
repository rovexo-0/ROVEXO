"use client";

import { useState } from "react";
import {
  CanonicalButton,
  CanonicalCard,
  CanonicalInfoBlock,
} from "@/src/components/canonical";
import type { Order } from "@/lib/orders/types";

type SellerFulfillmentCardProps = {
  order: Order;
  onUpdated: (order: Order) => void;
};

export function SellerFulfillmentCard({ order, onUpdated }: SellerFulfillmentCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function runAction(action: "mark_delivered" | "refund") {
    if (isSubmitting) return;

    if (action === "refund") {
      const confirmed = window.confirm("Issue a refund and restore inventory?");
      if (!confirmed) return;
    }

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
      onUpdated(payload.order);
    } finally {
      setIsSubmitting(false);
    }
  }

  const canMarkDelivered = order.status === "shipped";
  const canRefund = ["awaiting_shipment", "shipped", "delivered"].includes(order.status);

  if (!canMarkDelivered && !canRefund) {
    return null;
  }

  return (
    <CanonicalCard variant="medium" className="flex w-full flex-col gap-ds-2">
      {canMarkDelivered ? (
        <CanonicalButton
          fullWidth
          loading={isSubmitting}
          onClick={() => void runAction("mark_delivered")}
        >
          Mark delivered
        </CanonicalButton>
      ) : null}
      {!canMarkDelivered && order.status === "delivered" ? (
        <CanonicalInfoBlock variant="success" title="Delivered">
          <span className="sr-only">Order marked delivered</span>
        </CanonicalInfoBlock>
      ) : null}
      {canRefund ? (
        <CanonicalButton
          variant="outline"
          fullWidth
          loading={isSubmitting}
          onClick={() => void runAction("refund")}
        >
          Issue refund
        </CanonicalButton>
      ) : null}
    </CanonicalCard>
  );
}
