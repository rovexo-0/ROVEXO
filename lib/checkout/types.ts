import type { UkCarrier } from "@/lib/shipping/carriers";
import type { ShippingQuoteApiVersion } from "@/lib/shipping/types";

export type CheckoutCarrierQuote = {
  id: string;
  carrier: UkCarrier | string;
  serviceName: string;
  price: number;
  eta: string;
  /** Optional V3 metadata for persistence bridges — not shown in checkout UX. */
  shippingOptionCode?: string;
  contractId?: string;
  v2MethodId?: number;
  quoteApiVersion?: ShippingQuoteApiVersion;
};

export type CheckoutShippingQuoteReason =
  | "seller_dispatch_not_ready"
  | "address_incomplete"
  | "provider_unavailable"
  | "no_supported_carriers"
  | "product_unavailable";

export type CheckoutShippingQuotesResult = {
  live: boolean;
  options: CheckoutCarrierQuote[];
  reason?: CheckoutShippingQuoteReason | null;
};
