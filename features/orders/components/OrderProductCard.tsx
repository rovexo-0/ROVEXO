import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { OrderRoleBadge } from "@/features/orders/components/OrderRoleBadge";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { getCounterpartyName } from "@/lib/orders/status";
import { resolveOrderViewRole } from "@/lib/orders/role";
import type { Order, OrderViewRole } from "@/lib/orders/types";

type OrderProductCardProps = {
  order: Order;
  userId: string;
};

export function OrderProductCard({ order, userId }: OrderProductCardProps) {
  const view = resolveOrderViewRole(order, userId);
  if (!view) return null;

  const counterpartyLabel = view === "buyer" ? "Seller" : "Buyer";
  const counterpartyName = getCounterpartyName(order, view);

  return (
    <OrderProductCardContent order={order} view={view} counterpartyLabel={counterpartyLabel} counterpartyName={counterpartyName} />
  );
}

type OrderProductCardContentProps = {
  order: Order;
  view: OrderViewRole;
  counterpartyLabel: string;
  counterpartyName: string;
};

export function OrderProductCardContent({
  order,
  view,
  counterpartyLabel,
  counterpartyName,
}: OrderProductCardContentProps) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex gap-ds-4 p-ds-4">
        <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted">
          <Image
            src={order.product.imageUrl}
            alt={order.product.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-ds-2">
            <p className="text-xs font-medium text-text-secondary">#{order.orderNumber}</p>
            <OrderStatusBadge status={order.status} />
          </div>

          <OrderRoleBadge role={view} className="mt-ds-2" />

          <h1 className="mt-ds-1 line-clamp-2 text-base font-semibold text-text-primary">
            {order.product.title}
          </h1>

          <p className="mt-ds-1 text-sm text-text-secondary">
            {counterpartyLabel}: {counterpartyName}
          </p>

          <Price amount={order.totals.total} size="md" className="mt-ds-2" />
        </div>
      </div>
    </Card>
  );
}
