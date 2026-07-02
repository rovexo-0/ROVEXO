import type { SellerAnalyticsData } from "@/lib/analytics/types";
import type { OrdersEngineAnalytics } from "@/lib/orders-engine/types";
import type { PaymentsEngineAnalytics } from "@/lib/payments-engine/types";
import type { WalletEngineAnalytics } from "@/lib/wallet-engine/types";
import type { ProtectionEngineAnalytics } from "@/lib/protection-engine/types";
import type { MessagesEngineAnalytics } from "@/lib/messages-engine/types";
import type { NotificationsEngineAnalytics } from "@/lib/notifications-engine/types";
import type {
  AnalyticsEngineAnalytics,
  AnalyticsEngineFinancialMetrics,
  AnalyticsEngineLiveDashboard,
} from "@/lib/analytics-engine/types";

export function buildFinancialMetrics(input: {
  seller?: SellerAnalyticsData | null;
  orders: OrdersEngineAnalytics;
  payments: PaymentsEngineAnalytics;
  wallet: WalletEngineAnalytics;
}): AnalyticsEngineFinancialMetrics {
  const sellerRevenue = input.seller?.overview.find((m) => m.label === "Revenue")?.value ?? input.orders.revenue;
  const conversion =
    input.seller?.overview.find((m) => m.label === "Conversion")?.value ??
    (input.orders.averageOrderValue > 0 ? input.orders.completedOrders / Math.max(1, input.orders.ordersThisMonth) : 0);

  return {
    grossRevenue: input.payments.revenue || sellerRevenue,
    netRevenue: (input.payments.revenue || sellerRevenue) - input.payments.platformFees,
    platformFees: input.payments.platformFees,
    buyerProtectionRevenue: input.payments.buyerProtectionFees,
    shippingRevenue: 0,
    refunds: input.payments.refundRate * (input.payments.revenue || sellerRevenue),
    withdrawals: input.wallet.withdrawals,
    sellerEarnings: input.wallet.availableFunds,
    averageOrderValue: input.orders.averageOrderValue || input.payments.averageOrderValue,
    conversionRate: typeof conversion === "number" ? conversion / 100 : 0,
  };
}

export function buildLiveDashboard(input: {
  orders: OrdersEngineAnalytics;
  messages: MessagesEngineAnalytics;
  notifications: NotificationsEngineAnalytics;
  protection: ProtectionEngineAnalytics;
  wallet: WalletEngineAnalytics;
  seller?: SellerAnalyticsData | null;
}): AnalyticsEngineLiveDashboard {
  const views = input.seller?.overview.find((m) => m.label === "Views")?.value ?? 0;
  const healthScore = Math.min(
    100,
    Math.round(
      (input.orders.completedOrders > 0 ? 30 : 10) +
        (input.notifications.deliveryPerformance * 20) +
        (input.messages.sellerResponseRate * 20) +
        (input.protection.disputeRate < 0.1 ? 30 : 10),
    ),
  );

  return {
    marketplaceHealth: healthScore,
    revenue: input.orders.revenue,
    ordersToday: input.orders.ordersToday,
    ordersThisWeek: input.orders.ordersThisWeek,
    ordersThisMonth: input.orders.ordersThisMonth,
    activeUsers: input.messages.totalConversations + input.notifications.sent,
    onlineUsers: input.messages.activeConversations,
    activeSellers: input.orders.completedOrders > 0 ? 1 : 0,
    newListings: Math.round(views / 10),
    messages: input.messages.totalConversations,
    notifications: input.notifications.sent,
    supportTickets: 0,
    disputes: input.protection.openCases,
    returns: input.orders.returns,
    withdrawals: input.wallet.withdrawals,
  };
}

export function computeAnalyticsEngineMetrics(input: {
  orders: OrdersEngineAnalytics;
  payments: PaymentsEngineAnalytics;
  wallet: WalletEngineAnalytics;
  protection: ProtectionEngineAnalytics;
  messages: MessagesEngineAnalytics;
  notifications: NotificationsEngineAnalytics;
  seller?: SellerAnalyticsData | null;
}): AnalyticsEngineAnalytics {
  const conversion =
    input.seller?.overview.find((m) => m.label === "Conversion")?.value ?? 0;

  return {
    ordersTotal: input.orders.ordersThisMonth,
    revenueTotal: input.orders.revenue || input.payments.revenue,
    messagesTotal: input.messages.totalConversations,
    notificationsTotal: input.notifications.sent,
    protectionOpenCases: input.protection.openCases,
    walletBalance: input.wallet.walletBalance,
    failedPayments: input.payments.failedPayments,
    averageOrderValue: input.orders.averageOrderValue,
    conversionRate: typeof conversion === "number" ? conversion / 100 : 0,
  };
}
