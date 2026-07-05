"use client";

import { memo } from "react";
import { Card } from "@/components/ui/Card";
import { parcelTierLabel } from "@/lib/shipping";
import type { ShippingRecord } from "@/lib/shipping/types";

type ParcelCardProps = {
  record: ShippingRecord | null;
  legacyLabel?: string | null;
};

export const ParcelCard = memo(function ParcelCard({ record, legacyLabel }: ParcelCardProps) {
  const tier = record?.parcelTier;
  const label = tier ? parcelTierLabel(tier) : legacyLabel;

  if (!label) return null;

  return (
    <Card padding="lg" className="flex flex-col gap-ds-2">
      <h2 className="text-base font-semibold text-text-primary">Parcel</h2>
      <p className="text-sm font-medium text-text-primary">{label}</p>
      {record?.pricing?.quotes[0] ? (
        <p className="text-xs text-text-secondary">
          {record.pricing.quotes[0].serviceName} · {record.pricing.quotes[0].carrier}
        </p>
      ) : null}
    </Card>
  );
});
