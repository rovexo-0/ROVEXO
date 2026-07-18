"use client";

import { CanonicalCard, CanonicalMenuRow } from "@/src/components/canonical";
import { getMessageHref, getTrackingUrl } from "@/lib/orders/status";
import type { Order, OrderViewRole } from "@/lib/orders/types";

type OrderActionsCardProps = {
  order: Order;
  view: OrderViewRole;
  onTrack?: () => void;
};

export function OrderActionsCard({ order, view, onTrack }: OrderActionsCardProps) {
  const messageLabel = view === "buyer" ? "Message seller" : "Message buyer";
  const canTrack =
    Boolean(order.trackingNumber) &&
    (order.status === "shipped" || order.status === "delivered" || order.status === "completed");

  return (
    <CanonicalCard variant="list" className="w-full">
      <CanonicalMenuRow
        title={messageLabel}
        href={getMessageHref(order.id, view)}
      />
      {canTrack && order.trackingNumber ? (
        <CanonicalMenuRow
          title="Track parcel"
          onClick={() => {
            if (onTrack) {
              onTrack();
              return;
            }
            window.open(getTrackingUrl(order.deliveryCarrier, order.trackingNumber!), "_blank", "noopener,noreferrer");
          }}
        />
      ) : null}
    </CanonicalCard>
  );
}
