import {
  PAYMENTS_ENGINE_FILTERS,
  PAYMENTS_ENGINE_PAYMENT_METHODS,
  PAYMENTS_ENGINE_PAYOUT_METHODS,
  PAYMENTS_ENGINE_PROVIDERS,
} from "@/lib/payments-engine/registry";
import { PLATFORM_FEE_RATE } from "@/lib/orders/pricing";
import type { PaymentsEngineDocument, PaymentsEngineHistoryEntry } from "@/lib/payments-engine/types";

const now = () => new Date().toISOString();

export function createDefaultPaymentsEngineDocument(label = "ROVEXO Payments Engine"): PaymentsEngineDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    marketplaceVersion: "ROVEXO v1.0",
    primaryCountry: "United Kingdom",
    currency: "GBP",
    paymentMethods: PAYMENTS_ENGINE_PAYMENT_METHODS.map((method) => ({ ...method })),
    providers: PAYMENTS_ENGINE_PROVIDERS.map((provider) => ({ ...provider })),
    payoutMethods: PAYMENTS_ENGINE_PAYOUT_METHODS.map((method) => ({ ...method })),
    filters: PAYMENTS_ENGINE_FILTERS.map((f) => ({ ...f, enabled: true })),
    notifications: createDefaultNotifications(),
    analyticsEnabled: true,
    fraudPrevention: {
      velocityChecks: true,
      duplicateDetection: true,
      riskScoring: true,
      webhookValidation: true,
      deviceFingerprint: false,
      threeDSecure: true,
      suspiciousActivityFlag: true,
      manualReview: true,
    },
    aiAssistant: {
      globalEnabled: false,
      paymentSummaries: true,
      financialReports: true,
      fraudIndicators: true,
      revenueInsights: true,
      transactionAnalytics: true,
      execution: "local",
    },
    integrations: {
      walletEngine: true,
      ordersEngine: true,
      shippingEngine: true,
      buyerProtection: true,
      stripeCheckout: true,
      stripeConnect: true,
    },
    futureReady: [
      "Subscriptions",
      "Installments",
      "Recurring Payments",
      "Split Payments",
      "Escrow Payments",
      "Marketplace Credits",
      "Gift Cards",
      "Loyalty Rewards",
      "Multi-Currency",
      "Currency Exchange",
      "Crypto-ready Abstraction",
    ],
    auditLog: [],
  };
}

export function createDefaultPaymentsEngineHistory(): PaymentsEngineHistoryEntry[] {
  return [];
}

function createDefaultNotifications(): PaymentsEngineDocument["notifications"] {
  return [
    { id: "buyer-success", audience: "buyer", event: "payment_successful", enabled: true },
    { id: "buyer-failed", audience: "buyer", event: "payment_failed", enabled: true },
    { id: "buyer-refund", audience: "buyer", event: "refund_issued", enabled: true },
    { id: "buyer-protected", audience: "buyer", event: "payment_protected", enabled: true },
    { id: "seller-received", audience: "seller", event: "payment_received", enabled: true },
    { id: "seller-protected", audience: "seller", event: "funds_protected", enabled: true },
    { id: "seller-released", audience: "seller", event: "funds_released", enabled: true },
    { id: "seller-payout", audience: "seller", event: "payout_completed", enabled: true },
    { id: "admin-failure", audience: "administrator", event: "payment_failure", enabled: true },
    { id: "admin-webhook", audience: "administrator", event: "webhook_failure", enabled: true },
    { id: "admin-large", audience: "administrator", event: "large_transaction", enabled: true },
    { id: "admin-refund", audience: "administrator", event: "refund_alert", enabled: true },
    { id: "admin-fraud", audience: "administrator", event: "fraud_alert", enabled: true },
  ];
}

export { PLATFORM_FEE_RATE };
