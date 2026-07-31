/**
 * ROVEXO Shipping Engine v1.0 — public API.
 * All pages and services must import shipping logic from here.
 *
 * Scope lock SSOT: lib/shipping/shipping-engine-v1-scope-lock.ts
 */

export {
  SHIPPING_ENGINE_V1_SCOPE_LOCK,
  assertShippingEngineV1ScopeLock,
} from "@/lib/shipping/shipping-engine-v1-scope-lock";
export type { ShippingEngineV1ScopeLock } from "@/lib/shipping/shipping-engine-v1-scope-lock";

export { ShippingService } from "@/lib/shipping/engine";
export type { ShippingRecord, ShippingStatus, ParcelTier, ShippingAddress } from "@/lib/shipping/engine";

export {
  SERVICE_POINT_ENGINE_V1,
  isServicePointEngineEnabled,
  servicePointEngineDisabledBody,
  servicePointEngineDisabledResponse,
  assertServicePointEngineEnabled,
} from "@/lib/shipping/service-point-engine-v1";
export type { ServicePointDisabledBody } from "@/lib/shipping/service-point-engine-v1";

export {
  PARCEL_TIERS,
  SHIPPING_STATUSES,
  type LegacyParcelSize,
  type ParcelDetectionInput,
  type ParcelDetectionResult,
  type ShippingLabelArtifact,
  type ShippingPricing,
  type ShippingQuote,
  type ShippingTrackingEvent,
} from "@/lib/shipping/types";

export {
  PARCEL_TIER_OPTIONS,
  detectParcelTier,
  recommendParcelTier,
  mapLegacyParcelSize,
  mapTierToLegacySize,
  parcelTierLabel,
  isParcelTier,
  isLegacyParcelSize,
} from "@/lib/shipping/parcels";

export {
  SHIPPING_STATUS_LABELS,
  shippingStatusLabel,
  mapLegacyShipmentStatus,
  mapToLegacyShipmentStatus,
} from "@/lib/shipping/status";

export { buildTrackingTimeline, createTrackingEvent } from "@/lib/shipping/tracking";
export { validateUkShippingAddress, formatShippingAddress } from "@/lib/shipping/addresses";
export { fetchShippingQuotes, getConfiguredProviders } from "@/lib/shipping/pricing/service";
export type { ShippingProvider, ShippingQuoteRequest, ShippingLabelRequest } from "@/lib/shipping/pricing/provider";

export {
  UK_CARRIERS,
  SHIPPING_METHODS,
  getCarrier,
  estimateDeliveryDate,
  isValidTrackingNumber,
  shipmentStatusLabel,
  allCarrierNames,
  type UkCarrier,
  type ShippingMethod,
  type ShipmentStatus,
} from "@/lib/shipping/carriers";

export { getOrderShipment, createOrderShipment, updateShipmentStatus } from "@/lib/shipping/service";
