import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { ChevronRightIcon } from "@/features/dashboard/icons";
import type { DashboardRecentOrder } from "@/features/dashboard/types";

function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

type DashboardRecentOrdersSectionProps = {
  orders: DashboardRecentOrder[];
  viewAllHref: string;
};

function RecentOrderRow({ order }: { order: DashboardRecentOrder }) {
  return (
    <Link href={order.href} className="block">
      <div className="flex min-h-[72px] items-center gap-ds-3 px-ds-4 py-ds-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-ds-md bg-surface-muted">
          <Image
            src={order.productImageUrl}
            alt={order.productTitle}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">{order.productTitle}</p>
          {order.sku && (
            <p className="mt-0.5 truncate text-xs text-text-secondary">SKU: {order.sku}</p>
          )}
          <div className="mt-ds-1 flex flex-wrap items-center gap-ds-2">
            <Price amount={order.price} size="sm" />
            <OrderStatusBadge status={order.status} />
          </div>
          <time dateTime={order.createdAt} className="mt-ds-1 block text-xs text-text-muted">
            {formatOrderDate(order.createdAt)}
          </time>
        </div>

        <ChevronRightIcon className="h-4 w-4 shrink-0 text-text-muted" />
      </div>
    </Link>
  );
}

export function DashboardRecentOrdersSection({
  orders,
  viewAllHref,
}: DashboardRecentOrdersSectionProps) {
  return (
    <section aria-labelledby="dashboard-recent-orders-heading" className="flex flex-col gap-ds-3">
      <h2 id="dashboard-recent-orders-heading" className="text-base font-semibold text-text-primary">
        Recent Orders
      </h2>

      <Card padding="none" className="overflow-hidden shadow-ds-soft">
        {orders.length === 0 ? (
          <p className="px-ds-4 py-ds-6 text-center text-sm text-text-secondary">No recent orders.</p>
        ) : (
          orders.map((order, index) => (
            <div key={order.id} className={index > 0 ? "border-t border-border" : undefined}>
              <RecentOrderRow order={order} />
            </div>
          ))
        )}
      </Card>

      <Link href={viewAllHref} className="block">
        <Button variant="outline" fullWidth size="md" className="min-h-ds-7 rounded-ds-lg">
          View All
        </Button>
      </Link>
    </section>
  );
}
