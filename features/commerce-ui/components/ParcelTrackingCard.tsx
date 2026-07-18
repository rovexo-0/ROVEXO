"use client";

import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { AccountIcon } from "@/components/account/AccountIcons";
import { ParcelProductsList } from "@/features/commerce-ui/components/ParcelProductsList";
import { parcelStatusMeta } from "@/features/commerce-ui/lib/status";
import type { CommerceParcel } from "@/features/commerce-ui/types";

type ParcelTrackingCardProps = {
  parcel: CommerceParcel;
  orderId?: string;
  showOperations?: boolean;
  className?: string;
};

/**
 * Parcel tracking — Absolute Final.
 * Status · courier · parcel info · delivery updates only.
 */
export function ParcelTrackingCard({ parcel, className }: ParcelTrackingCardProps) {
  const status = parcelStatusMeta(parcel.status);

  return (
    <div className={className}>
      <CanonicalSection title={`Parcel ${parcel.index} of ${parcel.totalParcels}`}>
        <CanonicalCard variant="list">
          <CanonicalMenuRow
            title="Tracking status"
            value={status.label}
            showChevron={false}
            icon={
              <span className="ac-canonical__menu-icon" aria-hidden>
                <AccountIcon name="shipping" />
              </span>
            }
          />
          <CanonicalMenuRow title="Courier" value={parcel.carrier} showChevron={false} />
          {parcel.trackingNumber ? (
            <CanonicalMenuRow
              title="Tracking number"
              description={parcel.trackingNumber}
              showChevron={false}
            />
          ) : null}
          <CanonicalMenuRow
            title="Delivery"
            value={parcel.estimatedDelivery ?? "TBC"}
            showChevron={false}
          />
          {parcel.trackingUrl ? (
            <CanonicalMenuRow title="Delivery updates" href={parcel.trackingUrl} />
          ) : null}
        </CanonicalCard>
        {parcel.items?.length ? (
          <div className="mt-ds-3 px-ds-1">
            <ParcelProductsList items={parcel.items} />
          </div>
        ) : null}
        {parcel.timeline && parcel.timeline.length > 0 ? (
          <CanonicalCard variant="list" className="mt-ds-3">
            {parcel.timeline.slice(0, 6).map((event) => (
              <CanonicalMenuRow
                key={event.id}
                title={event.title}
                description={
                  event.occurredAt
                    ? new Date(event.occurredAt).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : event.description ?? undefined
                }
                showChevron={false}
              />
            ))}
          </CanonicalCard>
        ) : null}
      </CanonicalSection>
    </div>
  );
}
