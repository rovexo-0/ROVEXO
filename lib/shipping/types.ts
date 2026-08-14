import type { UkCarrier } from "@/lib/shipping/carriers";

/** Canonical parcel tiers for the ROVEXO Shipping Engine v1.0 */
export const PARCEL_TIERS = [
  "letter",
  "small_parcel",
  "medium_parcel",
  "large_parcel",
  "xl_parcel",
] as const;

export type ParcelTier = (typeof PARCEL_TIERS)[number];

/** Legacy sell-flow parcel sizes — mapped to canonical tiers via `lib/shipping/parcels`. */
export const LEGACY_PARCEL_SIZES = ["small", "medium", "large", "xl", "custom"] as const;
export type LegacyParcelSize = (typeof LEGACY_PARCEL_SIZES)[number];

/** Canonical shipping lifecycle states */
export const SHIPPING_STATUSES = [
  "preparing",
  "collected",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "returned",
  "cancelled",
  "lost",
  "failed",
] as const;

export type ShippingStatus = (typeof SHIPPING_STATUSES)[number];

export type ParcelDimensions = {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

export type ParcelDetectionInput = {
  weightKg?: number;
  dimensions?: Partial<ParcelDimensions>;
  categorySlug?: string | null;
  legacyParcelSize?: LegacyParcelSize | null;
  manualTier?: ParcelTier | null;
};

export type ParcelDetectionResult = {
  recommendedTier: ParcelTier;
  appliedTier: ParcelTier;
  source: "manual" | "ai" | "dimensions" | "category" | "legacy";
  confidence: "high" | "medium" | "low";
};

export type ShippingAddressRole = "buyer" | "seller" | "collection" | "delivery";

export type ShippingAddress = {
  id?: string;
  role: ShippingAddressRole;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
  phone?: string;
  /** Optional contact email for carrier announce (e.g. Sendcloud InPost). */
  email?: string;
  validated: boolean;
};

/**
 * Quote API generation surface for Sendcloud dual-identity quotes.
 * - v2: legacy method-id quote identity only (no confirmed V3 label code)
 * - v3: V3 shipping_option_code present without a V2 method bridge
 * - v2+v3: legacy quote id + confirmed V3 label identity
 */
export type ShippingQuoteApiVersion = "v2" | "v3" | "v2+v3";

export type ShippingQuote = {
  id: string;
  /**
   * shipping_quotes row UUID when hydrate remaps `id` → externalQuoteId (e.g. sendcloud:N).
   * Used only to resolve selected_quote_id row UUIDs — never sent to Sendcloud as quote id.
   */
  quoteRowId?: string;
  providerId: string;
  carrier: UkCarrier | string;
  serviceName: string;
  pricePence: number;
  currency: "GBP";
  estimatedDays: { min: number; max: number };
  estimatedDeliveryAt?: string | null;
  recommended?: "cheapest" | "fastest";
  expiresAt?: string;
  /**
   * Confirmed Sendcloud V3 shipping_option_code for label creation.
   * NEVER derived from V2 method.id / sendcloud:<methodId>.
   * Optional — legacy V2-only quotes omit this (label path fail-closed).
   */
  shippingOptionCode?: string;
  /** Optional Sendcloud contract id when actually returned by V3 discovery. */
  contractId?: string;
  /** Sendcloud-specific V2 shipping method id (legacy bridge). Never treat as shippingOptionCode. */
  v2MethodId?: number;
  /** Which API surfaces contributed to this quote identity. */
  quoteApiVersion?: ShippingQuoteApiVersion;
  /**
   * Sendcloud method weight envelope (kg) when provided by provider.
   * Used for checkout eligibility vs canonical parcel weight — never invent from serviceName.
   */
  minWeightKg?: number;
  maxWeightKg?: number;
};

/** Persisted jsonb payload on shipping_quotes — preserves V3 metadata without a migration. */
export type ShippingQuotePayload = {
  externalQuoteId: string;
  v2MethodId?: number;
  shippingOptionCode?: string;
  contractId?: string;
  quoteApiVersion?: ShippingQuoteApiVersion;
};

export type ShippingPricing = {
  quotes: ShippingQuote[];
  selectedQuoteId: string | null;
  currency: "GBP";
  providerAvailable: boolean;
};

export type ShippingLabelArtifact = {
  trackingNumber: string | null;
  barcode: string | null;
  qrPayload: string | null;
  pdfUrl: string | null;
  carrier: UkCarrier | string;
  status: "pending" | "ready" | "void";
};

export type ShippingTrackingEvent = {
  id: string;
  status: ShippingStatus;
  title: string;
  description?: string;
  location?: string;
  occurredAt: string;
  source: "system" | "carrier" | "seller" | "buyer";
};

export type ShippingRecord = {
  id: string;
  orderId: string;
  parcelTier: ParcelTier;
  status: ShippingStatus;
  carrier: UkCarrier | string | null;
  trackingNumber: string | null;
  collectionAddress: ShippingAddress | null;
  deliveryAddress: ShippingAddress | null;
  pricing: ShippingPricing | null;
  label: ShippingLabelArtifact | null;
  parcels: ShipmentParcel[];
  trackingEvents: ShippingTrackingEvent[];
  createdAt: string;
  updatedAt: string;
};

export type ShipmentParcelLabel = {
  id: string;
  pdfUrl: string | null;
  labelUrl: string | null;
  status: "pending" | "ready" | "void";
};

export const PARCEL_OPERATIONS = ["return", "claim", "lost", "damaged"] as const;
export type ParcelOperation = (typeof PARCEL_OPERATIONS)[number];

export type ShipmentParcel = {
  id: string;
  shippingRecordId: string;
  parcelNumber: number;
  totalParcels: number;
  weightKg: number | null;
  dimensions: {
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
  } | null;
  carrier: string | null;
  shippingService: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: ShippingStatus;
  productItemIds: string[];
  insuranceEnabled: boolean;
  insuranceValueGbp: number | null;
  operation: ParcelOperation | null;
  estimatedDeliveryAt: string | null;
  label: ShipmentParcelLabel | null;
  createdAt: string;
  updatedAt: string;
};
