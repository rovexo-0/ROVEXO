import type { PaymentsEngineFilterId, PaymentsEngineModule } from "@/lib/payments-engine/types";

export const PAYMENTS_ENGINE_MODULES: PaymentsEngineModule[] = [
  { id: "history", label: "Payment History", icon: "📑", description: "Complete payment ledger", href: "/payments?tab=history" },
  { id: "methods", label: "Payment Methods", icon: "💳", description: "Saved cards and wallets", href: "/wallet/payment-methods" },
  { id: "receipts", label: "Receipts", icon: "🧾", description: "Receipts and confirmations", href: "/payments?tab=receipts" },
  { id: "refunds", label: "Refunds", icon: "↩️", description: "Refund timeline and history", href: "/payments?tab=refunds" },
  { id: "orders", label: "Orders Integration", icon: "📦", description: "Order timeline and status", href: "/orders" },
  { id: "wallet", label: "Wallet Integration", icon: "👛", description: "Seller earnings and payouts", href: "/wallet" },
  { id: "shipping", label: "Shipping Integration", icon: "🚚", description: "Delivery and tracking", href: "/shipping" },
  { id: "protection", label: "Purchase Protection", icon: "🛡️", description: "Protected funds and disputes", href: "/protection" },
  { id: "analytics", label: "Analytics", icon: "📈", description: "Revenue and transaction metrics", href: "/payments?tab=analytics" },
];

export const PAYMENTS_ENGINE_PAYMENT_METHODS = [
  { id: "credit-card", label: "Credit Card", enabled: true },
  { id: "debit-card", label: "Debit Card", enabled: true },
  { id: "apple-pay", label: "Apple Pay", enabled: true },
  { id: "google-pay", label: "Google Pay", enabled: true },
  { id: "bank-payment", label: "Bank Payment", enabled: true },
  { id: "wallet-payment", label: "Wallet Payment", enabled: false },
  { id: "gift-card", label: "Gift Card", enabled: false },
  { id: "marketplace-credits", label: "Marketplace Credits", enabled: false },
] as const;

export const PAYMENTS_ENGINE_PROVIDERS = [
  { id: "stripe-checkout", label: "Stripe Checkout", enabled: true },
  { id: "stripe-connect", label: "Stripe Connect", enabled: true },
  { id: "paypal", label: "PayPal", enabled: false },
  { id: "adyen", label: "Adyen", enabled: false },
  { id: "worldpay", label: "Worldpay", enabled: false },
  { id: "square", label: "Square", enabled: false },
  { id: "mollie", label: "Mollie", enabled: false },
  { id: "checkout-com", label: "Checkout.com", enabled: false },
  { id: "amazon-pay", label: "Amazon Pay", enabled: false },
  { id: "rovexo-payments", label: "ROVEXO Payments", enabled: false },
] as const;

export const PAYMENTS_ENGINE_PAYOUT_METHODS = [
  { id: "stripe-connect", label: "Stripe Connect", enabled: true },
  { id: "bank-transfer", label: "Bank Transfer", enabled: true },
  { id: "wise", label: "Wise", enabled: false },
  { id: "revolut", label: "Revolut", enabled: false },
  { id: "paypal", label: "PayPal", enabled: false },
  { id: "instant-payout", label: "Instant Payout", enabled: false },
] as const;

export const PAYMENTS_ENGINE_FILTERS: { id: PaymentsEngineFilterId; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "authorized", label: "Authorized" },
  { id: "captured", label: "Captured" },
  { id: "protected", label: "Protected" },
  { id: "completed", label: "Completed" },
  { id: "failed", label: "Failed" },
  { id: "refunded", label: "Refunded" },
  { id: "cancelled", label: "Cancelled" },
  { id: "disputed", label: "Disputed" },
];

export const PAYMENTS_ENGINE_TIMELINE_EVENTS = [
  { id: "checkout-started", label: "Checkout Started" },
  { id: "authorization", label: "Authorization" },
  { id: "verification", label: "Verification" },
  { id: "capture", label: "Capture" },
  { id: "protection-hold", label: "Protection Hold" },
  { id: "shipping-started", label: "Shipping Started" },
  { id: "delivered", label: "Delivered" },
  { id: "buyer-confirmed", label: "Buyer Confirmed" },
  { id: "funds-released", label: "Funds Released" },
  { id: "withdrawal", label: "Withdrawal" },
  { id: "completed", label: "Completed" },
] as const;

export function registerPaymentsEngineModule(module: PaymentsEngineModule): PaymentsEngineModule[] {
  const index = PAYMENTS_ENGINE_MODULES.findIndex((item) => item.id === module.id);
  if (index >= 0) {
    const next = [...PAYMENTS_ENGINE_MODULES];
    next[index] = module;
    return next;
  }
  return [...PAYMENTS_ENGINE_MODULES, module];
}
