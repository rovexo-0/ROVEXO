import { listOrders } from "@/lib/orders/store";
import type { Order } from "@/lib/orders/types";
import { readLiveOrdersEngineDocument, getOrdersEngineSnapshotForAdmin } from "@/lib/orders-engine/engine";
import { ORDERS_ENGINE_MODULES } from "@/lib/orders-engine/registry";
import {
  buildOrderTimeline,
  mapOrderStatusToFilters,
  mapOrderStatusToLifecycle,
  mapProtectionStatus,
  mapWalletStatus,
  matchesFilter,
  matchesSearch,
} from "@/lib/orders-engine/timeline";
import type {
  OrdersEngineAnalytics,
  OrdersEngineFilterId,
  OrdersEngineOrderContext,
  OrdersEngineOrderSummary,
  OrdersEngineSnapshot,
} from "@/lib/orders-engine/types";
import { getShippingOrderContext } from "@/lib/shipping-engine/reader";

export async function getPublicOrdersEngineConfig() {
  return readLiveOrdersEngineDocument();
}

export async function getOrdersEngineSnapshot(): Promise<OrdersEngineSnapshot> {
  const { draft, live, history } = await getOrdersEngineSnapshotForAdmin();
  return {
    scannedAt: new Date().toISOString(),
    modules: ORDERS_ENGINE_MODULES,
    draft,
    live,
    history,
  };
}

export function mapOrderToSummary(order: Order, currency = "GBP"): OrdersEngineOrderSummary {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    lifecycleStage: mapOrderStatusToLifecycle(order.status),
    orderType: "marketplace",
    buyerName: order.buyer.name,
    sellerName: order.seller.name,
    productTitle: order.product.title,
    grandTotal: order.totals.total,
    currency,
    createdAt: order.createdAt,
    trackingNumber: order.trackingNumber,
    protectionStatus: mapProtectionStatus(order.status, order.totals.platformFee),
    walletStatus: mapWalletStatus(order.status),
    filterTags: mapOrderStatusToFilters(order.status),
  };
}

export async function getOrdersEngineOrderContext(orderId: string): Promise<OrdersEngineOrderContext | null> {
  const orders = await listOrders();
  const order = orders.find((item) => item.id === orderId);
  if (!order) return null;

  const config = await readLiveOrdersEngineDocument();
  const summary = mapOrderToSummary(order, config.currency);
  const timeline = buildOrderTimeline({
    status: order.status,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    completedAt: order.completedAt,
    hasTracking: Boolean(order.trackingNumber),
  });

  const shipping = config.integrations.shippingEngine ? await getShippingOrderContext(orderId) : null;

  return {
    summary,
    timeline,
    shippingIntegrated: Boolean(shipping),
    documents: [
      { id: "invoice", label: "Invoice", available: Boolean(order.paidAt) },
      { id: "receipt", label: "Receipt", available: order.status === "completed" },
      { id: "shipping-label", label: "Shipping Label", available: Boolean(order.trackingNumber) },
      { id: "tracking", label: "Tracking Information", available: Boolean(order.trackingNumber) },
      { id: "summary", label: "Order Summary", available: true },
    ],
  };
}

export async function listOrdersEngineSummaries(userId: string, options?: { filter?: OrdersEngineFilterId; query?: string }) {
  const orders = await listOrders();
  const config = await readLiveOrdersEngineDocument();

  const userOrders = orders.filter((order) => order.buyer.id === userId || order.seller.id === userId);

  return userOrders
    .map((order) => mapOrderToSummary(order, config.currency))
    .filter((summary) => (options?.filter ? matchesFilter(summary.status as Order["status"], options.filter) : true))
    .filter((summary) =>
      options?.query
        ? matchesSearch(options.query, {
            orderNumber: summary.orderNumber,
            productTitle: summary.productTitle,
            trackingNumber: summary.trackingNumber,
            buyerName: summary.buyerName,
            sellerName: summary.sellerName,
          })
        : true,
    );
}

export function computeOrdersAnalytics(orders: Order[]): OrdersEngineAnalytics {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const toTime = (value: string) => new Date(value).getTime();
  const paidOrders = orders.filter((o) => o.status !== "awaiting_payment" && o.status !== "cancelled");

  return {
    ordersToday: paidOrders.filter((o) => toTime(o.createdAt) >= startOfDay.getTime()).length,
    ordersThisWeek: paidOrders.filter((o) => toTime(o.createdAt) >= startOfWeek.getTime()).length,
    ordersThisMonth: paidOrders.filter((o) => toTime(o.createdAt) >= startOfMonth.getTime()).length,
    revenue: paidOrders.reduce((sum, o) => sum + o.totals.total, 0),
    averageOrderValue: paidOrders.length ? paidOrders.reduce((sum, o) => sum + o.totals.total, 0) / paidOrders.length : 0,
    completedOrders: orders.filter((o) => o.status === "completed").length,
    cancelledOrders: orders.filter((o) => o.status === "cancelled").length,
    returns: 0,
    refunds: 0,
    disputes: orders.filter((o) => o.status === "issue_open").length,
  };
}

export async function getOrdersEngineAnalyticsForUser(userId: string): Promise<OrdersEngineAnalytics> {
  const orders = await listOrders();
  const userOrders = orders.filter((order) => order.buyer.id === userId || order.seller.id === userId);
  return computeOrdersAnalytics(userOrders);
}
