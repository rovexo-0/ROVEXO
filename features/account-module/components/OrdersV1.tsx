"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AccountModuleShell } from "@/features/account-module/components/AccountModuleShell";
import type { Order, OrderStatus } from "@/lib/orders/types";
import { getBuyerOrderListRefundLabel } from "@/lib/orders/refund-status";
import { formatCurrency } from "@/lib/wallet/utils";

type OrderTab = "bought" | "sold";

const TABS: { id: OrderTab; label: string }[] = [
  { id: "bought", label: "Bought" },
  { id: "sold", label: "Sold" },
];

function statusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    awaiting_payment: "Awaiting payment",
    awaiting_shipment: "Awaiting shipment",
    shipped: "Shipped",
    delivered: "Delivered",
    issue_open: "Issue open",
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

function trackingStatus(order: Order): string {
  if (order.trackingNumber) {
    if (order.status === "delivered" || order.status === "completed") return "Delivered";
    if (order.status === "shipped") return "In transit";
    return "Tracking added";
  }
  if (order.status === "awaiting_shipment") return "Awaiting tracking";
  if (order.status === "awaiting_payment") return "Awaiting payment";
  if (order.status === "shipped") return "In transit";
  if (order.status === "delivered" || order.status === "completed") return "Delivered";
  if (order.status === "cancelled") return "Cancelled";
  return "—";
}

function orderDetailHref(order: Order, tab: OrderTab): string {
  return tab === "sold" ? `/seller/orders/${order.id}` : `/orders/${order.id}`;
}

type OrdersV1Props = {
  boughtOrders: Order[];
  soldOrders: Order[];
};

export function OrdersV1({ boughtOrders, soldOrders }: OrdersV1Props) {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as OrderTab | null) ?? "bought";

  const visibleOrders = useMemo(
    () => (activeTab === "sold" ? soldOrders : boughtOrders),
    [activeTab, boughtOrders, soldOrders],
  );

  return (
    <AccountModuleShell title="Orders" backHref="/account" version="v1.0">
      <div className="acm-tabs" role="tablist" aria-label="Order filters" data-orders-version="v1.0">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.id === "bought" ? "/orders" : `/orders?tab=${tab.id}`}
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
        <ul className="acm-list">
          {visibleOrders.map((order) => (
            <li key={order.id} className="acm-list__item">
              <div className="acm-order-card">
                <div className="acm-order-card__thumb">
                  <SafeImage src={order.product.imageUrl} alt="" fill sizes="56px" className="object-cover" />
                </div>
                <div className="acm-order-card__body">
                  <p className="acm-order-card__title">{order.product.title}</p>
                  <p className="acm-order-card__price">{formatCurrency(order.totals.total)}</p>
                  <div className="acm-order-card__status-row">
                    <span className={orderListStatusClass(order)}>{orderListLabel(order)}</span>
                    <span className="acm-order-card__tracking">{trackingStatus(order)}</span>
                  </div>
                </div>
                <Link href={orderDetailHref(order, activeTab)} className="acm-order-card__open">
                  Open
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AccountModuleShell>
  );
}
