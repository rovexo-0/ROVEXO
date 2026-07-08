import type { ShippingAddress, ShippingQuote } from "@/lib/shipping/types";
import type { ShippingAddress as Parcel2GoShippingAddress, ShippingQuote as ProviderShippingQuote } from "@/src/services/shipping/types";
import { isParcel2GoQuoteId, parseParcel2GoQuoteId } from "@/src/services/shipping/parcel2go/quote-id";

export function mapLibAddressToParcel2Go(address: ShippingAddress): Parcel2GoShippingAddress {
  return {
    fullName: address.fullName,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    postcode: address.postcode,
    country: address.country,
    phone: address.phone,
  };
}

export function mapParcel2GoQuotesToLibQuotes(quotes: ProviderShippingQuote[]): ShippingQuote[] {
  const output: ShippingQuote[] = [];

  for (const quote of quotes) {
    for (const rate of quote.rates) {
      const minDays = rate.estimatedDays ?? 2;
      output.push({
        id: rate.id,
        providerId: "parcel2go",
        carrier: rate.carrier,
        serviceName: rate.serviceName,
        pricePence: Math.round(rate.amount * 100),
        currency: "GBP",
        estimatedDays: {
          min: Math.max(1, minDays),
          max: Math.max(minDays + 1, minDays),
        },
        expiresAt: rate.expiresAt ?? quote.expiresAt ?? undefined,
      });
    }
  }

  return output;
}

export function parseParcel2GoQuoteIdForLabel(quoteId: string) {
  if (!isParcel2GoQuoteId(quoteId)) return null;
  return parseParcel2GoQuoteId(quoteId);
}

export { isParcel2GoQuoteId, parseParcel2GoQuoteId };
