import type { UkCarrier } from "@/lib/shipping/carriers";
import type { SellerDefaultLabelSize } from "@/lib/shipping/label-size";
import type { ShippingLabelProviderFailure } from "@/lib/shipping/pricing/label-provider-failure-v1";
import type { ParcelTier, ShippingAddress, ShippingQuote } from "@/lib/shipping/types";

export type {
  ShippingLabelFailureKind,
  ShippingLabelProviderFailure,
} from "@/lib/shipping/pricing/label-provider-failure-v1";

export type ShippingQuoteRequest = {
  parcelTier: ParcelTier;
  weightKg?: number;
  declaredValueGbp?: number;
  collectionAddress: ShippingAddress;
  deliveryAddress: ShippingAddress;
  preferredCarriers?: UkCarrier[];
};

export type ShippingQuoteResponse = {
  available: boolean;
  quotes: ShippingQuote[];
  reason?: "provider_not_configured" | "no_services" | "invalid_address";
};

export type ShippingLabelRequest = {
  quoteId: string;
  orderId: string;
  orderNumber: string;
  parcelTier: ParcelTier;
  collectionAddress: ShippingAddress;
  deliveryAddress: ShippingAddress;
  declaredValueGbp?: number;
  parcelId?: string;
  parcelNumber?: number;
  /**
   * Real parcel measurements from shipment_parcels (P7.21).
   * Required for Sendcloud announce — never synthesize from parcel tier maxima.
   * Optional only for Full Demo / forceDemoShipping paths.
   */
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  /** Seller label format — Sendcloud label_printer (4×6) or normal_printer (A4). */
  labelSize?: SellerDefaultLabelSize;
  /** Idempotency key so the same parcel cannot create duplicate shipments. */
  idempotencyKey?: string;
  /** Force in-app demo adapter (Full Demo actors — never real Sendcloud). */
  forceDemoShipping?: boolean;
  /** Confirmed Sendcloud V3 shipping_option_code from persisted quote_payload. */
  shippingOptionCode?: string | null;
  contractId?: string | null;
  v2MethodId?: number | null;
  /** Existing provider parcel id — prevent duplicate shipment creation. */
  existingProviderParcelId?: number | null;
};

export type ShippingLabelResponse = {
  available: boolean;
  trackingNumber: string | null;
  barcode: string | null;
  qrPayload: string | null;
  pdfUrl: string | null;
  carrier: UkCarrier | string | null;
  reason?: "provider_not_configured" | "quote_expired";
  /** Structured provider failure — preserves statusCode/message/attempt (P7.1). */
  providerFailure?: ShippingLabelProviderFailure;
  /** Sendcloud provider metadata — used for DB persistence and webhook mapping. */
  sendcloudParcelId?: number | null;
  serviceCode?: string | null;
};

/** Provider contract — Sendcloud implements this interface. */
export interface ShippingProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  getQuotes(request: ShippingQuoteRequest): Promise<ShippingQuoteResponse>;
  createLabel(request: ShippingLabelRequest): Promise<ShippingLabelResponse>;
}
