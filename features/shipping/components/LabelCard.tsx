"use client";

import { memo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CanonicalCard } from "@/src/components/canonical";
import { ShippingService } from "@/lib/shipping";
import type { Order } from "@/lib/orders/types";
import type { ShippingRecord } from "@/lib/shipping/types";

type LabelCardProps = {
  order: Order;
  record?: ShippingRecord | null;
};

export const LabelCard = memo(function LabelCard({ order, record }: LabelCardProps) {
  const labelRef = useRef<HTMLDivElement>(null);
  const [localRecord, setLocalRecord] = useState(record ?? null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (order.status !== "awaiting_shipment" && order.status !== "shipped") {
    return null;
  }

  const label =
    localRecord?.label ??
    record?.label ??
    ShippingService.buildDraftLabel({
      orderNumber: order.orderNumber,
      carrier: order.deliveryCarrier,
      buyerName: order.buyer.name,
      productTitle: order.product.title,
      trackingNumber: order.trackingNumber,
    });

  const pdfUrl = label.pdfUrl;
  const hasCarrierLabel = Boolean(pdfUrl && label.trackingNumber);

  async function generateLabel() {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/shipping/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const payload = (await response.json()) as {
        error?: string;
        record?: ShippingRecord | null;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to generate shipping label.");
      }
      if (payload.record) setLocalRecord(payload.record);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate shipping label.");
    } finally {
      setIsGenerating(false);
    }
  }

  function printLabel() {
    const content = labelRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=480,height=640");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>ROVEXO Shipping Label — ${order.orderNumber}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 24px; }
        h1 { font-size: 18px; margin: 0 0 8px; }
        p { margin: 4px 0; font-size: 14px; }
        .barcode { font-family: monospace; font-size: 20px; letter-spacing: 2px; margin-top: 16px; }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <CanonicalCard variant="medium" className="flex w-full flex-col gap-ds-3">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Shipping label</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">
          {hasCarrierLabel
            ? "Your carrier label is ready. Download the PDF and attach it to your parcel."
            : "Generate a carrier label, or print a draft label for manual dispatch."}
        </p>
      </div>

      <div
        ref={labelRef}
        className="rounded-ds-md border border-dashed border-border bg-surface-muted p-ds-4 text-sm"
      >
        <h3 className="font-bold text-text-primary">ROVEXO</h3>
        <p className="mt-ds-2">
          <span className="font-medium">Order:</span> {order.orderNumber}
        </p>
        <p>
          <span className="font-medium">Carrier:</span> {label.carrier}
        </p>
        <p>
          <span className="font-medium">Buyer:</span> {order.buyer.name}
        </p>
        <p>
          <span className="font-medium">Item:</span> {order.product.title}
        </p>
        {label.barcode ? (
          <p className="barcode mt-ds-3 font-mono text-base tracking-wider">{label.barcode}</p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex flex-col gap-ds-2">
        {!hasCarrierLabel ? (
          <Button variant="primary" fullWidth disabled={isGenerating} onClick={() => void generateLabel()}>
            {isGenerating ? "Generating label…" : "Generate Label"}
          </Button>
        ) : null}

        {pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-ds-md bg-primary px-ds-4 text-sm font-semibold text-on-primary"
          >
            Download label PDF
          </a>
        ) : null}

        <Button variant="secondary" fullWidth onClick={printLabel}>
          Print draft label
        </Button>
      </div>
    </CanonicalCard>
  );
});
