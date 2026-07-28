"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { CanonicalCard, CanonicalMenuRow, PrimaryButtonLink } from "@/src/components/canonical";
import { cn } from "@/lib/cn";
import {
  ORDERS_UI_DOM,
  ORDERS_UI_VERSION,
  resolveOrdersV7Status,
} from "@/lib/orders/orders-v7-status";
import { getMessageHref } from "@/lib/orders/status";
import { SUPREME_BLOOD_CODE_XII_V1 } from "@/lib/supreme-blood-code-xii-v1";
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

/**
 * Owner nav adaptation (COD SÂNGE): Bought → Messages Hub (order context preload).
 * Sold → seller Order Details unchanged. Messages Hub UI untouched.
 */
function detailHref(order: Order, tab: Tab): string {
  return tab === "sold"
    ? `/seller/orders/${order.id}`
    : getMessageHref(order.id, "buyer");
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

/** ROVEXO Orders v7.0 — Profile Master + Full Width + Owner status colours. */
function resolveOrdersTab(
  tabParam: string | null,
  boughtCount: number,
  soldCount: number,
): Tab {
  if (tabParam === "bought") return "bought";
  if (tabParam === "sold") return "sold";
  // Buyer with purchases only: never land on empty Sold (Blood XII / live cert).
  if (soldCount === 0 && boughtCount > 0) return "bought";
  return "sold";
}

export function OrdersPage({ boughtOrders, soldOrders }: OrdersPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = resolveOrdersTab(
    searchParams.get("tab"),
    boughtOrders.length,
    soldOrders.length,
  );
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
    // Always encode tab explicitly so buyer-default Bought does not fight Sold clicks.
    const params = new URLSearchParams();
    params.set("tab", next);
    if (chip !== "all") params.set("status", chip);
    router.push(`/orders?${params.toString()}`);
  };

  const setChip = (next: Chip) => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    if (next !== "all") params.set("status", next);
    router.push(`/orders?${params.toString()}`);
  };

  return (
    <AccountCanonicalShell
      title="Orders"
      backHref="/account"
      backLabel="My Account"
      showHeaderTitle
      showBottomNav
    >
      <div
        className="orders-page fw-engine__stack"
        data-orders-page={ORDERS_UI_VERSION}
        data-orders-lock={ORDERS_UI_DOM}
        data-orders-ui="v7-status-lock"
        data-profile-master="v7.0"
        data-full-width-surface="orders"
        data-blood-code-xii={SUPREME_BLOOD_CODE_XII_V1.version}
        data-orders-freeze="PERMANENT"
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
            <PrimaryButtonLink
              href={tab === "sold" ? "/sell" : "/search"}
              className="orders-page__empty-cta"
            >
              {tab === "sold" ? "Start selling" : "Browse items"}
            </PrimaryButtonLink>
          </div>
        ) : (
          <CanonicalCard variant="list" className="orders-page__list">
            {visible.map((order) => {
              const status = resolveOrdersV7Status(order, tab === "sold" ? "seller" : "buyer");
              return (
                <CanonicalMenuRow
                  key={order.id}
                  href={detailHref(order, tab)}
                  title={order.product.title}
                  description={order.orderNumber}
                  value={status.label}
                  className={cn("orders-page__row", status.cssClass)}
                />
              );
            })}
          </CanonicalCard>
        )}
      </div>
    </AccountCanonicalShell>
  );
}
