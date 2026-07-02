import type {
  ShippingEngineCarrierSetting,
  ShippingEngineModule,
  ShippingEngineTrackingStage,
} from "@/lib/shipping-engine/types";
import { UK_CARRIERS } from "@/lib/shipping/carriers";

/** Shipping Engine core modules — auto-register across admin OS. */
export const SHIPPING_ENGINE_MODULES: ShippingEngineModule[] = [
  { id: "manager", label: "Shipping Manager", icon: "📦", description: "Central shipping operations", href: "/shipping" },
  { id: "profiles", label: "Shipping Profiles", icon: "👤", description: "Buyer, seller, business profiles", href: "/shipping?tab=profiles" },
  { id: "rules", label: "Shipping Rules", icon: "📐", description: "Conditional shipping rules", href: "/super-admin/shipping-engine?tab=rules" },
  { id: "zones", label: "Shipping Zones", icon: "🌍", description: "UK and future international zones", href: "/super-admin/shipping-engine?tab=zones" },
  { id: "methods", label: "Shipping Methods", icon: "🚚", description: "Standard, express, collection, pickup", href: "/super-admin/shipping-engine?tab=methods" },
  { id: "timeline", label: "Shipping Timeline", icon: "🕒", description: "Full shipment timeline", href: "/shipping?tab=timeline" },
  { id: "labels", label: "Shipping Labels", icon: "🏷️", description: "Seller, carrier, and ROVEXO labels", href: "/shipping?tab=labels" },
  { id: "tracking", label: "Tracking Engine", icon: "📍", description: "Carrier-independent tracking", href: "/shipping?tab=tracking" },
  { id: "delivery", label: "Delivery Confirmation", icon: "✅", description: "Buyer and seller confirmations", href: "/shipping?tab=delivery" },
  { id: "returns", label: "Returns", icon: "↩️", description: "Return requests and refund flow", href: "/shipping?tab=returns" },
];

export const SHIPPING_ENGINE_TRACKING_STAGES: { id: ShippingEngineTrackingStage; label: string }[] = [
  { id: "order-created", label: "Order Created" },
  { id: "awaiting-dispatch", label: "Awaiting Dispatch" },
  { id: "dispatched", label: "Dispatched" },
  { id: "collected", label: "Collected" },
  { id: "in-transit", label: "In Transit" },
  { id: "out-for-delivery", label: "Out For Delivery" },
  { id: "delivered", label: "Delivered" },
  { id: "delivery-confirmed", label: "Delivery Confirmed" },
  { id: "returned", label: "Returned" },
  { id: "cancelled", label: "Cancelled" },
];

export const FUTURE_CARRIER_IDS = [
  "Royal Mail",
  "Evri",
  "DPD",
  "UPS",
  "DHL",
  "FedEx",
  "Parcelforce",
  "InPost",
  "Amazon Shipping",
  "ROVEXO Shipping",
] as const;

export function createDefaultCarrierSettings(): ShippingEngineCarrierSetting[] {
  return [
    ...UK_CARRIERS.map((carrier) => ({
      id: carrier.id,
      name: carrier.label,
      enabled: true,
      integrationReady: false,
      trackingSupported: carrier.trackingSupported,
      labelSupported: false,
    })),
    { id: "DHL", name: "DHL", enabled: false, integrationReady: false, trackingSupported: true, labelSupported: false },
    { id: "Amazon Shipping", name: "Amazon Shipping", enabled: false, integrationReady: false, trackingSupported: true, labelSupported: false },
    { id: "ROVEXO Shipping", name: "ROVEXO Shipping", enabled: false, integrationReady: false, trackingSupported: true, labelSupported: true },
  ];
}

export function registerShippingEngineModule(module: ShippingEngineModule): ShippingEngineModule[] {
  const index = SHIPPING_ENGINE_MODULES.findIndex((item) => item.id === module.id);
  if (index >= 0) {
    const next = [...SHIPPING_ENGINE_MODULES];
    next[index] = module;
    return next;
  }
  return [...SHIPPING_ENGINE_MODULES, module];
}
