"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { Order } from "@/lib/orders/types";

type AddTrackingCardProps = {
  order: Order;
  onAdded: (order: Order) => void;
};

const fieldClassName =
  "min-h-ds-7 w-full premium-input px-ds-3 py-ds-2 text-sm placeholder:text-text-muted";

export function AddTrackingCard({ order, onAdded }: AddTrackingCardProps) {
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (order.status !== "awaiting_shipment") {
    return null;
  }

  const handleSubmit = async () => {
    const value = trackingNumber.trim();
    if (!value) {
      setError("Enter a tracking number.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_tracking", trackingNumber: value }),
      });

      if (!response.ok) {
        throw new Error("Unable to add tracking.");
      }

      const payload = (await response.json()) as { order: Order };
      onAdded(payload.order);
    } catch {
      setError("Unable to add tracking. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card padding="lg" className="flex flex-col gap-ds-4">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Add Tracking</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Add a tracking number so the buyer can track their parcel.
        </p>
      </div>

      <label className="flex flex-col gap-ds-2">
        <span className="text-sm font-medium text-text-primary">Tracking number</span>
        <input
          type="text"
          value={trackingNumber}
          onChange={(event) => setTrackingNumber(event.target.value)}
          placeholder="Enter tracking number"
          className={cn(fieldClassName, focusRing)}
        />
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button
        variant="primary"
        fullWidth
        size="lg"
        className="min-h-[52px] rounded-ds-lg text-base"
        disabled={isSubmitting}
        onClick={() => void handleSubmit()}
      >
        {isSubmitting ? "Saving…" : "Add Tracking"}
      </Button>
    </Card>
  );
}
