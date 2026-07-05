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
export const LEGACY_PARCEL_SIZES = ["small", "medium", "large", "xl"] as const;
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
  validated: boolean;
};

export type ShippingQuote = {
  id: string;
  providerId: string;
  carrier: UkCarrier | string;
  serviceName: string;
  pricePence: number;
  currency: "GBP";
  estimatedDays: { min: number; max: number };
  recommended?: "cheapest" | "fastest";
  expiresAt?: string;
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
  trackingEvents: ShippingTrackingEvent[];
  createdAt: string;
  updatedAt: string;
};
