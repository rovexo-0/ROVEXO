import { createDefaultCarrierSettings } from "@/lib/shipping-engine/registry";
import type { ShippingEngineDocument, ShippingEngineHistoryEntry } from "@/lib/shipping-engine/types";

const now = () => new Date().toISOString();

export function createDefaultShippingEngineDocument(label = "ROVEXO Shipping Engine"): ShippingEngineDocument {
  return {
    version: 1,
    updatedAt: now(),
    label,
    marketplaceVersion: "ROVEXO v1.0",
    primaryCountry: "United Kingdom",
    currency: "GBP",
    methods: createDefaultMethods(),
    zones: createDefaultZones(),
    rules: createDefaultRules(),
    carriers: createDefaultCarrierSettings(),
    returnRules: createDefaultReturnRules(),
    trackingRules: createDefaultTrackingRules(),
    notifications: createDefaultNotifications(),
    analyticsMetrics: createDefaultAnalyticsMetrics(),
    addressValidation: {
      buyerConfirmBeforePayment: true,
      sellerConfirmBeforeDispatch: true,
      blockUntilConfirmed: true,
    },
    buyerProtection: {
      enabled: true,
      fundsProtectedUntilDeliveryConfirmed: true,
      integratesWithWallet: true,
      integratesWithOrders: true,
      integratesWithPayments: true,
    },
    aiAssistant: {
      globalEnabled: false,
      shipmentSummaries: true,
      trackingAssistance: true,
      addressSuggestions: true,
      deliveryInsights: true,
      execution: "local",
    },
    auditLog: [],
  };
}

export function createDefaultShippingEngineHistory(): ShippingEngineHistoryEntry[] {
  return [];
}

function createDefaultMethods(): ShippingEngineDocument["methods"] {
  return [
    { id: "standard", label: "Standard Delivery", description: "2–4 business days", enabled: true, zoneIds: ["uk"], estimatedDays: { min: 2, max: 4 } },
    { id: "express", label: "Express Delivery", description: "1–2 business days", enabled: true, zoneIds: ["uk"], estimatedDays: { min: 1, max: 2 } },
    { id: "next-day", label: "Next Day", description: "Next working day", enabled: true, zoneIds: ["uk"], estimatedDays: { min: 1, max: 1 } },
    { id: "collection", label: "Collection", description: "Buyer collects from seller", enabled: true, zoneIds: ["uk"], estimatedDays: { min: 0, max: 1 } },
    { id: "local-pickup", label: "Local Pickup", description: "Local pickup point", enabled: true, zoneIds: ["uk"], estimatedDays: { min: 0, max: 2 } },
    { id: "seller-delivery", label: "Seller Delivery", description: "Seller delivers locally", enabled: true, zoneIds: ["uk"], estimatedDays: { min: 0, max: 1 } },
    { id: "rovexo-delivery", label: "Future ROVEXO Delivery", description: "Reserved for ROVEXO logistics", enabled: false, zoneIds: ["uk"], estimatedDays: { min: 1, max: 3 } },
  ];
}

function createDefaultZones(): ShippingEngineDocument["zones"] {
  return [
    { id: "uk", label: "United Kingdom", countryCodes: ["GB"], currency: "GBP", enabled: true },
    { id: "eu", label: "European Union", countryCodes: ["IE", "FR", "DE", "ES", "IT", "NL"], currency: "EUR", enabled: false },
    { id: "international", label: "International", countryCodes: ["*"], currency: "GBP", enabled: false },
  ];
}

function createDefaultRules(): ShippingEngineDocument["rules"] {
  return [
    { id: "require-address-buyer", name: "Buyer address confirmation", description: "Block payment until delivery address confirmed", condition: "checkout.before_payment", action: "require_address_confirmation", enabled: true, priority: 1 },
    { id: "require-address-seller", name: "Seller dispatch confirmation", description: "Block dispatch until shipping address confirmed", condition: "fulfillment.before_dispatch", action: "require_address_confirmation", enabled: true, priority: 2 },
    { id: "tracking-required", name: "Tracking before dispatch", description: "Require tracking number for courier shipments", condition: "method.requires_tracking", action: "validate_tracking", enabled: true, priority: 3 },
  ];
}

function createDefaultReturnRules(): ShippingEngineDocument["returnRules"] {
  return [
    { id: "seller-approval", label: "Seller approval required", enabled: true },
    { id: "auto-approval", label: "Automatic approval after window", autoApprovalDays: 14, enabled: false },
  ];
}

function createDefaultTrackingRules(): ShippingEngineDocument["trackingRules"] {
  return [
    { id: "notify-status", label: "Notify on status change", requireTrackingBeforeDispatch: true, notifyOnStatusChange: true },
  ];
}

function createDefaultNotifications(): ShippingEngineDocument["notifications"] {
  return [
    { id: "buyer-dispatched", audience: "buyer", event: "order_dispatched", enabled: true },
    { id: "buyer-tracking", audience: "buyer", event: "tracking_updated", enabled: true },
    { id: "buyer-out-for-delivery", audience: "buyer", event: "out_for_delivery", enabled: true },
    { id: "buyer-delivered", audience: "buyer", event: "delivered", enabled: true },
    { id: "buyer-return", audience: "buyer", event: "return_update", enabled: true },
    { id: "seller-ship-required", audience: "seller", event: "shipping_required", enabled: true },
    { id: "seller-tracking-missing", audience: "seller", event: "tracking_missing", enabled: true },
    { id: "seller-delivered", audience: "seller", event: "delivery_completed", enabled: true },
    { id: "seller-return", audience: "seller", event: "return_requested", enabled: true },
    { id: "admin-alerts", audience: "administrator", event: "shipping_alert", enabled: true },
    { id: "admin-carrier", audience: "administrator", event: "carrier_issue", enabled: true },
    { id: "admin-tracking-error", audience: "administrator", event: "tracking_error", enabled: true },
    { id: "admin-delay", audience: "administrator", event: "delivery_delay", enabled: true },
  ];
}

function createDefaultAnalyticsMetrics(): ShippingEngineDocument["analyticsMetrics"] {
  return [
    { id: "delivered-orders", label: "Delivered Orders", ready: true },
    { id: "avg-delivery-time", label: "Average Delivery Time", ready: true },
    { id: "late-deliveries", label: "Late Deliveries", ready: true },
    { id: "failed-deliveries", label: "Failed Deliveries", ready: true },
    { id: "returns", label: "Returns", ready: true },
    { id: "carrier-performance", label: "Carrier Performance", ready: false },
    { id: "shipping-costs", label: "Shipping Costs", ready: false },
    { id: "tracking-success", label: "Tracking Success", ready: true },
  ];
}
