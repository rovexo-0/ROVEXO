import { Badge } from "@/components/ui/Badge";
import { getOrderStatusLabel, getStatusBadgeVariant } from "@/lib/orders/status";
import type { OrderStatus } from "@/lib/orders/types";

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <Badge variant={getStatusBadgeVariant(status)}>{getOrderStatusLabel(status)}</Badge>
  );
}
