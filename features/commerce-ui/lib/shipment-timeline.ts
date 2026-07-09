import type { CommerceParcelTimelineEvent } from "@/features/commerce-ui/types";
import { shipmentStatusLabel } from "@/features/commerce-ui/lib/status";
import type { ShipmentStatus } from "@/lib/commerce/types";

/** Canonical shipment timeline steps — fixed order for all parcels. */
export const CANONICAL_TIMELINE_STATUSES = [
  "order_confirmed",
  "preparing_shipment",
  "labels_created",
  "collected",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "returned",
] as const satisfies readonly ShipmentStatus[];

export type CanonicalTimelineStatus = (typeof CANONICAL_TIMELINE_STATUSES)[number];

const STATUS_RANK: Record<CanonicalTimelineStatus, number> = {
  order_confirmed: 0,
  preparing_shipment: 1,
  labels_created: 2,
  collected: 3,
  in_transit: 4,
  out_for_delivery: 5,
  delivered: 6,
  returned: 7,
};

function rankForStatus(status: ShipmentStatus): number {
  if (status === "returned") return STATUS_RANK.returned;
  if (status === "delivered" || status === "claim_resolved") return STATUS_RANK.delivered;
  if (status === "out_for_delivery") return STATUS_RANK.out_for_delivery;
  if (status === "in_transit" || status === "collected") {
    return STATUS_RANK[status];
  }
  if (status === "labels_created") return STATUS_RANK.labels_created;
  if (status === "preparing_shipment" || status === "order_confirmed") {
    return STATUS_RANK[status];
  }
  // Exception states keep the last reached logistics step visible.
  if (status === "lost" || status === "damaged" || status === "claim_open" || status === "cancelled") {
    return STATUS_RANK.in_transit;
  }
  return STATUS_RANK.preparing_shipment;
}

type BuildTimelineInput = {
  currentStatus: ShipmentStatus;
  parcelId: string;
  /** ISO timestamps keyed by canonical step when known. */
  occurredAtByStep?: Partial<Record<CanonicalTimelineStatus, string>>;
  fallbackOccurredAt?: string;
};

/**
 * Builds the canonical eight-step shipment timeline for buyer tracking.
 * Steps never vary per carrier — only completion state changes.
 */
export function buildCanonicalShipmentTimeline(
  input: BuildTimelineInput,
): CommerceParcelTimelineEvent[] {
  const currentRank = rankForStatus(input.currentStatus);
  const showReturned = input.currentStatus === "returned";

  const steps = CANONICAL_TIMELINE_STATUSES.filter(
    (step) => step !== "returned" || showReturned,
  );

  return steps.map((step) => {
    const stepRank = STATUS_RANK[step];
    const done = stepRank < currentRank || (stepRank === currentRank && step !== "returned");
    const current = stepRank === currentRank && input.currentStatus !== "returned"
      ? true
      : input.currentStatus === "returned" && step === "returned";

    return {
      id: `${input.parcelId}-${step}`,
      title: shipmentStatusLabel(step),
      occurredAt:
        input.occurredAtByStep?.[step] ??
        (done || current ? (input.fallbackOccurredAt ?? "") : ""),
      current,
      done: done || (input.currentStatus === "returned" && step === "returned"),
    };
  });
}
