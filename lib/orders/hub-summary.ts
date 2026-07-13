import type { Order } from "@/lib/orders/types";
import { formatCurrency } from "@/lib/wallet/utils";

export type OrdersHubStatusFilter =
  | "all"
  | "processing"
  | "shipping"
  | "completed"
  | "cancelled";

export type OrdersHubSort =
  | "newest"
  | "oldest"
  | "highest_value"
  | "lowest_value";

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
  // processing
  return (
    order.status === "awaiting_payment" ||
    order.status === "awaiting_shipment" ||
    order.status === "issue_open"
  );
}

export function sortOrdersHub(orders: Order[], sort: OrdersHubSort): Order[] {
  const next = [...orders];
  switch (sort) {
    case "oldest":
      return next.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    case "highest_value":
      return next.sort((a, b) => b.totals.total - a.totals.total);
    case "lowest_value":
      return next.sort((a, b) => a.totals.total - b.totals.total);
    case "newest":
    default:
      return next.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }
}

export function searchOrdersHub(orders: Order[], query: string, tab: "sold" | "bought"): Order[] {
  const q = query.trim().toLowerCase();
  if (!q) return orders;
  return orders.filter((order) => {
    const party = tab === "sold" ? order.buyer.name : order.seller.name;
    return (
      order.id.toLowerCase().includes(q) ||
      order.orderNumber.toLowerCase().includes(q) ||
      order.product.title.toLowerCase().includes(q) ||
      party.toLowerCase().includes(q)
    );
  });
}

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
  const feedbackPct =
    nonCancelled.length === 0
      ? "—"
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
      subtitle: `${pending.length} orders`,
      tone: "pending",
      href: "/wallet",
      filter: "processing",
    },
    {
      id: "orders",
      title: "Orders",
      value: String(orders.length),
      subtitle: "Sold",
      tone: "orders",
      filter: "all",
    },
    {
      id: "feedback",
      title: "Positive Feedback",
      value: feedbackPct,
      subtitle: "Completed rate",
      tone: "feedback",
      filter: "completed",
    },
  ];
}

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
      subtitle: "Active orders",
      tone: "pending",
      filter: "processing",
    },
    {
      id: "orders",
      title: "Orders",
      value: String(orders.length),
      subtitle: "Bought",
      tone: "orders",
      filter: "all",
    },
    {
      id: "completed",
      title: "Completed",
      value: String(completed.length),
      subtitle: "Delivered",
      tone: "feedback",
      filter: "completed",
    },
  ];
}
