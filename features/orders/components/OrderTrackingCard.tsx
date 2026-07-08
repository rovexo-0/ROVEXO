import { TrackingCard } from "@/features/shipping/components/TrackingCard";
import type { Order } from "@/lib/orders/types";

type OrderTrackingCardProps = {
  order: Order;
};

/** @deprecated Use TrackingCard from features/shipping/components — kept for zero regression. */
export function OrderTrackingCard({ order }: OrderTrackingCardProps) {
  if (!order.trackingNumber) return null;

  return (
    <TrackingCard
      record={null}
      carrier={order.deliveryCarrier}
      trackingNumber={order.trackingNumber}
      orderId={order.id}
    />
  );
}
