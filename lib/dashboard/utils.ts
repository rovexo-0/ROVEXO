import type {
  DashboardPerformance,
  DashboardPerformanceMetric,
  DashboardRecentOrder,
} from "@/features/dashboard/types";
import type { Order } from "@/lib/orders/types";

export function mapOrdersToRecentOrders(
  orders: Order[],
  options: { hrefPrefix: string; skuByProductId?: Record<string, string> },
): DashboardRecentOrder[] {
  return orders.map((order) => ({
    id: order.id,
    href: `${options.hrefPrefix}/${order.id}`,
    productTitle: order.product.title,
    productImageUrl: order.product.imageUrl,
    price: order.totals.total,
    status: order.status,
    createdAt: order.createdAt,
    sku: options.skuByProductId?.[order.product.id],
  }));
}

export function buildDashboardPerformance(
  points: Array<{ label: string; values: Record<string, number> }>,
  metrics: DashboardPerformanceMetric[],
  periodLabel: string,
): DashboardPerformance {
  const totals: Record<string, number> = {};

  for (const metric of metrics) {
    totals[metric.id] = points.reduce(
      (sum, point) => sum + (point.values[metric.id] ?? 0),
      0,
    );
  }

  return { periodLabel, totals, points, metrics };
}
