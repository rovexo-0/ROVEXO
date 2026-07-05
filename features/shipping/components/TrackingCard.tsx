"use client";

import { memo } from "react";
import { Card } from "@/components/ui/Card";
import { getTrackingUrl } from "@/lib/orders/status";
import type { DeliveryCarrier } from "@/lib/products/types";
import type { ShippingRecord } from "@/lib/shipping/types";

type TrackingCardProps = {
  record: ShippingRecord | null;
  carrier?: string | null;
  trackingNumber?: string | null;
};

export const TrackingCard = memo(function TrackingCard({
  record,
  carrier,
  trackingNumber,
}: TrackingCardProps) {
  const resolvedCarrier = record?.carrier ?? carrier ?? null;
  const resolvedTracking = record?.trackingNumber ?? trackingNumber ?? null;

  if (!resolvedTracking || !resolvedCarrier) return null;

  const trackingUrl = getTrackingUrl(resolvedCarrier as DeliveryCarrier, resolvedTracking);

  return (
    <Card padding="lg" className="flex flex-col gap-ds-3">
      <h2 className="text-base font-semibold text-text-primary">Tracking</h2>
      <dl className="grid gap-ds-2 text-sm">
        {resolvedCarrier ? (
          <div className="flex justify-between gap-ds-3">
            <dt className="text-text-secondary">Carrier</dt>
            <dd className="font-medium text-text-primary">{resolvedCarrier}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-ds-3">
          <dt className="text-text-secondary">Tracking number</dt>
          <dd className="font-medium text-text-primary">{resolvedTracking}</dd>
        </div>
      </dl>
      <a
        href={trackingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold text-primary"
      >
        Open carrier tracking
      </a>
    </Card>
  );
});
