"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { BetaPageHeader } from "@/components/beta/BetaPageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { HelpPageFooter } from "@/features/help/components/HelpPageFooter";
import { OrderListItem } from "@/features/orders/components/OrderListItem";
import { cn } from "@/lib/cn";
import { ORDERS_ENGINE_FILTERS } from "@/lib/orders-engine/registry";
import type {
  OrdersEngineAnalytics,
  OrdersEngineDocument,
  OrdersEngineFilterId,
  OrdersEngineModule,
} from "@/lib/orders-engine/types";
import type { Order } from "@/lib/orders/types";

type OrdersEngineListShellProps = {
  orders: Order[];
  userId: string;
  config: OrdersEngineDocument;
  modules: OrdersEngineModule[];
  analytics: OrdersEngineAnalytics;
};

export function OrdersEngineListShell({
  orders,
  userId,
  config,
  modules,
  analytics,
}: OrdersEngineListShellProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<OrdersEngineFilterId | "all">("all");
  const [tab, setTab] = useState<"orders" | "analytics">("orders");

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.product.title.toLowerCase().includes(q) ||
        (order.trackingNumber?.toLowerCase().includes(q) ?? false);
      if (!matchesQuery) return false;
      if (filter === "all") return true;
      if (filter === "pending") return order.status === "awaiting_payment";
      if (filter === "paid") return order.status === "awaiting_shipment";
      if (filter === "processing") return order.status === "awaiting_shipment";
      if (filter === "shipped") return order.status === "shipped";
      if (filter === "delivered") return order.status === "delivered";
      if (filter === "completed") return order.status === "completed";
      if (filter === "disputed") return order.status === "issue_open";
      if (filter === "cancelled") return order.status === "cancelled";
      return true;
    });
  }, [orders, query, filter]);

  return (
    <BetaAppShell bottomNavTab="account">
      <BetaPageHeader title="Orders" backHref="/account" />

      <main className="oe-hub mx-auto flex w-full max-w-2xl flex-col gap-ds-4 px-ds-4 py-ds-5 pb-[calc(84px+env(safe-area-inset-bottom))]">
        <header className="oe-hub__intro">
          <p className="oe-hub__eyebrow">Orders Engine</p>
          <p className="text-sm text-text-secondary">
            {config.marketplaceVersion} · {config.primaryCountry} · {config.currency}
          </p>
        </header>

        <div className="oe-hub__tabs">
          <button type="button" className={cn("oe-hub__tab", tab === "orders" && "oe-hub__tab--active")} onClick={() => setTab("orders")}>
            Orders
          </button>
          <button type="button" className={cn("oe-hub__tab", tab === "analytics" && "oe-hub__tab--active")} onClick={() => setTab("analytics")}>
            Analytics
          </button>
        </div>

        {tab === "analytics" ? (
          <section className="oe-panel">
            <div className="oe-analytics-grid">
              <MetricCard label="Today" value={analytics.ordersToday} />
              <MetricCard label="This week" value={analytics.ordersThisWeek} />
              <MetricCard label="This month" value={analytics.ordersThisMonth} />
              <MetricCard label="Revenue" value={`£${analytics.revenue.toFixed(2)}`} />
              <MetricCard label="Avg order" value={`£${analytics.averageOrderValue.toFixed(2)}`} />
              <MetricCard label="Completed" value={analytics.completedOrders} />
              <MetricCard label="Disputes" value={analytics.disputes} />
              <MetricCard label="Cancelled" value={analytics.cancelledOrders} />
            </div>
          </section>
        ) : (
          <>
            <input
              className="oe-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order ID, product, tracking…"
            />
            <div className="oe-chip-row">
              <button type="button" className={cn("oe-chip", filter === "all" && "oe-chip--active")} onClick={() => setFilter("all")}>
                All
              </button>
              {ORDERS_ENGINE_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn("oe-chip", filter === item.id && "oe-chip--active")}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <EmptyState
                premiumIllustrationId="orders"
                title="No orders yet"
                description="When you buy or sell on ROVEXO, your orders will appear here."
                actionLabel="Browse listings"
                actionHref="/"
              />
            ) : (
              filteredOrders.map((order) => <OrderListItem key={order.id} order={order} userId={userId} />)
            )}
          </>
        )}

        <section className="oe-panel">
          <h2 className="oe-panel__title">Integrations</h2>
          <div className="oe-module-grid">
            {modules.slice(4).map((module) => (
              <Link key={module.id} href={module.href} className="oe-module-card">
                <span>{module.icon}</span>
                <span className="font-semibold">{module.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <HelpPageFooter pathname="/orders" />
    </BetaAppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="oe-metric-card">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="oe-metric-card__value">{value}</p>
    </div>
  );
}
