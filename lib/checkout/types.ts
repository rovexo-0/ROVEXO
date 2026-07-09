import type { UkCarrier } from "@/lib/shipping/carriers";

export type CheckoutCarrierQuote = {
  id: string;
  carrier: UkCarrier | string;
  serviceName: string;
  price: number;
  eta: string;
};

export type CheckoutShippingQuoteReason =
  | "seller_dispatch_not_ready"
  | "address_incomplete"
  | "provider_unavailable";

export type CheckoutShippingQuotesResult = {
  live: boolean;
  options: CheckoutCarrierQuote[];
  reason?: CheckoutShippingQuoteReason | null;
};
