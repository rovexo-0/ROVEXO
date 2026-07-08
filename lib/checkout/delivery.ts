import { allCarrierNames, type UkCarrier } from "@/lib/shipping/carriers";
import type { CheckoutCarrierQuote } from "@/lib/checkout/types";

export type DeliveryOptionId = string;

export const UNAVAILABLE_SHIPPING_PRICE_LABEL = "Unable to retrieve shipping price.";
export const SHIPPING_INCLUDED_LABEL = "Shipping included";

export const CHECKOUT_CARRIERS = allCarrierNames();

export async function resolveLiveDeliveryQuotes(input: {
  productSlug: string;
  recipientName: string;
  addressLine: string;
  postcode: string;
  country: string;
}): Promise<{ live: boolean; options: CheckoutCarrierQuote[] }> {
  const response = await fetch("/api/checkout/shipping-quotes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    return { live: false, options: [] };
  }

  return (await response.json()) as { live: boolean; options: CheckoutCarrierQuote[] };
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
