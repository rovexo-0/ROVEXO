import { safeRandomUUID } from "@/lib/uuid";
import { shippingStatusLabel } from "@/lib/shipping/status";
import type { ShippingStatus, ShippingTrackingEvent } from "@/lib/shipping/types";

export type TrackingTimelineItem = ShippingTrackingEvent & {
  current: boolean;
  done: boolean;
};

const STATUS_ORDER: ShippingStatus[] = [
  "preparing",
  "collected",
  "in_transit",
  "out_for_delivery",
  "delivered",
];

export function buildTrackingTimeline(
  events: ShippingTrackingEvent[],
  currentStatus: ShippingStatus,
): TrackingTimelineItem[] {
  const sorted = [...events].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );

  const eventByStatus = new Map<ShippingStatus, ShippingTrackingEvent>();
  for (const event of sorted) {
    eventByStatus.set(event.status, event);
  }

  const terminal = ["returned", "cancelled", "lost", "failed"] as const;
  if ((terminal as readonly string[]).includes(currentStatus)) {
    const terminalEvent = eventByStatus.get(currentStatus) ?? sorted[sorted.length - 1];
    if (terminalEvent) {
      return [
        {
          ...terminalEvent,
          title: terminalEvent.title || shippingStatusLabel(currentStatus),
          current: true,
          done: true,
        },
      ];
    }
  }

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  return STATUS_ORDER.map((status, index) => {
    const event = eventByStatus.get(status);
    const done = index <= currentIndex;
    return {
      id: event?.id ?? status,
      status,
      title: event?.title ?? shippingStatusLabel(status),
      description: event?.description,
      location: event?.location,
      occurredAt: event?.occurredAt ?? "",
      source: event?.source ?? "system",
      current: status === currentStatus,
      done,
    };
  });
}

export function createTrackingEvent(input: {
  status: ShippingStatus;
  title?: string;
  description?: string;
  location?: string;
  occurredAt?: string;
  source?: ShippingTrackingEvent["source"];
}): ShippingTrackingEvent {
  return {
    id: safeRandomUUID(),
    status: input.status,
    title: input.title ?? shippingStatusLabel(input.status),
    description: input.description,
    location: input.location,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    source: input.source ?? "system",
  };
}
