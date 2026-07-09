import { allCarrierNames, type UkCarrier } from "@/lib/shipping/carriers";
import type {
  CheckoutCarrierQuote,
  CheckoutShippingQuoteReason,
  CheckoutShippingQuotesResult,
} from "@/lib/checkout/types";

export type DeliveryOptionId = string;

export const UNAVAILABLE_SHIPPING_PRICE_LABEL = "Unable to retrieve shipping price.";
export const SHIPPING_INCLUDED_LABEL = "Shipping included";
export const SELLER_DISPATCH_NOT_READY_LABEL =
  "The seller is still setting up dispatch. Message them to confirm delivery, or try again later.";
export const SHIPPING_ADDRESS_INCOMPLETE_LABEL =
  "Add a complete delivery address to see shipping options.";
export const SHIPPING_PROVIDER_UNAVAILABLE_LABEL =
  "Shipping rates are temporarily unavailable. Try again in a moment.";

export function resolveCheckoutShippingMessage(
  reason: CheckoutShippingQuoteReason | null | undefined,
): string | null {
  if (!reason) return null;
  if (reason === "seller_dispatch_not_ready") return SELLER_DISPATCH_NOT_READY_LABEL;
  if (reason === "address_incomplete") return SHIPPING_ADDRESS_INCOMPLETE_LABEL;
  return SHIPPING_PROVIDER_UNAVAILABLE_LABEL;
}

export const CHECKOUT_CARRIERS = allCarrierNames();

export async function resolveLiveDeliveryQuotes(input: {
  productSlug: string;
  recipientName: string;
  addressLine: string;
  postcode: string;
  country: string;
}): Promise<CheckoutShippingQuotesResult> {
  const response = await fetch("/api/checkout/shipping-quotes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    return { live: false, options: [], reason: "provider_unavailable" };
  }

  return (await response.json()) as CheckoutShippingQuotesResult;
}

export function getDeliveryPrice(
  options?: {
    listingOffersFreeDelivery?: boolean;
    listingShippingPrice?: number | null;
    selectedQuote?: CheckoutCarrierQuote | null;
    liveQuotesAttempted?: boolean;
  },
): number | null {
  if (options?.listingOffersFreeDelivery) {
    return 0;
  }
  if (options?.selectedQuote) {
    return options.selectedQuote.price;
  }
  if (options?.listingShippingPrice != null && options.listingShippingPrice >= 0) {
    return options.listingShippingPrice;
  }
  return null;
}

export function getDeliveryCarrierFromQuote(quote: CheckoutCarrierQuote | null | undefined): UkCarrier | string {
  return quote?.carrier ?? "Royal Mail";
}

export function shouldShowUnavailableShippingPrice(options: {
  listingOffersFreeDelivery?: boolean;
  listingShippingPrice?: number | null;
  liveQuotesAttempted?: boolean;
  liveQuotesLoading?: boolean;
  selectedQuote?: CheckoutCarrierQuote | null;
}): boolean {
  if (options.listingOffersFreeDelivery) return false;
  if (options.liveQuotesLoading) return false;
  if (options.selectedQuote) return false;
  if (options.listingShippingPrice != null && options.listingShippingPrice >= 0) return false;
  return Boolean(options.liveQuotesAttempted);
}

export function pickDefaultShippingQuote(options: CheckoutCarrierQuote[]): CheckoutCarrierQuote | null {
  if (options.length === 0) return null;
  return [...options].sort((a, b) => a.price - b.price)[0] ?? null;
}
