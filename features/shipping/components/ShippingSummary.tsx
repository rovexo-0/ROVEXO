"use client";

import { memo } from "react";
import { Card } from "@/components/ui/Card";
import { ShippingTrackingTimeline } from "@/features/shipping/components/ShippingTrackingTimeline";
import { buildTrackingTimeline, shippingStatusLabel } from "@/lib/shipping";
import type { ShippingRecord } from "@/lib/shipping/types";

type ShippingSummaryProps = {
  record: ShippingRecord | null;
};

export const ShippingSummary = memo(function ShippingSummary({ record }: ShippingSummaryProps) {
  if (!record) return null;

  const timeline = buildTrackingTimeline(record.trackingEvents, record.status);

  return (
    <Card padding="lg" className="flex flex-col gap-ds-4">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Shipping summary</h2>
        <p className="mt-ds-1 text-sm text-text-secondary">
          Current status: {shippingStatusLabel(record.status)}
        </p>
      </div>
      <ShippingTrackingTimeline items={timeline} />
    </Card>
  );
});
