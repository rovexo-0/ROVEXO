"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CanonicalCard } from "@/src/components/canonical";
import { buttonSizes, buttonVariants } from "@/components/ui/variants";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import { CommerceStatusBadge } from "@/features/commerce-ui/components/CommerceStatusBadge";
import { ParcelProductsList } from "@/features/commerce-ui/components/ParcelProductsList";
import { ParcelOperations } from "@/features/commerce-ui/components/ParcelOperations";
import { parcelStatusMeta } from "@/features/commerce-ui/lib/status";
import type { CommerceParcel, CommerceParcelTimelineEvent } from "@/features/commerce-ui/types";

type ParcelTrackingCardProps = {
  parcel: CommerceParcel;
  orderId?: string;
  showOperations?: boolean;
  className?: string;
};

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}

function ParcelTimeline({ items }: { items: CommerceParcelTimelineEvent[] }) {
  if (items.length === 0) return null;

  return (
    <ol className="flex flex-col gap-ds-2" aria-label="Parcel timeline">
      {items.map((item) => (
        <li key={item.id} className="flex gap-ds-2">
          <span
            className={cn(
              "mt-1 h-3 w-3 shrink-0 rounded-full border-2",
              item.current
                ? "border-primary bg-primary"
                : item.done
                  ? "border-primary bg-primary/20"
                  : "border-border bg-surface",
            )}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-sm font-medium",
                item.current ? "text-primary" : item.done ? "text-text-primary" : "text-text-secondary",
              )}
            >
              {item.title}
            </p>
            {item.occurredAt ? (
              <p className="text-xs text-text-muted">
                {new Date(item.occurredAt).toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            ) : null}
            {item.description ? (
              <p className="mt-0.5 text-xs text-text-secondary">{item.description}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * Canonical reusable Parcel card for the Tracking screen. One card per parcel,
 * always titled "Parcel X of Y" so the buyer understands one order can arrive as
 * multiple independently tracked parcels.
 */
export function ParcelTrackingCard({
  parcel,
  orderId,
  showOperations = false,
  className,
}: ParcelTrackingCardProps) {
  const [copied, setCopied] = useState(false);
  const status = parcelStatusMeta(parcel.status);

  async function copyTracking() {
    if (!parcel.trackingNumber) return;
    try {
      await navigator.clipboard.writeText(parcel.trackingNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable — silently ignore, value is still visible.
    }
  }

  return (
    <CanonicalCard variant="medium" className={cn("flex w-full flex-col gap-ds-2", className)}>
      <div className="flex items-center gap-ds-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ds-full bg-primary/10 text-primary">
          <Truck className="h-4 w-4" aria-hidden />
        </span>
        <p className="flex-1 text-sm font-semibold text-text-primary">
          Parcel {parcel.index} of {parcel.totalParcels}
        </p>
        <CommerceStatusBadge tone={status.tone}>{status.label}</CommerceStatusBadge>
      </div>

      <ParcelProductsList items={parcel.items} />

      {parcel.trackingNumber ? (
        <div>
          <p className="text-xs text-text-muted">Tracking number</p>
          <div className="mt-0.5 flex items-center gap-ds-2">
            <span className="truncate font-mono text-sm font-medium text-text-primary">
              {parcel.trackingNumber}
            </span>
            <button
              type="button"
              onClick={copyTracking}
              aria-label="Copy tracking number"
              className={cn(
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-ds-md text-text-muted hover:bg-surface-muted hover:text-text-primary",
                focusRing,
                transitionFast,
              )}
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-ds-2">
        <DetailBlock label="Carrier" value={parcel.carrier} />
        <DetailBlock
          label="Est. delivery"
          value={parcel.estimatedDelivery ?? "TBC"}
        />
      </div>

      {parcel.timeline && parcel.timeline.length > 0 ? (
        <div className="border-t border-border pt-ds-2">
          <p className="mb-ds-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Timeline
          </p>
          <ParcelTimeline items={parcel.timeline} />
        </div>
      ) : null}

      {parcel.trackingUrl ? (
        <Link
          href={parcel.trackingUrl}
          className={cn(
            "inline-flex w-full items-center justify-center",
            buttonVariants.outline,
            buttonSizes.md,
          )}
        >
          View tracking
        </Link>
      ) : (
        <Button variant="outline" fullWidth disabled={parcel.status === "preparing"}>
          View tracking
        </Button>
      )}

      {showOperations && orderId ? (
        <ParcelOperations
          orderId={orderId}
          parcelId={parcel.id}
          activeOperation={parcel.operation}
        />
      ) : null}
    </CanonicalCard>
  );
}
