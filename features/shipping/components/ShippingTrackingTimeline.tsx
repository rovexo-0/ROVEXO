"use client";

import { memo } from "react";
import { cn } from "@/lib/cn";
import type { TrackingTimelineItem } from "@/lib/shipping/tracking";

type ShippingTrackingTimelineProps = {
  items: TrackingTimelineItem[];
};

export const ShippingTrackingTimeline = memo(function ShippingTrackingTimeline({
  items,
}: ShippingTrackingTimelineProps) {
  if (items.length === 0) return null;

  return (
    <ol className="flex flex-col gap-ds-3" aria-label="Shipping timeline">
      {items.map((item) => (
        <li key={item.id} className="flex gap-ds-3">
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
});
