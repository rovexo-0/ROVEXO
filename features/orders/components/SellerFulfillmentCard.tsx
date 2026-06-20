"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
    <Card padding="lg" className="flex flex-col gap-ds-3 shadow-ds-soft">
      <h2 className="text-base font-semibold text-text-primary">Seller fulfillment</h2>

      {canMarkDelivered && (
        <Button
          variant="primary"
          fullWidth
          size="lg"
          disabled={isSubmitting}
          onClick={() => void runAction("mark_delivered")}
        >
          Mark as Delivered
        </Button>
      )}

      {canRefund && (
        <Button
          variant="outline"
          fullWidth
          size="lg"
          disabled={isSubmitting}
          onClick={() => void runAction("refund")}
        >
          Issue Refund
        </Button>
      )}
    </Card>
  );
}
