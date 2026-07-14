"use client";

import Link from "next/link";
import { useMemo, useState, type SVGProps } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountCanonicalShell } from "@/features/account-canonical";
import { cn } from "@/lib/cn";
import type { Order } from "@/lib/orders/types";
import "@/styles/rovexo/orders-page-v1.css";

type Tab = "sold" | "bought";
type Chip = "all" | "processing" | "completed";

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
  { id: "processing", label: "Processing" },
  { id: "completed", label: "Completed" },
];

type IconProps = SVGProps<SVGSVGElement>;

function PackageOutlineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden {...props}>
      <path
        d="M14 28 40 14l26 14v28L40 70 14 56V28Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M40 14v56M14 28l26 14 26-14"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function matchesChip(order: Order, chip: Chip): boolean {
  if (chip === "all") return true;
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
      </div>
      <div className="orders-page__skel orders-page__skel--empty" />
    </div>
  );
}

/** ROVEXO Orders v1.1 — header simplification (back only). */
export function OrdersPage({ boughtOrders, soldOrders }: OrdersPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "bought" ? "bought" : "sold";
  const [chip, setChip] = useState<Chip>("all");

  const orders = tab === "sold" ? soldOrders : boughtOrders;
  const visible = useMemo(
    () =>
      orders
        .filter((order) => matchesChip(order, chip))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [orders, chip],
  );

  const setTab = (next: Tab) => {
    setChip("all");
    router.push(next === "sold" ? "/orders" : "/orders?tab=bought");
  };

  return (
    <AccountCanonicalShell title="Orders" backHref="/account" backLabel="My Account">
      <div
        className="orders-page"
        data-orders-page="v1.1"
        data-orders-ui="header-simplified"
        data-orders-freeze="pending-visual-qa"
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
            <PackageOutlineIcon className="orders-page__empty-icon" />
            <p className="orders-page__empty-title">No orders yet.</p>
            <p className="orders-page__empty-sub">
              {tab === "sold"
                ? "Your sold items will appear here."
                : "Your purchased items will appear here."}
            </p>
          </div>
        ) : (
          <ul className="orders-page__list">
            {visible.map((order) => (
              <li key={order.id}>
                <Link href={detailHref(order, tab)} className="orders-page__row">
                  {order.product.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AccountCanonicalShell>
  );
}
