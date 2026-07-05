"use client";

import { memo } from "react";
import { Card } from "@/components/ui/Card";
import { shippingStatusLabel } from "@/lib/shipping";
import type { ShippingRecord } from "@/lib/shipping/types";

type ShippingCardProps = {
  record: ShippingRecord | null;
  carrier?: string | null;
  statusFallback?: string | null;
};

export const ShippingCard = memo(function ShippingCard({
  record,
  carrier,
  statusFallback,
}: ShippingCardProps) {
  const status = record ? shippingStatusLabel(record.status) : statusFallback;
  const resolvedCarrier = record?.carrier ?? carrier;

  if (!status && !resolvedCarrier) return null;

  return (
    <Card padding="lg" className="flex flex-col gap-ds-3">
      <h2 className="text-base font-semibold text-text-primary">Shipping</h2>
      <dl className="grid gap-ds-2 text-sm">
        {status ? (
          <div className="flex justify-between gap-ds-3">
            <dt className="text-text-secondary">Status</dt>
            <dd className="font-medium text-text-primary">{status}</dd>
          </div>
        ) : null}
        {resolvedCarrier ? (
          <div className="flex justify-between gap-ds-3">
            <dt className="text-text-secondary">Carrier</dt>
            <dd className="font-medium text-text-primary">{resolvedCarrier}</dd>
          </div>
        ) : null}
      </dl>
    </Card>
  );
});
