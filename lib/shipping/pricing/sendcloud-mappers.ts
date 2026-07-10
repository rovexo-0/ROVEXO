import type { UkCarrier } from "@/lib/shipping/carriers";
import { PARCEL_TIER_OPTIONS } from "@/lib/shipping/parcels";
import type { ParcelTier, ShippingAddress, ShippingQuote } from "@/lib/shipping/types";
import type { SendcloudParcelCreatePayload } from "@/lib/shipping/sendcloud/client";
import type { SendcloudShippingMethod } from "@/lib/shipping/sendcloud/types";
import { mapSendcloudCarrierToUk } from "@/lib/shipping/sendcloud/carrier-aliases";

export const SENDCLOUD_QUOTE_PREFIX = "sendcloud:";

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

export function isSendcloudQuoteId(quoteId: string): boolean {
  return quoteId.startsWith(SENDCLOUD_QUOTE_PREFIX);
}

export function parseSendcloudQuoteId(quoteId: string): number | null {
  if (!isSendcloudQuoteId(quoteId)) return null;
  const methodId = Number.parseInt(quoteId.slice(SENDCLOUD_QUOTE_PREFIX.length).trim(), 10);
  return Number.isFinite(methodId) && methodId > 0 ? methodId : null;
}

export function encodeSendcloudQuoteId(methodId: number): string {
  return `${SENDCLOUD_QUOTE_PREFIX}${methodId}`;
}

export function parcelSpecFromTier(tier: ParcelTier, weightKg?: number) {
  const option = PARCEL_TIER_OPTIONS.find((item) => item.id === tier);
  if (!option) {
    throw new Error(`Unknown parcel tier: ${tier}`);
  }

  const { maxDimensionsCm, maxWeightKg } = option;
  const weight = weightKg ?? Math.min(maxWeightKg, Math.max(0.1, maxWeightKg * 0.5));

  return {
    weightKg: Number(weight.toFixed(3)),
    lengthCm: maxDimensionsCm.length,
    widthCm: maxDimensionsCm.width,
    heightCm: maxDimensionsCm.height,
  };
}

function splitAddressLine(line1: string): { street: string; houseNumber: string } {
  const trimmed = line1.trim();
  const match = trimmed.match(/^(.*?)[,\s]+(\d+[A-Za-z]?)$/);
  if (match) {
    return { street: match[1].trim(), houseNumber: match[2] };
  }

  const leadingNumber = trimmed.match(/^(\d+[A-Za-z]?)\s+(.+)$/);
  if (leadingNumber) {
    return { street: leadingNumber[2].trim(), houseNumber: leadingNumber[1] };
  }

  return { street: trimmed, houseNumber: "-" };
}

export function toSendcloudAddress(address: ShippingAddress) {
  const { street, houseNumber } = splitAddressLine(address.line1);
  return {
    name: address.fullName,
    address: street,
    house_number: houseNumber,
    city: address.city,
    postal_code: address.postcode,
    country: normalizeCountryCode(address.country),
    telephone: address.phone ?? "",
    email: "",
  };
}

export function mapSendcloudMethodCarrier(carrier: string): UkCarrier | null {
  return mapSendcloudCarrierToUk(carrier);
}

function countryPriceForGb(method: SendcloudShippingMethod): number | null {
  const gb = method.countries.find((country) => country.iso_2 === "GB");
  return gb?.price ?? method.countries[0]?.price ?? null;
}

function leadTimeDays(method: SendcloudShippingMethod): { min: number; max: number } {
  const gb = method.countries.find((country) => country.iso_2 === "GB");
  const hours = gb?.lead_time_hours ?? 48;
  const days = Math.max(1, Math.ceil(hours / 24));
  return { min: days, max: days + 1 };
}

export function mapSendcloudMethodToQuote(method: SendcloudShippingMethod): ShippingQuote | null {
  const price = countryPriceForGb(method);
  if (price == null || !Number.isFinite(price)) return null;

  const carrier = mapSendcloudMethodCarrier(method.carrier);
  if (!carrier) return null;

  const estimatedDays = leadTimeDays(method);

  return {
    id: encodeSendcloudQuoteId(method.id),
    providerId: "sendcloud",
    carrier,
    serviceName: method.name,
    pricePence: Math.round(price * 100),
    currency: "GBP",
    estimatedDays,
  };
}

export function buildSendcloudParcelPayload(input: {
  methodId: number;
  parcelTier: ParcelTier;
  weightKg?: number;
  deliveryAddress: ShippingAddress;
  orderNumber: string;
  declaredValueGbp?: number;
}): SendcloudParcelCreatePayload {
  const spec = parcelSpecFromTier(input.parcelTier, input.weightKg);
  const address = toSendcloudAddress(input.deliveryAddress);

  return {
    ...address,
    request_label: true,
    shipment: { id: input.methodId },
    weight: spec.weightKg.toFixed(3),
    length: String(spec.lengthCm),
    width: String(spec.widthCm),
    height: String(spec.heightCm),
    order_number: input.orderNumber,
    reference: input.orderNumber,
    total_order_value: (input.declaredValueGbp ?? 50).toFixed(2),
    total_order_value_currency: "GBP",
  };
}

export function extractSendcloudLabelUrl(parcel: {
  label?: { normal_printer?: string[]; label_printer?: string };
  documents?: Array<{ type: string; link: string }>;
}): string | null {
  const docLabel = parcel.documents?.find((doc) => doc.type === "label")?.link;
  if (docLabel) return docLabel;

  const labelPrinter = parcel.label?.label_printer;
  if (labelPrinter) return labelPrinter;

  const normalPrinter = parcel.label?.normal_printer?.[0];
  return normalPrinter ?? null;
}
