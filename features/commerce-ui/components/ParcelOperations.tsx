"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { ParcelOperation } from "@/features/commerce-ui/types";

type ParcelOperationsProps = {
  orderId: string;
  parcelId: string;
  activeOperation: ParcelOperation | null;
  onOperationApplied?: (operation: ParcelOperation) => void;
  className?: string;
};

const OPERATIONS: Array<{ id: ParcelOperation; label: string; description: string }> = [
  { id: "return", label: "Return", description: "Request a return for this parcel only." },
  { id: "claim", label: "Claim", description: "Open a claim for this parcel only." },
  { id: "lost", label: "Lost", description: "Report this parcel as lost in transit." },
  { id: "damaged", label: "Damaged", description: "Report damage to items in this parcel." },
];

/**
 * Parcel-level operations — each action applies independently to one parcel.
 */
export function ParcelOperations({
  orderId,
  parcelId,
  activeOperation,
  onOperationApplied,
  className,
}: ParcelOperationsProps) {
  const [pending, setPending] = useState<ParcelOperation | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function applyOperation(operation: ParcelOperation) {
    setPending(operation);
    setError(null);
    try {
      const response = await fetch(
        `/api/orders/${orderId}/shipment/parcels/${parcelId}/operations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operation }),
        },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to apply parcel operation.");
      }
      onOperationApplied?.(operation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to apply parcel operation.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className={cn("flex flex-col gap-ds-3 border-t border-border pt-ds-4", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Parcel actions</p>
      {activeOperation ? (
        <p className="rounded-ds-md border border-warning/30 bg-warning/10 px-ds-3 py-ds-2 text-sm text-text-primary">
          Active: <span className="font-semibold capitalize">{activeOperation}</span>
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-ds-2">
        {OPERATIONS.map((operation) => (
          <Button
            key={operation.id}
            variant="outline"
            size="sm"
            fullWidth
            disabled={Boolean(pending) || activeOperation === operation.id}
            onClick={() => void applyOperation(operation.id)}
          >
            {pending === operation.id ? "Applying…" : operation.label}
          </Button>
        ))}
      </div>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
