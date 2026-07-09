"use client";

import { memo, useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { UK_CARRIERS } from "@/lib/shipping/carriers";
import type { Order } from "@/lib/orders/types";
import type { ShipmentParcel } from "@/lib/shipping/types";

type ParcelCardProps = {
  order: Order;
  parcel: ShipmentParcel;
  onUpdated: (parcel: ShipmentParcel) => void;
  onDeleted: (parcelId: string) => void;
};

function fieldLabel(text: string) {
  return <span className="text-xs font-medium text-text-secondary">{text}</span>;
}

export const ParcelCard = memo(function ParcelCard({
  order,
  parcel,
  onUpdated,
  onDeleted,
}: ParcelCardProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState({
    weightKg: parcel.weightKg?.toString() ?? "",
    lengthCm: parcel.dimensions?.lengthCm?.toString() ?? "",
    widthCm: parcel.dimensions?.widthCm?.toString() ?? "",
    heightCm: parcel.dimensions?.heightCm?.toString() ?? "",
    carrier: parcel.carrier ?? String(order.deliveryCarrier),
    shippingService: parcel.shippingService ?? "",
    insuranceEnabled: parcel.insuranceEnabled,
    insuranceValueGbp: parcel.insuranceValueGbp?.toString() ?? "",
  });
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
          weightKg: draft.weightKg ? Number(draft.weightKg) : null,
          lengthCm: draft.lengthCm ? Number(draft.lengthCm) : null,
          widthCm: draft.widthCm ? Number(draft.widthCm) : null,
          heightCm: draft.heightCm ? Number(draft.heightCm) : null,
          carrier: draft.carrier,
          shippingService: draft.shippingService || null,
          productItemIds: [order.product.id],
          insuranceEnabled: draft.insuranceEnabled,
          insuranceValueGbp: draft.insuranceValueGbp ? Number(draft.insuranceValueGbp) : null,
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
  }, [draft, onUpdated, order.id, order.product.id, parcel.id]);

  const generateLabel = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      await saveParcel();
      const response = await fetch("/api/shipping/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, parcelId: parcel.id }),
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
  }, [onUpdated, order.id, parcel.id, saveParcel]);

  const printLabel = useCallback(() => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=480,height=640");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Parcel ${parcel.parcelNumber} — ${order.orderNumber}</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px}p{margin:6px 0;font-size:14px}</style>
      </head><body>${content.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [order.orderNumber, parcel.parcelNumber]);

  return (
    <Card padding="lg" className="flex flex-col gap-ds-4">
      <div className="flex items-center justify-between gap-ds-3">
        <h3 className="text-base font-semibold text-text-primary">
          Parcel {parcel.parcelNumber} of {parcel.totalParcels}
        </h3>
        {!hasLabel ? (
          <button
            type="button"
            className={cn("text-xs font-medium text-danger", focusRing)}
            onClick={() => onDeleted(parcel.id)}
          >
            Remove
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-ds-3 rounded-ds-md border border-border bg-surface-muted p-ds-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-ds-md bg-surface">
          <SafeImage src={order.product.imageUrl} alt={order.product.title} fill className="object-cover" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{order.product.title}</p>
          <p className="text-xs text-text-secondary">Qty × 1</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-ds-3">
        <label className="flex flex-col gap-ds-1">
          {fieldLabel("Weight (kg)")}
          <Input
            value={draft.weightKg}
            onChange={(event) => setDraft((current) => ({ ...current, weightKg: event.target.value }))}
            inputMode="decimal"
            disabled={hasLabel}
          />
        </label>
        <label className="flex flex-col gap-ds-1">
          {fieldLabel("Carrier")}
          <select
            className={cn("rx-input min-h-ds-7 w-full rounded-ds-md px-ds-3 text-sm", focusRing)}
            value={draft.carrier}
            onChange={(event) => setDraft((current) => ({ ...current, carrier: event.target.value }))}
            disabled={hasLabel}
          >
            {UK_CARRIERS.map((carrier) => (
              <option key={carrier.id} value={carrier.id}>
                {carrier.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-ds-1">
          {fieldLabel("Length (cm)")}
          <Input
            value={draft.lengthCm}
            onChange={(event) => setDraft((current) => ({ ...current, lengthCm: event.target.value }))}
            inputMode="decimal"
            disabled={hasLabel}
          />
        </label>
        <label className="flex flex-col gap-ds-1">
          {fieldLabel("Width (cm)")}
          <Input
            value={draft.widthCm}
            onChange={(event) => setDraft((current) => ({ ...current, widthCm: event.target.value }))}
            inputMode="decimal"
            disabled={hasLabel}
          />
        </label>
        <label className="flex flex-col gap-ds-1">
          {fieldLabel("Height (cm)")}
          <Input
            value={draft.heightCm}
            onChange={(event) => setDraft((current) => ({ ...current, heightCm: event.target.value }))}
            inputMode="decimal"
            disabled={hasLabel}
          />
        </label>
        <label className="flex flex-col gap-ds-1">
          {fieldLabel("Shipping Service")}
          <Input
            value={draft.shippingService}
            onChange={(event) =>
              setDraft((current) => ({ ...current, shippingService: event.target.value }))
            }
            placeholder="Standard"
            disabled={hasLabel}
          />
        </label>
        <label className="col-span-2 flex items-center gap-ds-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border"
            checked={draft.insuranceEnabled}
            onChange={(event) =>
              setDraft((current) => ({ ...current, insuranceEnabled: event.target.checked }))
            }
            disabled={hasLabel}
          />
          {fieldLabel("Add shipping insurance")}
        </label>
        {draft.insuranceEnabled ? (
          <label className="col-span-2 flex flex-col gap-ds-1">
            {fieldLabel("Insurance value (£)")}
            <Input
              value={draft.insuranceValueGbp}
              onChange={(event) =>
                setDraft((current) => ({ ...current, insuranceValueGbp: event.target.value }))
              }
              inputMode="decimal"
              placeholder="0.00"
              disabled={hasLabel}
            />
          </label>
        ) : null}
      </div>

      {parcel.trackingNumber ? (
        <div className="rounded-ds-md border border-border bg-surface-muted p-ds-3">
          <p className="text-xs text-text-muted">Tracking Number</p>
          <p className="mt-ds-1 font-mono text-sm font-medium text-text-primary">
            {parcel.trackingNumber}
          </p>
        </div>
      ) : null}

      <div ref={printRef} className="sr-only" aria-hidden>
        <p>ROVEXO — Parcel {parcel.parcelNumber} of {parcel.totalParcels}</p>
        <p>Order: {order.orderNumber}</p>
        <p>Carrier: {draft.carrier}</p>
        <p>Item: {order.product.title}</p>
        {parcel.trackingNumber ? <p>Tracking: {parcel.trackingNumber}</p> : null}
      </div>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-ds-2 sm:flex-row">
        {!hasLabel ? (
          <Button variant="outline" fullWidth disabled={isSaving} onClick={() => void saveParcel()}>
            {isSaving ? "Saving…" : "Save Parcel"}
          </Button>
        ) : null}
        {!hasLabel ? (
          <Button variant="primary" fullWidth disabled={isGenerating} onClick={() => void generateLabel()}>
            {isGenerating ? "Generating…" : "Generate Label"}
          </Button>
        ) : (
          <Button variant="primary" fullWidth onClick={printLabel}>
            Print Label
          </Button>
        )}
      </div>
    </Card>
  );
});
