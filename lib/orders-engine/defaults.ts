import { ORDERS_ENGINE_FILTERS } from "@/lib/orders-engine/registry";
import type { OrdersEngineDocument, OrdersEngineHistoryEntry } from "@/lib/orders-engine/types";

const now = () => new Date().toISOString();

export function createDefaultOrdersEngineDocument(label = "ROVEXO Orders Engine"): OrdersEngineDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    marketplaceVersion: "ROVEXO v1.0",
    primaryCountry: "United Kingdom",
    currency: "GBP",
    orderTypes: [
      { id: "marketplace", label: "Marketplace Order", enabled: true },
      { id: "business", label: "Business Order", enabled: true },
      { id: "collection", label: "Collection Order", enabled: true },
      { id: "digital-reservation", label: "Digital Reservation", enabled: false },
      { id: "auction", label: "Auction Order", enabled: false },
    ],
    filters: ORDERS_ENGINE_FILTERS.map((f) => ({ ...f, enabled: true })),
    notifications: createDefaultNotifications(),
    analyticsEnabled: true,
    aiAssistant: {
      globalEnabled: false,
      orderSummaries: true,
      statusExplanations: true,
      sellerRecommendations: true,
      buyerAssistance: true,
      orderAnalytics: true,
      execution: "local",
    },
    integrations: {
      shippingEngine: true,
      trackingEngine: true,
      shippingLabels: true,
      deliveryConfirmation: true,
      returns: true,
      wallet: true,
      payments: true,
      buyerProtection: true,
    },
    futureReady: [
      "Auction Orders",
      "Split Orders",
      "Combined Orders",
      "Business Fulfilment",
      "Warehouse Management",
      "ROVEXO Fulfilment",
      "International Orders",
      "Subscription Orders",
    ],
    auditLog: [],
  };
}

export function createDefaultOrdersEngineHistory(): OrdersEngineHistoryEntry[] {
  return [];
}

function createDefaultNotifications(): OrdersEngineDocument["notifications"] {
  return [
    { id: "buyer-confirmed", audience: "buyer", event: "order_confirmed", enabled: true },
    { id: "buyer-accepted", audience: "buyer", event: "order_accepted", enabled: true },
    { id: "buyer-tracking", audience: "buyer", event: "tracking_updated", enabled: true },
    { id: "buyer-delivered", audience: "buyer", event: "delivered", enabled: true },
    { id: "buyer-completed", audience: "buyer", event: "completed", enabled: true },
    { id: "buyer-return", audience: "buyer", event: "return_update", enabled: true },
    { id: "seller-new", audience: "seller", event: "new_order", enabled: true },
    { id: "seller-payment", audience: "seller", event: "payment_received", enabled: true },
    { id: "seller-dispatch", audience: "seller", event: "dispatch_required", enabled: true },
    { id: "seller-return", audience: "seller", event: "return_request", enabled: true },
    { id: "seller-dispute", audience: "seller", event: "dispute_opened", enabled: true },
    { id: "admin-high-value", audience: "administrator", event: "high_value_order", enabled: true },
    { id: "admin-failed", audience: "administrator", event: "failed_order", enabled: true },
    { id: "admin-payment-error", audience: "administrator", event: "payment_error", enabled: true },
    { id: "admin-shipping-delay", audience: "administrator", event: "shipping_delay", enabled: true },
    { id: "admin-dispute", audience: "administrator", event: "dispute", enabled: true },
  ];
}
