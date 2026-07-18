"use client";

import { useState } from "react";
import {
  CanonicalButton,
  CanonicalCard,
  CanonicalInfoBlock,
} from "@/src/components/canonical";
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
    <CanonicalCard variant="medium" className="flex w-full flex-col gap-ds-2">
      <h2 className="text-base font-semibold text-text-primary">Cancel order</h2>
      <p className="text-sm text-text-secondary">
        Cancel before shipment for a full refund when payment has been taken.
      </p>
      {disabledReason ? (
        <p className="text-sm text-text-muted">{disabledReason}</p>
      ) : null}
      {error ? <CanonicalInfoBlock variant="error">{error}</CanonicalInfoBlock> : null}
      <CanonicalButton
        variant="outline"
        fullWidth
        disabled={isSubmitting || Boolean(disabledReason)}
        loading={isSubmitting}
        onClick={() => void handleCancel()}
      >
        Cancel order
      </CanonicalButton>
    </CanonicalCard>
  );
}
