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
  parcelTierToDimensions,
  resolveCompleteParcelMeasurements,
  resolveLabelParcelMeasurements,
  resolveListingParcelTier,
  PARCEL_MEASUREMENTS_REQUIRED_FOR_LABEL,
} from "@/lib/shipping/parcels";

export {
  CANONICAL_PARCEL_SIZES_V1,
  OWNER_APPROVED_PARCEL_BANDS_V1,
  PARCEL_SIZE_CANONICAL_V1,
  resolveCanonicalParcelSize,
  canonicalParcelMeasurements,
  formatCanonicalParcelSummary,
  formatCanonicalMaxDimensionsLine,
  formatCanonicalMaxWeightLine,
  getV1_0ParcelShippingDetailsBlocks,
} from "@/lib/shipping/canonical-parcel-size-v1";

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

export {
  V1_0_ACTIVE_CARRIERS,
  V1_0_HIDDEN_CARRIERS,
  V1_0_CARRIER_WHITELIST_V1,
  V1_0_CARRIER_GROUP_CODE,
  isV1_0ActiveCarrier,
  isV1_0HiddenCarrier,
  resolveV1_0ActiveCarrier,
  resolveV1_0CarrierGroupCode,
  filterV1_0CustomerFacingQuotes,
  formatV1_0CarrierDisplayName,
} from "@/lib/shipping/v1-0-carrier-whitelist-v1";

export {
  BUYER_SHIPPING_MARGIN_PENCE,
  BUYER_SHIPPING_PRICE_V1,
  toBuyerShippingPricePence,
  penceToGbpMajor,
  gbpMajorToPence,
  toBuyerShippingGbpFromProviderPence,
} from "@/lib/shipping/pricing/buyer-shipping-price-v1";

export {
  CARRIER_ICON_REGISTRY_V1,
  resolveCarrierIconSrc,
} from "@/lib/shipping/carrier-icons-v1";

export { getOrderShipment, createOrderShipment, updateShipmentStatus } from "@/lib/shipping/service";
