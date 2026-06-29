import { describe, expect, it } from "vitest";
import { createDefaultAnalyticsEngineDocument } from "@/lib/analytics-engine/defaults";
import {
  ANALYTICS_ENGINE_EXPORT_FORMATS,
  ANALYTICS_ENGINE_LIVE_METRICS,
  ANALYTICS_ENGINE_MODULES,
  ANALYTICS_ENGINE_MODULE_IDS,
  registerAnalyticsEngineModule,
} from "@/lib/analytics-engine/registry";
import {
  buildFinancialMetrics,
  buildLiveDashboard,
  computeAnalyticsEngineMetrics,
} from "@/lib/analytics-engine/timeline";
import type { OrdersEngineAnalytics } from "@/lib/orders-engine/types";
import type { PaymentsEngineAnalytics } from "@/lib/payments-engine/types";
import type { WalletEngineAnalytics } from "@/lib/wallet-engine/types";
import type { ProtectionEngineAnalytics } from "@/lib/protection-engine/types";
import type { MessagesEngineAnalytics } from "@/lib/messages-engine/types";
import type { NotificationsEngineAnalytics } from "@/lib/notifications-engine/types";

const orders: OrdersEngineAnalytics = {
  ordersToday: 2,
  ordersThisWeek: 8,
  ordersThisMonth: 24,
  revenue: 1200,
  averageOrderValue: 50,
  completedOrders: 20,
  cancelledOrders: 2,
  returns: 1,
  refunds: 0,
  disputes: 1,
};

const payments: PaymentsEngineAnalytics = {
  revenue: 1200,
  completedPayments: 20,
  pendingPayments: 2,
  failedPayments: 1,
  refundRate: 0.05,
  averageTransaction: 50,
  averageOrderValue: 50,
  platformFees: 60,
  buyerProtectionFees: 12,
  payoutVolume: 1000,
};

const wallet: WalletEngineAnalytics = {
  walletBalance: 800,
  revenue: 1200,
  pendingFunds: 100,
  protectedFunds: 50,
  availableFunds: 650,
  withdrawals: 3,
  refunds: 1,
  averagePayoutTimeHours: 24,
  monthlyRevenue: 1200,
  platformRevenue: 60,
};

const protection: ProtectionEngineAnalytics = {
  openCases: 2,
  closedCases: 5,
  refundValue: 100,
  partialRefunds: 1,
  averageResolutionDays: 3,
  buyerSatisfaction: 0.8,
  sellerPerformance: 0.7,
  protectionCost: 100,
  disputeRate: 0.1,
};

const messages: MessagesEngineAnalytics = {
  totalConversations: 10,
  activeConversations: 6,
  unreadMessages: 4,
  averageResponseHours: 2,
  sellerResponseRate: 0.9,
  buyerResponseRate: 0.85,
  supportResponseHours: 4,
  reportedConversations: 0,
  blockedUsers: 0,
};

const notifications: NotificationsEngineAnalytics = {
  sent: 50,
  delivered: 50,
  opened: 30,
  clicked: 20,
  dismissed: 0,
  failed: 0,
  responseRate: 0.6,
  averageOpenMinutes: 15,
  deliveryPerformance: 0.9,
};

describe("analytics engine", () => {
  it("creates default document with UK v1 configuration", () => {
    const doc = createDefaultAnalyticsEngineDocument();
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.currency).toBe("GBP");
    expect(doc.modules.some((m) => m.id === "revenue" && m.enabled)).toBe(true);
    expect(doc.integrations.ordersEngine).toBe(true);
    expect(doc.googleAnalytics.ga4Enabled).toBe(true);
    expect(doc.apiMonitoring.successRate).toBe(true);
  });

  it("registers all core analytics modules", () => {
    const ids = ANALYTICS_ENGINE_MODULES.map((m) => m.id);
    expect(ids).toContain("marketplace-overview");
    expect(ids).toContain("revenue");
    expect(ids).toContain("export");
  });

  it("defines module ids, live metrics, and export formats", () => {
    expect(ANALYTICS_ENGINE_MODULE_IDS.map((m) => m.id)).toContain("protection");
    expect(ANALYTICS_ENGINE_LIVE_METRICS.map((m) => m.id)).toContain("orders-today");
    expect(ANALYTICS_ENGINE_EXPORT_FORMATS.map((f) => f.id)).toContain("csv");
  });

  it("builds financial metrics from engine data", () => {
    const financial = buildFinancialMetrics({ orders, payments, wallet });
    expect(financial.grossRevenue).toBe(1200);
    expect(financial.platformFees).toBe(60);
    expect(financial.averageOrderValue).toBe(50);
  });

  it("builds live dashboard from engine data", () => {
    const live = buildLiveDashboard({ orders, messages, notifications, protection, wallet });
    expect(live.ordersToday).toBe(2);
    expect(live.messages).toBe(10);
    expect(live.disputes).toBe(2);
    expect(live.marketplaceHealth).toBeGreaterThan(0);
  });

  it("computes aggregate analytics metrics", () => {
    const metrics = computeAnalyticsEngineMetrics({
      orders,
      payments,
      wallet,
      protection,
      messages,
      notifications,
    });
    expect(metrics.ordersTotal).toBe(24);
    expect(metrics.revenueTotal).toBe(1200);
    expect(metrics.protectionOpenCases).toBe(2);
    expect(metrics.failedPayments).toBe(1);
  });

  it("allows future module registration", () => {
    const next = registerAnalyticsEngineModule({
      id: "custom-hub",
      label: "Custom Hub",
      icon: "📊",
      description: "Future module",
      href: "/analytics",
    });
    expect(next.some((m) => m.id === "custom-hub")).toBe(true);
  });
});
