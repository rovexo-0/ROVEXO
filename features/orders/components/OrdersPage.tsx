"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { useAuthOptional } from "@/features/auth/providers/AuthProvider";
import { PrimaryButtonLink } from "@/src/components/canonical";
import { OrdersListItem } from "@/features/orders/components/OrdersListItem";
import { cn } from "@/lib/cn";
import { subscribeOrdersRealtime } from "@/lib/orders/orders-realtime";
import {
  ORDERS_UI_DOM,
  ORDERS_UI_VERSION,
  resolveOrdersV7Status,
} from "@/lib/orders/orders-v7-status";
import { getMessageHref } from "@/lib/orders/status";
import { SUPREME_BLOOD_CODE_XII_V1 } from "@/lib/supreme-blood-code-xii-v1";
import type { Order, OrderStatus } from "@/lib/orders/types";
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
 * Owner nav: order row → Conversation Hub directly (no Order Details).
 * Bought and Sold reuse getMessageHref with conversationId when known.
 */
function detailHref(order: Order, tab: Tab): string {
  return getMessageHref(
    order.id,
    tab === "sold" ? "seller" : "buyer",
    order.conversationId,
  );
}

export function OrdersPageSkeleton() {
  return (
    <div className="orders-page" role="status" aria-busy="true" aria-label="Loading orders">
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
  const auth = useAuthOptional();
  const userId = auth?.profile?.id ?? null;
  const [bought, setBought] = useState(boughtOrders);
  const [sold, setSold] = useState(soldOrders);
  const [boughtSource, setBoughtSource] = useState(boughtOrders);
  const [soldSource, setSoldSource] = useState(soldOrders);

  /* Adjust local RT state when server props change — render-time sync (no effect setState). */
  if (boughtOrders !== boughtSource) {
    setBoughtSource(boughtOrders);
    setBought(boughtOrders);
  }
  if (soldOrders !== soldSource) {
    setSoldSource(soldOrders);
    setSold(soldOrders);
  }
  const tab = resolveOrdersTab(searchParams.get("tab"), bought.length, sold.length);
  const statusParam = searchParams.get("status");
  const chip: Chip =
    statusParam === "in_progress" ||
    statusParam === "completed" ||
    statusParam === "cancelled"
      ? statusParam
      : "all";

  const orders = tab === "sold" ? sold : bought;
  const visible = useMemo(
    () =>
      orders
        .filter((order) => matchesChip(order, chip))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [orders, chip],
  );

  /* Realtime Certification v1.1 — patch in place. Forbidden: router.refresh / reload. */
  useEffect(() => {
    if (!userId) return;
    const patch = (list: Order[], row: { id?: string; status?: string }): Order[] => {
      const id = typeof row.id === "string" ? row.id : "";
      if (!id) return list;
      return list.map((order) =>
        order.id === id && typeof row.status === "string"
          ? { ...order, status: row.status as OrderStatus }
          : order,
      );
    };
    const sub = subscribeOrdersRealtime(userId, (row) => {
      setBought((prev) => patch(prev, row));
      setSold((prev) => patch(prev, row));
    });
    return () => sub.unsubscribe();
  }, [userId]);

  /* Phase A1 — warm Conversation RSC payloads so Orders → Hub feels instant. */
  useEffect(() => {
    for (const order of visible) {
      const href = detailHref(order, tab);
      if (href.includes("/inbox/conversation/")) {
        router.prefetch(href);
      }
    }
  }, [visible, tab, router]);

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
          <div className="orders-page__list" role="list">
            {visible.map((order) => {
              const role = tab === "sold" ? "seller" : "buyer";
              const status = resolveOrdersV7Status(order, role);
              const priceAmount =
                role === "seller" ? order.totals.itemPrice : order.totals.total;
              return (
                <div key={order.id} role="listitem">
                  <OrdersListItem
                    order={order}
                    href={detailHref(order, tab)}
                    status={status}
                    priceAmount={priceAmount}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AccountCanonicalShell>
  );
}
