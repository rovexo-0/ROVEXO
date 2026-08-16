import type { UkCarrier } from "@/lib/shipping/carriers";
import type {
  CheckoutCarrierQuote,
  CheckoutShippingQuoteReason,
  CheckoutShippingQuotesResult,
} from "@/lib/checkout/types";
import { shareInflightRequest } from "@/lib/performance/fetch";
import { V1_0_ACTIVE_CARRIERS } from "@/lib/shipping/v1-0-carrier-whitelist-v1";

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
  if (reason === "no_supported_carriers" || reason === "product_unavailable") {
    return SHIPPING_PROVIDER_UNAVAILABLE_LABEL;
  }
  return SHIPPING_PROVIDER_UNAVAILABLE_LABEL;
}

/** v1.0 customer-facing whitelist only — InPost deferred to v1.1 (fail-closed). */
export const CHECKOUT_CARRIERS: UkCarrier[] = [...V1_0_ACTIVE_CARRIERS];

export async function resolveLiveDeliveryQuotes(input: {
  productSlug: string;
  recipientName: string;
  addressLine: string;
  postcode: string;
  country: string;
}): Promise<CheckoutShippingQuotesResult> {
  const key = [
    "POST:/api/checkout/shipping-quotes",
    input.productSlug,
    input.postcode.trim().toUpperCase(),
    input.addressLine.trim(),
    input.recipientName.trim(),
    input.country.trim().toUpperCase(),
  ].join(":");

  return shareInflightRequest(
    key,
    async () => {
      const response = await fetch("/api/checkout/shipping-quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        return { live: false, options: [], reason: "provider_unavailable" as const };
      }

      return (await response.json()) as CheckoutShippingQuotesResult;
    },
    { ttlMs: 0 },
  );
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
  // Live selected quote buyer price (provider pence + 15) is SSOT when present —
  // checkout display · totals · order persistence must match.
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

/**
 * Resolve which shipping quote id should be selected in Checkout.
 *
 * Rules (v1.0 carrier selection):
 * - Preserve previous selection when it remains in the eligible set.
 * - Exactly one eligible option → auto-select it.
 * - Two or more with no valid previous → leave empty so the buyer chooses
 *   (never force Royal Mail or any other carrier by brand).
 * - Empty set → clear selection (safe empty / unavailable path).
 */
export function resolveCheckoutDeliveryOptionId(
  options: CheckoutCarrierQuote[],
  previousId: string | null | undefined,
): string {
  if (options.length === 0) return "";
  const previous = previousId?.trim() ?? "";
  if (previous && options.some((option) => option.id === previous)) {
    return previous;
  }
  if (options.length === 1) {
    return options[0]!.id;
  }
  return "";
}

/** Single-option / preserved selection helper — never brand-forces Royal Mail. */
export function pickDefaultShippingQuote(
  options: CheckoutCarrierQuote[],
  previousId?: string | null,
): CheckoutCarrierQuote | null {
  const id = resolveCheckoutDeliveryOptionId(options, previousId);
  if (!id) return null;
  return options.find((option) => option.id === id) ?? null;
}
