import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { Price } from "@/components/ui/Price";
import { OrderRoleBadge } from "@/features/orders/components/OrderRoleBadge";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { getCounterpartyName } from "@/lib/orders/status";
import { resolveOrderViewRole } from "@/lib/orders/role";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
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
    <OrderProductCardContent
      order={order}
      view={view}
      counterpartyLabel={counterpartyLabel}
      counterpartyName={counterpartyName}
    />
  );
}

type OrderProductCardContentProps = {
  order: Order;
  view: OrderViewRole;
  counterpartyLabel: string;
  counterpartyName: string;
};

/** One Product — order header as Master Menu rows. */
export function OrderProductCardContent({
  order,
  view,
  counterpartyLabel,
  counterpartyName,
}: OrderProductCardContentProps) {
  return (
    <CanonicalSection title="Order">
      <CanonicalCard variant="list">
        <CanonicalMenuRow
          title={order.product.title}
          description={`#${order.orderNumber} · ${counterpartyLabel}: ${counterpartyName}`}
          showChevron={false}
          icon={
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg" aria-hidden>
              <ProductRowImage
                src={order.product.imageUrl}
                alt=""
                containerClassName="relative h-10 w-10"
                sizes="40px"
              />
            </span>
          }
          trailing={
            <span className="flex flex-col items-end gap-1">
              <OrderStatusBadge status={order.status} />
              <OrderRoleBadge role={view} />
              <Price amount={order.totals.total} size="sm" />
            </span>
          }
        />
      </CanonicalCard>
    </CanonicalSection>
  );
}
