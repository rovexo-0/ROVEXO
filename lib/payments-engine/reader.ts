import { listOrders } from "@/lib/orders/store";
import { listPaymentMethods } from "@/lib/payments/repository";
import { isStripeConfigured } from "@/lib/stripe/server";
import { calculateSellerNetAmount } from "@/lib/wallet/sales";
import { readLivePaymentsEngineDocument, getPaymentsEngineSnapshotForAdmin } from "@/lib/payments-engine/engine";
import { PAYMENTS_ENGINE_MODULES } from "@/lib/payments-engine/registry";
import {
  buildPaymentTimeline,
  getPaymentDocuments,
  mapOrderToPaymentSummary,
  mapProtectionStatus,
  matchesSearch,
  matchesSummaryFilter,
} from "@/lib/payments-engine/timeline";
import type {
  PaymentsEngineAnalytics,
  PaymentsEngineContext,
  PaymentsEngineFilterId,
  PaymentsEnginePaymentContext,
  PaymentsEngineSnapshot,
  PaymentsEngineSummary,
} from "@/lib/payments-engine/types";
import type { Order } from "@/lib/orders/types";

export async function getPublicPaymentsEngineConfig() {
  return readLivePaymentsEngineDocument();
}

export async function getPaymentsEngineSnapshot(): Promise<PaymentsEngineSnapshot> {
  const { draft, live, history } = await getPaymentsEngineSnapshotForAdmin();
  return {
    scannedAt: new Date().toISOString(),
    modules: PAYMENTS_ENGINE_MODULES,
    draft,
    live,
    history,
  };
}

function getUserOrders(userId: string, orders: Order[]): Order[] {
  return orders.filter((order) => order.buyer.id === userId || order.seller.id === userId);
}

export async function getPaymentsEngineContext(userId: string): Promise<PaymentsEngineContext> {
  const [orders, methods, config] = await Promise.all([
    listOrders(),
    listPaymentMethods(userId),
    readLivePaymentsEngineDocument(),
  ]);

  const userOrders = getUserOrders(userId, orders);
  const paidOrders = userOrders.filter((o) => o.status !== "awaiting_payment" && o.status !== "cancelled");
  const recentPayments = paidOrders
    .slice(0, 5)
    .map((order) => mapOrderToPaymentSummary(order, config.currency));

  const protectionStatuses = paidOrders.map((o) => mapProtectionStatus(o.status, o.totals.platformFee));
  const protectionStatus =
    protectionStatuses.includes("disputed") ? "disputed" :
    protectionStatuses.includes("active") ? "active" :
    protectionStatuses.includes("released") ? "released" : "protected";

  return {
    stripeConfigured: isStripeConfigured(),
    savedMethodsCount: methods.length,
    recentPayments,
    protectionStatus,
  };
}

export async function getPaymentsEnginePaymentContext(orderId: string): Promise<PaymentsEnginePaymentContext | null> {
  const orders = await listOrders();
  const order = orders.find((item) => item.id === orderId);
  if (!order) return null;

  const config = await readLivePaymentsEngineDocument();
  const summary = mapOrderToPaymentSummary(order, config.currency);
  const timeline = buildPaymentTimeline({
    status: order.status,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    completedAt: order.completedAt,
  });

  const verified = Boolean(order.paidAt);

  return {
    summary,
    timeline,
    verification: {
      provider: config.integrations.stripeCheckout,
      amount: verified,
      currency: verified,
      webhookSignature: config.fraudPrevention.webhookValidation,
      orderReference: Boolean(order.orderNumber),
      status: verified ? "verified" : "pending",
    },
    documents: getPaymentDocuments(order),
    walletIntegrated: config.integrations.walletEngine,
    ordersIntegrated: config.integrations.ordersEngine,
    shippingIntegrated: config.integrations.shippingEngine,
  };
}

export async function listPaymentsEngineSummaries(
  userId: string,
  options?: { filter?: PaymentsEngineFilterId; query?: string },
): Promise<PaymentsEngineSummary[]> {
  const [orders, config] = await Promise.all([listOrders(), readLivePaymentsEngineDocument()]);
  const userOrders = getUserOrders(userId, orders);

  return userOrders
    .map((order) => mapOrderToPaymentSummary(order, config.currency))
    .filter((summary) => (options?.filter ? matchesSummaryFilter(summary.status, options.filter) : true))
    .filter((summary) =>
      options?.query
        ? matchesSearch(options.query, {
            orderNumber: summary.orderNumber,
            productTitle: summary.productTitle,
            buyerName: summary.buyerName,
            sellerName: summary.sellerName,
          })
        : true,
    );
}

export function computePaymentsAnalytics(orders: Order[]): PaymentsEngineAnalytics {
  const paidOrders = orders.filter((o) => o.status !== "awaiting_payment" && o.status !== "cancelled");
  const pendingOrders = orders.filter((o) => o.status === "awaiting_payment");
  const failedOrders = orders.filter((o) => o.status === "cancelled");
  const refundedOrders = orders.filter((o) => o.status === "cancelled" && o.paidAt);
  const completedOrders = orders.filter((o) => o.status === "completed");

  const revenue = paidOrders.reduce((sum, o) => sum + o.totals.total, 0);
  const platformFees = paidOrders.reduce((sum, o) => sum + calculateSellerNetAmount(o.totals.itemPrice).platformFee, 0);
  const protectionFees = paidOrders.reduce((sum, o) => sum + o.totals.platformFee, 0);

  return {
    revenue,
    completedPayments: completedOrders.length,
    pendingPayments: pendingOrders.length,
    failedPayments: failedOrders.length,
    refundRate: paidOrders.length ? refundedOrders.length / paidOrders.length : 0,
    averageTransaction: paidOrders.length ? revenue / paidOrders.length : 0,
    averageOrderValue: paidOrders.length ? revenue / paidOrders.length : 0,
    platformFees,
    buyerProtectionFees: protectionFees,
    payoutVolume: completedOrders.reduce((sum, o) => sum + calculateSellerNetAmount(o.totals.itemPrice).sellerAmount, 0),
  };
}

export async function getPaymentsEngineAnalyticsForUser(userId: string): Promise<PaymentsEngineAnalytics> {
  const orders = await listOrders();
  const userOrders = getUserOrders(userId, orders);
  return computePaymentsAnalytics(userOrders);
}
