import type { Order } from "@/lib/orders/types";
import { formatCurrency } from "@/lib/wallet/utils";

export type OrdersHubStatusFilter =
  | "all"
  | "processing"
  | "shipping"
  | "completed"
  | "cancelled";

export type OrdersHubSummaryCard = {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  tone: "sales" | "pending" | "orders" | "feedback";
  href?: string;
  filter?: OrdersHubStatusFilter;
};

export function matchesOrdersHubStatusFilter(
  order: Order,
  filter: OrdersHubStatusFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "cancelled") return order.status === "cancelled";
  if (filter === "shipping") return order.status === "shipped";
  if (filter === "completed") {
    return order.status === "completed" || order.status === "delivered";
  }
  return (
    order.status === "awaiting_payment" ||
    order.status === "awaiting_shipment" ||
    order.status === "issue_open"
  );
}

export function countOrdersByFilter(
  orders: Order[],
): Record<OrdersHubStatusFilter, number> {
  return {
    all: orders.length,
    processing: orders.filter((o) => matchesOrdersHubStatusFilter(o, "processing")).length,
    shipping: orders.filter((o) => matchesOrdersHubStatusFilter(o, "shipping")).length,
    completed: orders.filter((o) => matchesOrdersHubStatusFilter(o, "completed")).length,
    cancelled: orders.filter((o) => matchesOrdersHubStatusFilter(o, "cancelled")).length,
  };
}

export function sortOrdersHubNewest(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

/** Sold-tab statistics — Master Implementation Spec card copy. */
export function buildSoldSummary(orders: Order[]): OrdersHubSummaryCard[] {
  const nonCancelled = orders.filter((o) => o.status !== "cancelled");
  const totalSales = nonCancelled.reduce((sum, o) => sum + o.totals.total, 0);
  const pending = orders.filter(
    (o) =>
      o.status === "awaiting_shipment" ||
      o.status === "shipped" ||
      o.status === "delivered",
  );
  const pendingTotal = pending.reduce((sum, o) => sum + o.totals.total, 0);
  const completed = orders.filter((o) => o.status === "completed" || o.status === "delivered");
  const reviewCount = completed.length;
  const feedbackPct =
    nonCancelled.length === 0
      ? "0%"
      : `${Math.round((completed.length / nonCancelled.length) * 100)}%`;

  return [
    {
      id: "total-sales",
      title: "Total Sales",
      value: formatCurrency(totalSales),
      subtitle: "All time",
      tone: "sales",
      filter: "all",
    },
    {
      id: "pending-payout",
      title: "Pending Payout",
      value: formatCurrency(pendingTotal),
      subtitle: pendingTotal === 0 ? "Nothing to withdraw" : `${pending.length} orders`,
      tone: "pending",
      href: "/wallet",
      filter: "processing",
    },
    {
      id: "orders",
      title: "Orders",
      value: String(orders.length),
      subtitle: "All Orders",
      tone: "orders",
      filter: "all",
    },
    {
      id: "feedback",
      title: "Positive Feedback",
      value: feedbackPct,
      subtitle: `${reviewCount} Review${reviewCount === 1 ? "" : "s"}`,
      tone: "feedback",
      filter: "completed",
    },
  ];
}

/** Bought-tab statistics — same grid structure, buyer-facing copy. */
export function buildBoughtSummary(orders: Order[]): OrdersHubSummaryCard[] {
  const nonCancelled = orders.filter((o) => o.status !== "cancelled");
  const totalSpent = nonCancelled.reduce((sum, o) => sum + o.totals.total, 0);
  const inProgress = orders.filter(
    (o) =>
      o.status === "awaiting_payment" ||
      o.status === "awaiting_shipment" ||
      o.status === "shipped" ||
      o.status === "issue_open",
  );
  const completed = orders.filter((o) => o.status === "completed" || o.status === "delivered");

  return [
    {
      id: "total-spent",
      title: "Total Spent",
      value: formatCurrency(totalSpent),
      subtitle: "All time",
      tone: "sales",
      filter: "all",
    },
    {
      id: "in-progress",
      title: "In Progress",
      value: String(inProgress.length),
      subtitle: inProgress.length === 0 ? "Nothing active" : "Active orders",
      tone: "pending",
      filter: "processing",
    },
    {
      id: "orders",
      title: "Orders",
      value: String(orders.length),
      subtitle: "All Orders",
      tone: "orders",
      filter: "all",
    },
    {
      id: "completed",
      title: "Completed",
      value: String(completed.length),
      subtitle: `${completed.length} Review${completed.length === 1 ? "" : "s"}`,
      tone: "feedback",
      filter: "completed",
    },
  ];
}
