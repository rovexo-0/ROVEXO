"use client";

import { memo, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ShippingService } from "@/lib/shipping";
import type { Order } from "@/lib/orders/types";
import type { ShippingRecord } from "@/lib/shipping/types";

type LabelCardProps = {
  order: Order;
  record?: ShippingRecord | null;
};

export const LabelCard = memo(function LabelCard({ order, record }: LabelCardProps) {
  const labelRef = useRef<HTMLDivElement>(null);

  if (order.status !== "awaiting_shipment" && order.status !== "shipped") {
    return null;
  }

  const label =
    record?.label ??
    ShippingService.buildDraftLabel({
      orderNumber: order.orderNumber,
      carrier: order.deliveryCarrier,
      buyerName: order.buyer.name,
      productTitle: order.product.title,
      trackingNumber: order.trackingNumber,
    });

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
    <Card padding="lg" className="flex flex-col gap-ds-4">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Shipping label</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Print this label and attach it to your parcel. Add the tracking number after dispatch.
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

      <Button variant="secondary" fullWidth onClick={printLabel}>
        Print shipping label
      </Button>
    </Card>
  );
});
