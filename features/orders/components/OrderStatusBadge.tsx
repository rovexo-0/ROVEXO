import { Badge } from "@/components/ui/Badge";
import {
  ordersV7ToneToBadgeVariant,
  resolveOrdersV7StatusFromStatus,
} from "@/lib/orders/orders-v7-status";
import type { OrderStatus } from "@/lib/orders/types";

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

/** Orders v7.0 status badge — Owner colour lock (green / purple / orange / red / yellow). */
export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const view = resolveOrdersV7StatusFromStatus(status);
  return (
    <Badge
      variant={ordersV7ToneToBadgeVariant(view.tone)}
      className={`orders-status-badge orders-status-badge--${view.tone}`}
      data-orders-tone={view.tone}
    >
      {view.label}
    </Badge>
  );
}
