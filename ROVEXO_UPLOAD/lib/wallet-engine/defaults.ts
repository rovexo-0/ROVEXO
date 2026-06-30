import {
  WALLET_ENGINE_BALANCE_TYPES,
  WALLET_ENGINE_FILTERS,
  WALLET_ENGINE_PAYOUT_METHODS,
  WALLET_ENGINE_TRANSACTION_TYPES,
} from "@/lib/wallet-engine/registry";
import { PLATFORM_FEE_RATE, PENDING_HOLD_HOURS } from "@/lib/wallet/sales";
import type { WalletEngineDocument, WalletEngineHistoryEntry } from "@/lib/wallet-engine/types";

const now = () => new Date().toISOString();

export function createDefaultWalletEngineDocument(label = "ROVEXO Wallet Engine"): WalletEngineDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    marketplaceVersion: "ROVEXO v1.0",
    primaryCountry: "United Kingdom",
    currency: "GBP",
    walletTypes: [
      { id: "buyer", label: "Buyer Wallet", enabled: true },
      { id: "seller", label: "Seller Wallet", enabled: true },
      { id: "business", label: "Business Wallet", enabled: true },
      { id: "platform", label: "Platform Wallet", enabled: true },
      { id: "administrator", label: "Administrator View", enabled: true },
    ],
    balanceTypes: WALLET_ENGINE_BALANCE_TYPES.map((id) => ({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
      enabled: true,
    })),
    transactionTypes: WALLET_ENGINE_TRANSACTION_TYPES.map((id) => ({
      id,
      label: id
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
      enabled: !["reward", "cashback"].includes(id),
    })),
    payoutMethods: WALLET_ENGINE_PAYOUT_METHODS.map((method) => ({ ...method })),
    filters: WALLET_ENGINE_FILTERS.map((f) => ({ ...f, enabled: true })),
    notifications: createDefaultNotifications(),
    analyticsEnabled: true,
    aiAssistant: {
      globalEnabled: false,
      financialSummaries: true,
      walletInsights: true,
      revenueReports: true,
      withdrawalRecommendations: true,
      fraudIndicators: true,
      execution: "local",
    },
    integrations: {
      ordersEngine: true,
      shippingEngine: true,
      payments: true,
      buyerProtection: true,
      deliveryConfirmation: true,
      trackingStatus: true,
      returns: true,
    },
    holdPeriodHours: PENDING_HOLD_HOURS,
    platformFeeRate: PLATFORM_FEE_RATE,
    futureReady: [
      "Multi-Currency",
      "Currency Exchange",
      "Gift Cards",
      "Store Credit",
      "Subscriptions",
      "Installments",
      "Marketplace Rewards",
      "Loyalty Points",
      "Cashback",
      "ROVEXO Credits",
    ],
    auditLog: [],
  };
}

export function createDefaultWalletEngineHistory(): WalletEngineHistoryEntry[] {
  return [];
}

function createDefaultNotifications(): WalletEngineDocument["notifications"] {
  return [
    { id: "buyer-payment", audience: "buyer", event: "payment_received", enabled: true },
    { id: "buyer-refund", audience: "buyer", event: "refund_issued", enabled: true },
    { id: "buyer-updated", audience: "buyer", event: "wallet_updated", enabled: true },
    { id: "seller-protected", audience: "seller", event: "funds_protected", enabled: true },
    { id: "seller-available", audience: "seller", event: "funds_available", enabled: true },
    { id: "seller-withdrawal-done", audience: "seller", event: "withdrawal_completed", enabled: true },
    { id: "seller-withdrawal-fail", audience: "seller", event: "withdrawal_failed", enabled: true },
    { id: "admin-large-withdrawal", audience: "administrator", event: "large_withdrawal", enabled: true },
    { id: "admin-failed-tx", audience: "administrator", event: "failed_transaction", enabled: true },
    { id: "admin-refund-alert", audience: "administrator", event: "refund_alert", enabled: true },
    { id: "admin-wallet-error", audience: "administrator", event: "wallet_error", enabled: true },
  ];
}
