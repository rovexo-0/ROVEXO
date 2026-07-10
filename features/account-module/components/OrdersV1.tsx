"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AccountModuleShell } from "@/features/account-module/components/AccountModuleShell";
import { useClientHydrated } from "@/lib/react/use-client-hydrated";
import type { Order, OrderStatus } from "@/lib/orders/types";
import { getBuyerOrderListRefundLabel } from "@/lib/orders/refund-status";
import { formatCurrency } from "@/lib/wallet/utils";

type OrderTab = "all" | "to_pay" | "to_ship" | "shipped" | "delivered";

const TABS: { id: OrderTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "to_pay", label: "To Pay" },
  { id: "to_ship", label: "To Ship" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
];

function mapTabStatus(tab: OrderTab): OrderStatus | null {
  if (tab === "to_pay") return "awaiting_payment";
  if (tab === "to_ship") return "awaiting_shipment";
  if (tab === "shipped") return "shipped";
  if (tab === "delivered") return "delivered";
  return null;
}

function statusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    awaiting_payment: "To Pay",
    awaiting_shipment: "To Ship",
    shipped: "Shipped",
    delivered: "Delivered",
    issue_open: "Issue",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status];
}

function orderListLabel(order: Order): string {
  return getBuyerOrderListRefundLabel(order) ?? statusLabel(order.status);
}

function orderListStatusClass(order: Order): string {
  const refundLabel = getBuyerOrderListRefundLabel(order);
  if (refundLabel === "Refunded") return "acm-badge acm-badge--delivered";
  if (refundLabel === "Refund in progress") return "acm-badge acm-badge--to-pay";
  if (refundLabel === "Refund failed") return "acm-badge acm-badge--draft";
  return statusClass(order.status);
}

function statusClass(status: OrderStatus): string {
  if (status === "awaiting_payment") return "acm-badge acm-badge--to-pay";
  if (status === "awaiting_shipment") return "acm-badge acm-badge--to-ship";
  if (status === "shipped") return "acm-badge acm-badge--shipped";
  if (status === "delivered" || status === "completed") return "acm-badge acm-badge--delivered";
  return "acm-badge acm-badge--draft";
}

function formatOrderDate(value: string, relative: boolean): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  if (!relative) {
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  }
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (date >= startOfToday) return "Today";
  if (date >= startOfYesterday) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

type OrdersV1Props = {
  orders: Order[];
};

export function OrdersV1({ orders }: OrdersV1Props) {
  const searchParams = useSearchParams();
  const hydrated = useClientHydrated();
  const activeTab = (searchParams.get("tab") as OrderTab | null) ?? "all";

  const visibleOrders = useMemo(() => {
    const status = mapTabStatus(activeTab);
    if (!status) return orders;
    if (activeTab === "delivered") {
      return orders.filter((order) => order.status === "delivered" || order.status === "completed");
    }
    return orders.filter((order) => order.status === status);
  }, [activeTab, orders]);

  return (
    <AccountModuleShell title="Orders" backHref="/account" version="v1.0">
      <div className="acm-tabs" role="tablist" aria-label="Order filters" data-orders-version="v1.0">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.id === "all" ? "/orders" : `/orders?tab=${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "acm-tabs__tab acm-tabs__tab--active" : "acm-tabs__tab"}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {visibleOrders.length === 0 ? (
        <div className="acm-empty">
          <p className="acm-empty__title">No orders yet</p>
          <p className="acm-empty__text">Your purchases and sales will appear here.</p>
        </div>
      ) : (
        <div>
          {visibleOrders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="acm-order">
              <div className="acm-order__top">
                <span className="acm-order__number">Order #{order.orderNumber}</span>
                <time className="acm-order__date" dateTime={order.createdAt}>
                  {formatOrderDate(order.createdAt, hydrated)}
                </time>
              </div>
              <div className="acm-order__body">
                <div className="acm-order__thumb">
                  <SafeImage src={order.product.imageUrl} alt="" fill sizes="56px" className="object-cover" />
                </div>
                <div className="acm-order__info">
                  <p className="acm-order__title">{order.product.title}</p>
                  <p className="acm-order__price">{formatCurrency(order.totals.total)}</p>
                </div>
                <span className={`acm-order__status ${orderListStatusClass(order)}`}>
                  {orderListLabel(order)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AccountModuleShell>
  );
}
