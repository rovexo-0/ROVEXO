import { Card } from "@/components/ui/Card";
import { getTrackingUrl } from "@/lib/orders/status";
import type { Order } from "@/lib/orders/types";

type OrderTrackingCardProps = {
  order: Order;
};

export function OrderTrackingCard({ order }: OrderTrackingCardProps) {
  if (!order.trackingNumber) return null;

  const trackingUrl = getTrackingUrl(order.deliveryCarrier, order.trackingNumber);

  return (
    <Card padding="lg" className="flex flex-col gap-ds-3">
      <h2 className="text-base font-semibold text-text-primary">Tracking</h2>

      <dl className="grid gap-ds-2 text-sm">
        <div className="flex justify-between gap-ds-3">
          <dt className="text-text-secondary">Carrier</dt>
          <dd className="font-medium text-text-primary">{order.deliveryCarrier}</dd>
        </div>
        <div className="flex justify-between gap-ds-3">
          <dt className="text-text-secondary">Tracking number</dt>
          <dd className="font-medium text-text-primary">{order.trackingNumber}</dd>
        </div>
      </dl>

      <a
        href={trackingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold text-primary"
      >
        Open carrier tracking
      </a>
    </Card>
  );
}
