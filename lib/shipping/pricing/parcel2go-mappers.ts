import { allCarrierNames } from "@/lib/shipping/carriers";
import type { UkCarrier } from "@/lib/shipping/carriers";
import type { ShippingAddress, ShippingQuote } from "@/lib/shipping/types";
import { transitDaysBetweenIsoDates } from "@/lib/shipping/delivery-estimate";
import type { ShippingAddress as Parcel2GoShippingAddress, ShippingQuote as ProviderShippingQuote } from "@/src/services/shipping/types";
import { isParcel2GoQuoteId, parseParcel2GoQuoteId } from "@/src/services/shipping/parcel2go/quote-id";

const CHECKOUT_CARRIER_NAMES = new Set<UkCarrier>(allCarrierNames());

/** Parcel2Go CourierName values are verbose (e.g. "Evri Collection") — normalize to checkout carriers. */
export function mapParcel2GoCarrier(courierName: string): UkCarrier | null {
  const normalized = courierName.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.includes("evri") || normalized.includes("hermes") || normalized.includes("yodel")) {
    return "Evri";
  }
  if (normalized.includes("parcelforce")) return "Parcelforce";
  if (normalized.includes("royal mail")) return "Royal Mail";
  if (normalized.includes("dpd")) return "DPD";
  if (normalized.includes("ups")) return "UPS";
  if (normalized.includes("fedex")) return "FedEx";
  if (normalized.includes("inpost")) return "InPost";

  for (const carrier of CHECKOUT_CARRIER_NAMES) {
    if (normalized.includes(carrier.toLowerCase())) return carrier;
  }

  return null;
}

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
      const carrier = mapParcel2GoCarrier(rate.carrier);
      if (!carrier) continue;

      const transitDays =
        rate.estimatedDays ??
        transitDaysBetweenIsoDates(
          parseParcel2GoQuoteId(rate.id)?.collectionDate ?? null,
          rate.estimatedDeliveryAt ?? parseParcel2GoQuoteId(rate.id)?.estimatedDeliveryDate ?? null,
        );
      const days = transitDays != null && transitDays > 0 ? transitDays : null;

      output.push({
        id: rate.id,
        providerId: "parcel2go",
        carrier,
        serviceName: rate.serviceName,
        pricePence: Math.round(rate.amount * 100),
        currency: "GBP",
        estimatedDays: {
          min: days ?? 0,
          max: days ?? 0,
        },
        estimatedDeliveryAt: rate.estimatedDeliveryAt ?? null,
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
