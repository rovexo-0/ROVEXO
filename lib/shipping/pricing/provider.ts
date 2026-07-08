import type { UkCarrier } from "@/lib/shipping/carriers";
import type { ParcelTier, ShippingAddress, ShippingQuote } from "@/lib/shipping/types";

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
  /** Idempotency key so the same parcel cannot create two Parcel2Go shipments. */
  idempotencyKey?: string;
};

export type ShippingLabelResponse = {
  available: boolean;
  trackingNumber: string | null;
  barcode: string | null;
  qrPayload: string | null;
  pdfUrl: string | null;
  carrier: UkCarrier | string | null;
  reason?: "provider_not_configured" | "quote_expired";
  /** Parcel2Go provider metadata — used for DB persistence and webhook mapping. */
  parcel2GoOrderId?: string | null;
  parcel2GoOrderLineId?: string | null;
  parcel2GoOrderLineHmac?: string | null;
  serviceCode?: string | null;
};

/** Provider contract — GoShippo and future carriers implement this interface. */
export interface ShippingProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  getQuotes(request: ShippingQuoteRequest): Promise<ShippingQuoteResponse>;
  createLabel(request: ShippingLabelRequest): Promise<ShippingLabelResponse>;
}
