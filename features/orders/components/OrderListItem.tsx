"use client";

import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { OrderRoleBadge } from "@/features/orders/components/OrderRoleBadge";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { getCounterpartyName, getOrderDetailHref } from "@/lib/orders/status";
import { resolveOrderViewRole } from "@/lib/orders/role";
import type { Order } from "@/lib/orders/types";

type OrderListItemProps = {
  order: Order;
  userId: string;
};

export function OrderListItem({ order, userId }: OrderListItemProps) {
  const view = resolveOrderViewRole(order, userId);
  if (!view) return null;

  const counterpartyLabel = view === "buyer" ? "Seller" : "Buyer";
  const counterpartyName = getCounterpartyName(order, view);

  return (
    <Link href={getOrderDetailHref(order.id, view)} className="block">
      <Card padding="none" interactive className="overflow-hidden">
        <div className="flex gap-ds-4 p-ds-4">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted">
            <Image
              src={order.product.imageUrl}
              alt={order.product.title}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-ds-2">
              <p className="text-xs font-medium text-text-secondary">#{order.orderNumber}</p>
              <OrderStatusBadge status={order.status} />
            </div>

            <OrderRoleBadge role={view} className="mt-ds-2" />

            <h2 className="mt-ds-1 line-clamp-2 text-sm font-semibold text-text-primary">
              {order.product.title}
            </h2>

            <p className="mt-ds-1 text-xs text-text-secondary">
              {counterpartyLabel}: {counterpartyName}
            </p>

            {view === "seller" && order.status === "issue_open" ? (
              <p className="mt-ds-2 rounded-ds-md bg-danger/10 px-ds-2 py-ds-1 text-xs font-medium text-danger">
                Buyer reported an issue — review in Resolution Centre
              </p>
            ) : null}

            {view === "seller" && order.status === "cancelled" ? (
              <p className="mt-ds-2 text-xs font-medium text-text-secondary">
                Order cancelled
              </p>
            ) : null}

            <Price amount={order.totals.total} size="sm" className="mt-ds-2" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
