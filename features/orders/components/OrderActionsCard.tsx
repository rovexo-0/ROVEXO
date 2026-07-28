"use client";

import { CanonicalCard, CanonicalMenuRow } from "@/src/components/canonical";
import { getMessageHref, getOrderHubTrackHref, getTrackingUrl } from "@/lib/orders/status";
import type { Order, OrderViewRole } from "@/lib/orders/types";

type OrderActionsCardProps = {
  order: Order;
  view: OrderViewRole;
  onTrack?: () => void;
};

/**
 * Reduced Order Details actions (DEFECT #002 / #003).
 * Messages Hub = SSOT. Order Details deep-links into the Hub.
 */
export function OrderActionsCard({ order, view, onTrack }: OrderActionsCardProps) {
  const canTrack =
    Boolean(order.trackingNumber) &&
    (order.status === "shipped" || order.status === "delivered" || order.status === "completed");

  return (
    <CanonicalCard variant="list" className="w-full">
      <CanonicalMenuRow title="Open Messages Hub" href={getMessageHref(order.id, view)} />
      {canTrack && order.trackingNumber ? (
        <CanonicalMenuRow
          title="Track in Messages Hub"
          href={getOrderHubTrackHref(order.id)}
          onClick={() => {
            onTrack?.();
          }}
        />
      ) : null}
      {canTrack && order.trackingNumber ? (
        <CanonicalMenuRow
          title="Carrier tracking (external)"
          onClick={() => {
            window.open(
              getTrackingUrl(order.deliveryCarrier, order.trackingNumber!),
              "_blank",
              "noopener,noreferrer",
            );
          }}
        />
      ) : null}
    </CanonicalCard>
  );
}
