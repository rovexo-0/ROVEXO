"use client";

import { memo } from "react";
import { CanonicalCard } from "@/src/components/canonical";
import { CommerceStatusBadge } from "@/features/commerce-ui/components/CommerceStatusBadge";
import { parcelStatusMeta } from "@/features/commerce-ui/lib/status";
import { shippingStatusLabel } from "@/lib/shipping/status";
import type { ShipmentParcel, ShippingRecord } from "@/lib/shipping/types";

type ShipmentSummaryProps = {
  record: ShippingRecord | null;
  parcels: ShipmentParcel[];
};

export const ShipmentSummary = memo(function ShipmentSummary({
  record,
  parcels,
}: ShipmentSummaryProps) {
  const readyCount = parcels.filter((parcel) => Boolean(parcel.trackingNumber)).length;
  const statusLabel = record ? shippingStatusLabel(record.status) : "Preparing Shipment";

  return (
    <CanonicalCard variant="medium" className="flex w-full flex-col gap-ds-2">
      <div className="flex items-center justify-between gap-ds-3">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Shipment</h2>
          <p className="mt-ds-1 text-sm text-text-secondary">
            {parcels.length === 0
              ? "Create parcels to prepare this order for dispatch."
              : `${parcels.length} parcel${parcels.length === 1 ? "" : "s"} · ${readyCount} with tracking`}
          </p>
        </div>
        <CommerceStatusBadge tone={readyCount > 0 ? "success" : "muted"}>
          {statusLabel}
        </CommerceStatusBadge>
      </div>

      {parcels.length > 0 ? (
        <ul className="divide-y divide-border rounded-ds-md border border-border">
          {parcels.map((parcel) => {
            const status = parcelStatusMeta(
              parcel.trackingNumber ? "in_transit" : "preparing",
            );
            return (
              <li
                key={parcel.id}
                className="flex items-center justify-between gap-ds-2 px-ds-3 py-ds-2 text-sm"
              >
                <span className="font-medium text-text-primary">
                  Parcel {parcel.parcelNumber} of {parcel.totalParcels}
                </span>
                <CommerceStatusBadge tone={status.tone}>{status.label}</CommerceStatusBadge>
              </li>
            );
          })}
        </ul>
      ) : null}
    </CanonicalCard>
  );
});
