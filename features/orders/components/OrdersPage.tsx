"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { CanonicalCard, CanonicalMenuRow } from "@/src/components/canonical";
import { cn } from "@/lib/cn";
import type { Order } from "@/lib/orders/types";
import "@/styles/rovexo/orders-page-v1.css";

type Tab = "sold" | "bought";
type Chip = "all" | "in_progress" | "completed" | "cancelled";

export type OrdersPageProps = {
  boughtOrders: Order[];
  soldOrders: Order[];
};

const TABS: { id: Tab; label: string }[] = [
  { id: "sold", label: "Sold" },
  { id: "bought", label: "Bought" },
];

const CHIPS: { id: Chip; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

function matchesChip(order: Order, chip: Chip): boolean {
  if (chip === "all") return true;
  if (chip === "cancelled") return order.status === "cancelled";
  if (chip === "completed") {
    return order.status === "completed" || order.status === "delivered";
  }
  return (
    order.status !== "cancelled" &&
    order.status !== "completed" &&
    order.status !== "delivered"
  );
}

function detailHref(order: Order, tab: Tab): string {
  return tab === "sold" ? `/seller/orders/${order.id}` : `/orders/${order.id}`;
}

function statusLabel(status: Order["status"]): string {
  if (status === "awaiting_payment") return "Awaiting payment";
  if (status === "awaiting_shipment") return "Preparing shipment";
  if (status === "issue_open") return "Issue open";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function OrdersPageSkeleton() {
  return (
    <div className="orders-page" aria-busy="true" aria-label="Loading orders">
      <div className="orders-page__tabs">
        <div className="orders-page__skel orders-page__skel--tab" />
        <div className="orders-page__skel orders-page__skel--tab" />
      </div>
      <div className="orders-page__chips">
        <div className="orders-page__skel orders-page__skel--chip" />
        <div className="orders-page__skel orders-page__skel--chip" />
        <div className="orders-page__skel orders-page__skel--chip" />
        <div className="orders-page__skel orders-page__skel--chip" />
      </div>
      <div className="orders-page__skel orders-page__skel--empty" />
    </div>
  );
}

/** ROVEXO Orders v1.1 — compact canonical density (My Account parity). */
export function OrdersPage({ boughtOrders, soldOrders }: OrdersPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "bought" ? "bought" : "sold";
  const statusParam = searchParams.get("status");
  const chip: Chip =
    statusParam === "in_progress" ||
    statusParam === "completed" ||
    statusParam === "cancelled"
      ? statusParam
      : "all";

  const orders = tab === "sold" ? soldOrders : boughtOrders;
  const visible = useMemo(
    () =>
      orders
        .filter((order) => matchesChip(order, chip))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [orders, chip],
  );

  const setTab = (next: Tab) => {
    router.push(next === "sold" ? "/orders" : "/orders?tab=bought");
  };

  const setChip = (next: Chip) => {
    const params = new URLSearchParams();
    if (tab === "bought") params.set("tab", "bought");
    if (next !== "all") params.set("status", next);
    const qs = params.toString();
    router.push(qs ? `/orders?${qs}` : "/orders");
  };

  return (
    <AccountCanonicalShell title="Orders" backHref="/account" backLabel="My Account" showHeaderTitle>
      <div
        className="orders-page"
        data-orders-page="v1.1"
        data-orders-ui="header-simplified"
        data-orders-freeze="v1.0-certified"
      >
        <div className="orders-page__tabs" role="tablist" aria-label="Order type">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={cn("orders-page__tab", tab === item.id && "orders-page__tab--on")}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="orders-page__chips" role="group" aria-label="Filter by status">
          {CHIPS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn("orders-page__chip", chip === item.id && "orders-page__chip--on")}
              aria-pressed={chip === item.id}
              onClick={() => setChip(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="orders-page__empty">
            <p className="orders-page__empty-title">No orders yet.</p>
            <p className="orders-page__empty-sub">
              {tab === "sold" ? "Sold items appear here." : "Purchases appear here."}
            </p>
            <Link
              href={tab === "sold" ? "/sell" : "/search"}
              className="orders-page__empty-cta"
            >
              {tab === "sold" ? "Start selling" : "Browse items"}
            </Link>
          </div>
        ) : (
          <CanonicalCard variant="list" className="orders-page__list">
            {visible.map((order) => (
              <CanonicalMenuRow
                key={order.id}
                href={detailHref(order, tab)}
                title={order.product.title}
                description={order.orderNumber}
                value={statusLabel(order.status)}
                className={cn(
                  "orders-page__row",
                  order.status === "cancelled" && "orders-page__row--cancelled",
                )}
              />
            ))}
          </CanonicalCard>
        )}
      </div>
    </AccountCanonicalShell>
  );
}
