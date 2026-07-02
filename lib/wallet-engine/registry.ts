import type { WalletEngineFilterId, WalletEngineModule } from "@/lib/wallet-engine/types";

export const WALLET_ENGINE_MODULES: WalletEngineModule[] = [
  { id: "buyer-wallet", label: "Buyer Wallet", icon: "🛍️", description: "Payment and refund history", href: "/wallet?type=buyer" },
  { id: "seller-wallet", label: "Seller Wallet", icon: "🏷️", description: "Earnings, payouts, and withdrawals", href: "/wallet" },
  { id: "business-wallet", label: "Business Wallet", icon: "🏢", description: "Business payments and bulk payouts", href: "/wallet?type=business" },
  { id: "transactions", label: "Transaction History", icon: "📑", description: "Complete financial ledger", href: "/wallet?tab=transactions" },
  { id: "withdrawals", label: "Withdrawals", icon: "💸", description: "Payout status and history", href: "/wallet?tab=withdrawals" },
  { id: "orders", label: "Orders Integration", icon: "📦", description: "Order timeline and completion", href: "/orders" },
  { id: "shipping", label: "Shipping Integration", icon: "🚚", description: "Delivery confirmation and returns", href: "/shipping" },
  { id: "protection", label: "Buyer Protection", icon: "🛡️", description: "Protected funds and disputes", href: "/protection" },
  { id: "analytics", label: "Analytics", icon: "📈", description: "Revenue and payout metrics", href: "/wallet?tab=analytics" },
];

export const WALLET_ENGINE_BALANCE_TYPES = [
  "pending",
  "protected",
  "available",
  "withdrawable",
  "reserved",
  "refund",
  "processing",
  "completed",
] as const;

export const WALLET_ENGINE_TRANSACTION_TYPES = [
  "purchase",
  "sale",
  "buyer-protection-fee",
  "shipping-fee",
  "refund",
  "partial-refund",
  "withdrawal",
  "payout",
  "adjustment",
  "promotion",
  "reward",
  "cashback",
  "auction-payment",
  "business-payment",
] as const;

export const WALLET_ENGINE_PAYOUT_METHODS = [
  { id: "stripe-connect", label: "Stripe Connect", enabled: true },
  { id: "bank-transfer", label: "Bank Transfer", enabled: true },
  { id: "paypal", label: "PayPal", enabled: false },
  { id: "wise", label: "Wise", enabled: false },
  { id: "revolut", label: "Revolut", enabled: false },
  { id: "instant-payout", label: "Instant Payout", enabled: false },
] as const;

export const WALLET_ENGINE_FILTERS: { id: WalletEngineFilterId; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "protected", label: "Protected" },
  { id: "processing", label: "Processing" },
  { id: "available", label: "Available" },
  { id: "completed", label: "Completed" },
  { id: "failed", label: "Failed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "refunded", label: "Refunded" },
];

export const WALLET_ENGINE_TIMELINE_EVENTS = [
  { id: "created", label: "Created" },
  { id: "protected", label: "Protected" },
  { id: "processing", label: "Processing" },
  { id: "available", label: "Available" },
  { id: "payout-initiated", label: "Payout Initiated" },
  { id: "payout-completed", label: "Payout Completed" },
  { id: "refunded", label: "Refunded" },
  { id: "failed", label: "Failed" },
  { id: "cancelled", label: "Cancelled" },
] as const;

export function registerWalletEngineModule(module: WalletEngineModule): WalletEngineModule[] {
  const index = WALLET_ENGINE_MODULES.findIndex((item) => item.id === module.id);
  if (index >= 0) {
    const next = [...WALLET_ENGINE_MODULES];
    next[index] = module;
    return next;
  }
  return [...WALLET_ENGINE_MODULES, module];
}
