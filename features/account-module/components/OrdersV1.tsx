"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRightLineIcon } from "@/components/icons/RvxLineIcons";
import { ProductRowImage } from "@/components/ui/ProductRowImage";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { getBuyerOrderListRefundLabel } from "@/lib/orders/refund-status";
import type { Order, OrderStatus } from "@/lib/orders/types";
import { formatCurrency } from "@/lib/wallet/utils";
import { cn } from "@/lib/cn";

type OrderTab = "sold" | "bought";
type StatusFilter = "all" | "in_progress" | "cancelled" | "completed";

const TABS: { id: OrderTab; label: string }[] = [
  { id: "sold", label: "Sold" },
  { id: "bought", label: "Bought" },
];

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in_progress", label: "In Progress" },
  { id: "cancelled", label: "Cancelled" },
  { id: "completed", label: "Completed" },
];

const STATUS_DISPLAY: Record<OrderStatus, string> = {
  awaiting_payment: "Awaiting Payment",
  awaiting_shipment: "Preparing",
  shipped: "Shipped",
  delivered: "Delivered",
  issue_open: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function orderStatusText(order: Order): string {
  const refundLabel = getBuyerOrderListRefundLabel(order);
  if (refundLabel === "Refunded") return "Refunded";
  if (refundLabel === "Refund in progress") return "In Progress";
  if (refundLabel === "Refund failed") return "Refund failed";
  return STATUS_DISPLAY[order.status];
}

function matchesStatusFilter(order: Order, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "cancelled") return order.status === "cancelled";
  if (filter === "completed") return order.status === "completed";
  return order.status !== "cancelled" && order.status !== "completed";
}

function orderDetailHref(order: Order, tab: OrderTab): string {
  return tab === "sold" ? `/seller/orders/${order.id}` : `/orders/${order.id}`;
}

type OrdersV1Props = {
  boughtOrders: Order[];
  soldOrders: Order[];
};

function OrdersCanonicalRow({ order, tab }: { order: Order; tab: OrderTab }) {
  return (
    <Link href={orderDetailHref(order, tab)} className="orders-canonical-row">
      <ProductRowImage
        src={order.product.imageUrl}
        alt={order.product.title}
        containerClassName="orders-canonical-row__image"
        sizes="56px"
      />
      <div className="min-w-0">
        <p className="orders-canonical-row__title">{order.product.title}</p>
        <p className="orders-canonical-row__price">{formatCurrency(order.totals.total)}</p>
        <p className="orders-canonical-row__status">{orderStatusText(order)}</p>
      </div>
      <ChevronRightLineIcon className="orders-canonical-row__chevron" />
    </Link>
  );
}

export function OrdersV1({ boughtOrders, soldOrders }: OrdersV1Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab: OrderTab = searchParams.get("tab") === "bought" ? "bought" : "sold";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const sourceOrders = activeTab === "sold" ? soldOrders : boughtOrders;

  const visibleOrders = useMemo(
    () => sourceOrders.filter((order) => matchesStatusFilter(order, statusFilter)),
    [sourceOrders, statusFilter],
  );

  const switchTab = (tab: OrderTab) => {
    setStatusFilter("all");
    router.push(tab === "sold" ? "/orders" : "/orders?tab=bought");
  };

  return (
    <AccountCanonicalShell title="Orders" showHeaderTitle backHref="/account">
      <div className="flex flex-col gap-ds-2">
        <div className="orders-canonical-tabs" role="tablist" aria-label="Order type">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={cn("orders-canonical-tab", activeTab === tab.id && "orders-canonical-tab--active")}
              onClick={() => switchTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="orders-canonical-filters" role="group" aria-label="Order status">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={cn(
                "orders-canonical-filter",
                statusFilter === filter.id && "orders-canonical-filter--active",
              )}
              aria-pressed={statusFilter === filter.id}
              onClick={() => setStatusFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {visibleOrders.length === 0 ? (
          <p className="orders-canonical-empty">No orders yet.</p>
        ) : (
          <ul className="orders-canonical-list">
            {visibleOrders.map((order, index) => (
              <li key={order.id} className={index > 0 ? "orders-canonical-list__item" : undefined}>
                <OrdersCanonicalRow order={order} tab={activeTab} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </AccountCanonicalShell>
  );
}
