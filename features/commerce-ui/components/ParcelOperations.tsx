"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { ParcelOperation } from "@/features/commerce-ui/types";
import { CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";

type ParcelOperationsProps = {
  orderId: string;
  parcelId: string;
  activeOperation: ParcelOperation | null;
  onOperationApplied?: (operation: ParcelOperation) => void;
  className?: string;
};

const OPERATIONS: Array<{ id: ParcelOperation; label: string; description: string }> = [
  { id: "return", label: "Return", description: "Request a return for this parcel." },
  { id: "claim", label: "Claim", description: "Open a claim for this parcel." },
  { id: "lost", label: "Lost", description: "Report this parcel as lost." },
  { id: "damaged", label: "Damaged", description: "Report damage to this parcel." },
];

/**
 * Parcel-level operations — Absolute Final Master Menu rows.
 * Size display lives on ParcelCard (S / M / L / XL only).
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
    <div className={cn("w-full", className)}>
      <CanonicalSection title="Parcel actions">
        <CanonicalCard variant="list">
          {activeOperation ? (
            <CanonicalMenuRow
              title="Active"
              value={activeOperation}
              showChevron={false}
            />
          ) : null}
          {OPERATIONS.map((operation) => (
            <CanonicalMenuRow
              key={operation.id}
              title={operation.label}
              description={operation.description}
              value={
                pending === operation.id
                  ? "Applying…"
                  : activeOperation === operation.id
                    ? "Active"
                    : undefined
              }
              showChevron={false}
              disabled={Boolean(pending) || activeOperation === operation.id}
              onClick={() => void applyOperation(operation.id)}
            />
          ))}
        </CanonicalCard>
      </CanonicalSection>
      {error ? (
        <p className="mt-ds-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
