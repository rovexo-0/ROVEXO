import type { OrdersEngineFilterId, OrdersEngineModule } from "@/lib/orders-engine/types";

export const ORDERS_ENGINE_MODULES: OrdersEngineModule[] = [
  { id: "buyer-orders", label: "Orders", icon: "🛍️", description: "Timeline, tracking, protection, returns", href: "/orders" },
  { id: "selling-orders", label: "Selling Orders", icon: "🏷️", description: "Incoming orders, dispatch, payouts", href: "/seller/orders" },
  { id: "business-orders", label: "Business Orders", icon: "🏢", description: "Order queue and bulk processing", href: "/business/dashboard" },
  { id: "timeline", label: "Order Timeline", icon: "🕒", description: "Complete transaction lifecycle", href: "/orders?tab=timeline" },
  { id: "shipping", label: "Shipping Integration", icon: "🚚", description: "Shipping Engine connection", href: "/shipping" },
  { id: "wallet", label: "Wallet Engine", icon: "👛", description: "Balances, payouts, and ledger", href: "/wallet" },
  { id: "protection", label: "Purchase Protection", icon: "🛡️", description: "Trust, disputes, and fund protection", href: "/protection" },
  { id: "returns", label: "Returns", icon: "↩️", description: "Return requests and refunds", href: "/orders?tab=returns" },
  { id: "analytics", label: "Analytics", icon: "📈", description: "Order metrics and performance", href: "/orders?tab=analytics" },
];

export const ORDERS_ENGINE_LIFECYCLE_STAGES = [
  "draft", "checkout-started", "payment-pending", "payment-authorized", "order-created",
  "seller-accepted", "preparing-shipment", "awaiting-collection", "collected", "in-transit",
  "out-for-delivery", "delivered", "buyer-confirmation-pending", "completed",
  "return-requested", "returned", "refunded", "disputed", "cancelled", "archived",
] as const;

export const ORDERS_ENGINE_TIMELINE_EVENTS = [
  { id: "created", label: "Order Created" },
  { id: "paid", label: "Payment Completed" },
  { id: "accepted", label: "Accepted" },
  { id: "packed", label: "Packed" },
  { id: "collected", label: "Collected" },
  { id: "dispatched", label: "Dispatched" },
  { id: "tracking-updated", label: "Tracking Updated" },
  { id: "delivered", label: "Delivered" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "returned", label: "Returned" },
  { id: "cancelled", label: "Cancelled" },
  { id: "refund-initiated", label: "Refund Initiated" },
  { id: "refunded", label: "Refund Completed" },
  { id: "disputed", label: "Disputed" },
] as const;

export const ORDERS_ENGINE_FILTERS: { id: OrdersEngineFilterId; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "paid", label: "Paid" },
  { id: "processing", label: "Processing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "completed", label: "Completed" },
  { id: "returned", label: "Returned" },
  { id: "refunded", label: "Refunded" },
  { id: "cancelled", label: "Cancelled" },
  { id: "disputed", label: "Disputed" },
];

export function registerOrdersEngineModule(module: OrdersEngineModule): OrdersEngineModule[] {
  const index = ORDERS_ENGINE_MODULES.findIndex((item) => item.id === module.id);
  if (index >= 0) {
    const next = [...ORDERS_ENGINE_MODULES];
    next[index] = module;
    return next;
  }
  return [...ORDERS_ENGINE_MODULES, module];
}
