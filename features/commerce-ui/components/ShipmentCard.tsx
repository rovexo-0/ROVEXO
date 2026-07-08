import Link from "next/link";
import { ChevronRight, Truck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import type { CommerceParcel } from "@/features/commerce-ui/types";

type ShipmentCardProps = {
  /** Number of parcels the seller created after payment. */
  parcelCount: number;
  /** True once carrier labels exist and tracking is available. */
  ready: boolean;
  href: string;
  parcels?: CommerceParcel[];
  className?: string;
};

/**
 * Canonical reusable Shipment entry for Order Details.
 *
 * Never exposes label count or "Label 1/2" — only "Parcel X of Y". Before
 * labels exist it reads "Preparing Shipment"; once ready it lists each parcel
 * and links through to per-parcel tracking.
 */
export function ShipmentCard({
  parcelCount,
  ready,
  href,
  parcels = [],
  className,
}: ShipmentCardProps) {
  const helper = ready
    ? "Track every parcel independently."
    : "Tracking information will be available once the seller ships your order.";

  return (
    <Card padding="none" className={cn("overflow-hidden", className)}>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-ds-3 p-ds-4 hover:bg-surface-muted/60",
          focusRing,
          transitionFast,
        )}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ds-full bg-primary/10 text-primary">
          <Truck className="h-5 w-5" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary">Shipment</p>
          {!ready ? (
            <p className="mt-ds-1 text-xs font-medium text-text-secondary">Preparing Shipment</p>
          ) : null}
          <p className="mt-ds-1 text-xs text-text-secondary">{helper}</p>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-text-muted" aria-hidden />
      </Link>

      {ready && parcels.length > 0 ? (
        <ul className="divide-y divide-border border-t border-border">
          {parcels.map((parcel) => (
            <li key={`${parcel.index}-${parcel.trackingNumber ?? "pending"}`}>
              <Link
                href={href}
                className={cn(
                  "flex items-center justify-between gap-ds-3 px-ds-4 py-ds-3 text-sm hover:bg-surface-muted/60",
                  focusRing,
                  transitionFast,
                )}
              >
                <span className="font-medium text-text-primary">
                  Parcel {parcel.index} of {parcel.totalParcels}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      ) : ready && parcelCount > 0 ? (
        <ul className="divide-y divide-border border-t border-border">
          {Array.from({ length: parcelCount }, (_, index) => (
            <li key={`parcel-${index + 1}`}>
              <Link
                href={href}
                className={cn(
                  "flex items-center justify-between gap-ds-3 px-ds-4 py-ds-3 text-sm hover:bg-surface-muted/60",
                  focusRing,
                  transitionFast,
                )}
              >
                <span className="font-medium text-text-primary">
                  Parcel {index + 1} of {parcelCount}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
