"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Order } from "@/lib/orders/types";

type BuyerCancelOrderCardProps = {
  order: Order;
  canCancel: boolean;
  disabledReason?: string;
  onCancelled: (order: Order) => void;
};

export function BuyerCancelOrderCard({
  order,
  canCancel,
  disabledReason,
  onCancelled,
}: BuyerCancelOrderCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canCancel || order.status === "cancelled") {
    return null;
  }

  async function handleCancel() {
    const confirmed = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      const payload = (await response.json()) as { order?: Order; error?: string };
      if (!response.ok || !payload.order) {
        throw new Error(payload.error ?? "Unable to cancel order.");
      }

      onCancelled(payload.order);
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Unable to cancel order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card padding="lg" className="flex flex-col gap-ds-3">
      <h2 className="text-base font-semibold text-text-primary">Cancel Order</h2>
      <p className="text-sm text-text-secondary">
        Cancel before shipment to receive a full automatic refund when payment has been taken.
      </p>
      {disabledReason ? (
        <p className="text-sm text-text-muted">{disabledReason}</p>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button
        variant="outline"
        fullWidth
        size="lg"
        className="min-h-[52px] rounded-ds-lg text-base"
        disabled={isSubmitting || Boolean(disabledReason)}
        onClick={() => void handleCancel()}
      >
        {isSubmitting ? "Cancelling…" : "Cancel Order"}
      </Button>
    </Card>
  );
}
