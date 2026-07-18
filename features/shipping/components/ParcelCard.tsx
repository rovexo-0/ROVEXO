"use client";

import { memo, useCallback, useState } from "react";
import { CanonicalButton, CanonicalCard, CanonicalMenuRow } from "@/src/components/canonical";
import { SafeImage } from "@/components/ui/SafeImage";
import { PARCEL_TIER_OPTIONS, parcelTierLabel } from "@/lib/shipping/parcels";
import type { ParcelTier } from "@/lib/shipping/types";
import type { Order } from "@/lib/orders/types";
import type { ShipmentParcel } from "@/lib/shipping/types";

type ParcelCardProps = {
  order: Order;
  parcel: ShipmentParcel;
  onUpdated: (parcel: ShipmentParcel) => void;
  onDeleted: (parcelId: string) => void;
};

function initialTier(parcel: ShipmentParcel): ParcelTier {
  const dimensions = parcel.dimensions;
  if (!dimensions?.lengthCm || !dimensions.widthCm || !dimensions.heightCm) {
    return "medium_parcel";
  }

  const matched = PARCEL_TIER_OPTIONS.find(
    (option) =>
      option.maxDimensionsCm.length === dimensions.lengthCm &&
      option.maxDimensionsCm.width === dimensions.widthCm &&
      option.maxDimensionsCm.height === dimensions.heightCm,
  );

  return matched?.id ?? "medium_parcel";
}

/**
 * Absolute Final Parcel Freeze — ONLY Small / Medium / Large / Extra Large.
 * No weight · no dimensions · no free text · no custom size.
 */
export const ParcelCard = memo(function ParcelCard({
  order,
  parcel,
  onUpdated,
  onDeleted,
}: ParcelCardProps) {
  const [tier, setTier] = useState<ParcelTier>(() => initialTier(parcel));
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLabel = parcel.label?.status === "ready" && Boolean(parcel.trackingNumber);

  const saveParcel = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${order.id}/shipment/parcels/${parcel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcelTier: tier,
          productItemIds: [order.product.id],
        }),
      });
      const payload = (await response.json()) as { parcel?: ShipmentParcel; error?: string };
      if (!response.ok || !payload.parcel) {
        throw new Error(payload.error ?? "Unable to save parcel.");
      }
      onUpdated(payload.parcel);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save parcel.");
    } finally {
      setIsSaving(false);
    }
  }, [onUpdated, order.id, order.product.id, parcel.id, tier]);

  const generateLabel = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      await saveParcel();
      const response = await fetch("/api/shipping/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, parcelId: parcel.id, parcelTier: tier }),
      });
      const payload = (await response.json()) as { parcel?: ShipmentParcel; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to generate label.");
      }
      if (payload.parcel) onUpdated(payload.parcel);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate label.");
    } finally {
      setIsGenerating(false);
    }
  }, [onUpdated, order.id, parcel.id, saveParcel, tier]);

  return (
    <CanonicalCard variant="list" className="flex w-full flex-col">
      <CanonicalMenuRow
        title={`Parcel ${parcel.parcelNumber} of ${parcel.totalParcels}`}
        value={parcelTierLabel(tier)}
        showChevron={false}
        icon={
          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted">
            <SafeImage src={order.product.imageUrl} alt={order.product.title} fill className="object-cover" />
          </span>
        }
      />

      {!hasLabel ? (
        <div className="flex flex-col border-t border-border">
          {PARCEL_TIER_OPTIONS.map((option) => (
            <CanonicalMenuRow
              key={option.id}
              title={option.label}
              description={option.description}
              showChevron={false}
              value={tier === option.id ? "Selected" : undefined}
              onClick={() => setTier(option.id)}
            />
          ))}
        </div>
      ) : null}

      {parcel.trackingNumber ? (
        <CanonicalMenuRow title="Tracking" value={parcel.trackingNumber} showChevron={false} />
      ) : null}

      {error ? (
        <p className="px-0 py-ds-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-ds-2 py-ds-3">
        {!hasLabel ? (
          <>
            <CanonicalButton variant="secondary" disabled={isSaving} onClick={() => void saveParcel()}>
              {isSaving ? "Saving…" : "Save"}
            </CanonicalButton>
            <CanonicalButton variant="primary" disabled={isGenerating} onClick={() => void generateLabel()}>
              {isGenerating ? "Generating…" : "Generate Label"}
            </CanonicalButton>
            <CanonicalButton variant="ghost" onClick={() => onDeleted(parcel.id)}>
              Remove
            </CanonicalButton>
          </>
        ) : (
          <CanonicalMenuRow title="Label ready" value="Print from courier" showChevron={false} />
        )}
      </div>
    </CanonicalCard>
  );
});
