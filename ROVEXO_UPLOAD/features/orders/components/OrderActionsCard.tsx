"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getMessageHref, getTrackingUrl } from "@/lib/orders/status";
import type { Order, OrderViewRole } from "@/lib/orders/types";

type OrderActionsCardProps = {
  order: Order;
  view: OrderViewRole;
  onTrack?: () => void;
};

export function OrderActionsCard({ order, view, onTrack }: OrderActionsCardProps) {
  const messageLabel = view === "buyer" ? "Message Seller" : "Message Buyer";
  const canTrack =
    Boolean(order.trackingNumber) &&
    (order.status === "shipped" || order.status === "delivered" || order.status === "completed");

  return (
    <Card padding="lg" className="flex flex-col gap-ds-3">
      <h2 className="text-base font-semibold text-text-primary">Actions</h2>

      <Link href={getMessageHref(order.id, view)} className="block w-full">
        <Button variant="outline" fullWidth size="lg" className="min-h-[52px] rounded-ds-lg text-base">
          {messageLabel}
        </Button>
      </Link>

      {canTrack && order.trackingNumber && (
        <Button
          variant="secondary"
          fullWidth
          size="lg"
          className="min-h-[52px] rounded-ds-lg text-base"
          onClick={() => {
            if (onTrack) {
              onTrack();
              return;
            }

            window.open(getTrackingUrl(order.deliveryCarrier, order.trackingNumber!), "_blank", "noopener,noreferrer");
          }}
        >
          Track Parcel
        </Button>
      )}
    </Card>
  );
}
