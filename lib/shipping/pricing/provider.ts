import type { UkCarrier } from "@/lib/shipping/carriers";
import type { ParcelTier, ShippingAddress, ShippingQuote } from "@/lib/shipping/types";

export type ShippingQuoteRequest = {
  parcelTier: ParcelTier;
  weightKg?: number;
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
};

export type ShippingLabelResponse = {
  available: boolean;
  trackingNumber: string | null;
  barcode: string | null;
  qrPayload: string | null;
  pdfUrl: string | null;
  carrier: UkCarrier | string | null;
  reason?: "provider_not_configured" | "quote_expired";
};

/** Provider contract — GoShippo and future carriers implement this interface. */
export interface ShippingProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  getQuotes(request: ShippingQuoteRequest): Promise<ShippingQuoteResponse>;
  createLabel(request: ShippingLabelRequest): Promise<ShippingLabelResponse>;
}
