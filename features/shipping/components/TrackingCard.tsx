"use client";

import { memo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getTrackingUrl } from "@/lib/orders/status";
import type { DeliveryCarrier } from "@/lib/products/types";
import type { ShippingRecord } from "@/lib/shipping/types";

type TrackingCardProps = {
  record: ShippingRecord | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  orderId?: string;
};

export const TrackingCard = memo(function TrackingCard({
  record,
  carrier,
  trackingNumber,
  orderId,
}: TrackingCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const resolvedCarrier = record?.carrier ?? carrier ?? null;
  const resolvedTracking = record?.trackingNumber ?? trackingNumber ?? null;

  if (!resolvedTracking || !resolvedCarrier) return null;

  const trackingUrl = getTrackingUrl(resolvedCarrier as DeliveryCarrier, resolvedTracking);

  async function refreshParcel2GoTracking() {
    if (!orderId) return;
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const params = new URLSearchParams({
        orderId,
        trackingNumber: resolvedTracking ?? "",
      });
      const response = await fetch(`/api/shipping/parcel2go/tracking?${params.toString()}`);
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to refresh tracking.");
      }
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "Unable to refresh tracking.");
    } finally {
      setIsRefreshing(false);
    }
  }

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
      {refreshError ? <p className="text-sm text-danger">{refreshError}</p> : null}
      <div className="flex flex-col gap-ds-2">
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-primary"
        >
          Open carrier tracking
        </a>
        {orderId ? (
          <Button variant="secondary" fullWidth disabled={isRefreshing} onClick={() => void refreshParcel2GoTracking()}>
            {isRefreshing ? "Refreshing…" : "Refresh Parcel2Go tracking"}
          </Button>
        ) : null}
      </div>
    </Card>
  );
});
