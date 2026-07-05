import type { UkCarrier } from "@/lib/shipping/carriers";
import { PARCEL_TIER_OPTIONS } from "@/lib/shipping/parcels";
import type { ShippingAddress, ShippingQuote, ParcelTier } from "@/lib/shipping/types";
import type { ShippoRate } from "@/lib/shipping/pricing/shippo-client";

export const SHIPPO_QUOTE_PREFIX = "shippo:";

const SHIPPO_CARRIER_MAP: Record<string, UkCarrier> = {
  royal_mail: "Royal Mail",
  hermes_uk: "Evri",
  evri: "Evri",
  dpd_uk: "DPD",
  dpd: "DPD",
  ups: "UPS",
  fedex: "FedEx",
  parcelforce: "Parcelforce",
  inpost: "InPost",
};

export function normalizeCountryCode(country: string): string {
  const normalized = country.trim().toLowerCase();
  if (normalized === "united kingdom" || normalized === "uk" || normalized === "gb") {
    return "GB";
  }
  if (normalized.length === 2) {
    return normalized.toUpperCase();
  }
  return country.trim().slice(0, 2).toUpperCase();
}

export function toShippoAddress(address: ShippingAddress) {
  return {
    name: address.fullName,
    street1: address.line1,
    street2: address.line2 ?? "",
    city: address.city,
    state: address.county ?? "",
    zip: address.postcode,
    country: normalizeCountryCode(address.country),
    phone: address.phone ?? "",
    validate: true,
  };
}

export function parcelSpecFromTier(tier: ParcelTier, weightKg?: number) {
  const option = PARCEL_TIER_OPTIONS.find((item) => item.id === tier);
  if (!option) {
    throw new Error(`Unknown parcel tier: ${tier}`);
  }

  const { maxDimensionsCm, maxWeightKg } = option;
  const weight = weightKg ?? Math.min(maxWeightKg, Math.max(0.1, maxWeightKg * 0.5));

  return {
    length: String(maxDimensionsCm.length),
    width: String(maxDimensionsCm.width),
    height: String(maxDimensionsCm.height),
    distance_unit: "cm" as const,
    weight: String(Number(weight.toFixed(3))),
    mass_unit: "kg" as const,
  };
}

export function mapShippoCarrier(provider: string): UkCarrier | string {
  const key = provider.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return SHIPPO_CARRIER_MAP[key] ?? provider;
}

export function parseShippoQuoteId(quoteId: string): string | null {
  if (!quoteId.startsWith(SHIPPO_QUOTE_PREFIX)) return null;
  const rateId = quoteId.slice(SHIPPO_QUOTE_PREFIX.length).trim();
  return rateId.length > 0 ? rateId : null;
}

export function mapShippoRateToQuote(rate: ShippoRate): ShippingQuote | null {
  if (!rate.object_id || rate.amount == null) return null;

  const amount = Number.parseFloat(rate.amount);
  if (!Number.isFinite(amount)) return null;

  const currency = (rate.currency ?? "GBP").toUpperCase();
  const pricePence = Math.round(amount * 100);
  const estimatedDays = rate.estimated_days ?? 2;

  return {
    id: `${SHIPPO_QUOTE_PREFIX}${rate.object_id}`,
    providerId: "shippo",
    carrier: mapShippoCarrier(rate.provider ?? rate.carrier ?? "Courier"),
    serviceName: rate.servicelevel?.name ?? rate.provider ?? "Standard",
    pricePence,
    currency: currency === "GBP" ? "GBP" : "GBP",
    estimatedDays: {
      min: Math.max(1, estimatedDays),
      max: Math.max(estimatedDays + 1, estimatedDays),
    },
    expiresAt: rate.object_created ?? undefined,
  };
}
