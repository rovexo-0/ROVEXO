import type { UkCarrier } from "@/lib/shipping/carriers";
import type { SellerDefaultLabelSize } from "@/lib/shipping/label-size";
import { DEFAULT_SELLER_LABEL_SIZE } from "@/lib/shipping/label-size";
import { PARCEL_TIER_OPTIONS } from "@/lib/shipping/parcels";
import type { ParcelTier, ShippingAddress, ShippingQuote } from "@/lib/shipping/types";
import type { SendcloudParcelCreatePayload } from "@/lib/shipping/sendcloud/client";
import type {
  SendcloudShippingMethod,
  SendcloudV3QuoteMetadata,
} from "@/lib/shipping/sendcloud/types";
import { mapSendcloudCarrierToUk } from "@/lib/shipping/sendcloud/carrier-aliases";
import {
  isConfirmedSendcloudV3ShippingOptionCode,
  resolveShippingQuoteApiVersion,
} from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";

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

/** Same postal shape as V3 /shipping-options catalog requests (strip spaces, upper). */
export function normalizeSendcloudPostalCode(postcode: string): string {
  return postcode.replace(/\s+/g, "").toUpperCase();
}

/**
 * Outbound-only phone for Sendcloud InPost GB announce (`phone_number`).
 *
 * Live Sendcloud/InPost rejected E.164 (`+447438969272`) as invalid.
 * Existing ROVEXO InPost announce fixtures use UK national `07…` (11 digits).
 * Digits are never invented; non-UK-mobile shapes are returned trimmed unchanged.
 * Does not mutate stored profile/address phones — call only when serializing announce.
 */
export function normalizeInPostGbPhoneForSendcloudAnnounce(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";

  const digits = trimmed.replace(/\D/g, "");

  // Already UK national mobile: 07XXXXXXXXX
  if (digits.length === 11 && digits.startsWith("07")) {
    return digits;
  }

  // E.164 / international: 44 + 10-digit mobile (7XXXXXXXXX) → 07XXXXXXXXX
  // Covers +447…, 00447…, 447… (same digit sequence after stripping non-digits).
  if (digits.length === 12 && digits.startsWith("44") && digits[2] === "7") {
    return `0${digits.slice(2)}`;
  }

  // Bare 10-digit UK mobile body (7XXXXXXXXX) → 07XXXXXXXXX
  if (digits.length === 10 && digits.startsWith("7")) {
    return `0${digits}`;
  }

  // Unrelated / non-UK-mobile: do not corrupt.
  return trimmed;
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

/**
 * Derive a package spec from a ROVEXO parcel tier for **quote/pricing**.
 * Uses canonical in-band Parcel Size measurements (SSOT) — never catalog-max synthesis (2/20/15.001).
 * Label announce (P7.21) must pass real shipment_parcels measurements when present.
 */
export function parcelSpecFromTier(tier: ParcelTier, weightKg?: number) {
  const option = PARCEL_TIER_OPTIONS.find((item) => item.id === tier);
  if (!option) {
    throw new Error(`Unknown parcel tier: ${tier}`);
  }

  const weight =
    weightKg != null && Number.isFinite(weightKg) && weightKg > 0
      ? weightKg
      : option.weightKg;

  return {
    weightKg: Number(Number(weight).toFixed(3)),
    lengthCm: option.lengthCm,
    widthCm: option.widthCm,
    heightCm: option.heightCm,
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
    telephone: address.phone?.trim() ?? "",
    email: address.email?.trim() ?? "",
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

/**
 * Map Sendcloud shipping method → ROVEXO quote.
 * Sendcloud country `price` is GBP major units as returned by /shipping_methods
 * (e.g. 3.49 → 349 pence). Official method schema does not expose a separate VAT
 * amount — do not fabricate VAT lines.
 * UK-first: ShippingQuote.currency is typed GBP (canonical production currency).
 * Buyer margin is applied later in checkout mapping — keep raw provider here.
 *
 * V3 label identity is OPTIONAL and MUST come from confirmed discovery metadata only.
 * NEVER: shippingOptionCode = String(method.id) / parseSendcloudQuoteId / serviceName guess.
 */
export function mapSendcloudMethodToQuote(
  method: SendcloudShippingMethod,
  v3?: SendcloudV3QuoteMetadata | null,
): ShippingQuote | null {
  const price = countryPriceForGb(method);
  if (price == null || !Number.isFinite(price) || price < 0) return null;

  const carrier = mapSendcloudMethodCarrier(method.carrier);
  if (!carrier) return null;

  const estimatedDays = leadTimeDays(method);
  const v2MethodId = method.id;
  const shippingOptionCode = isConfirmedSendcloudV3ShippingOptionCode(
    v3?.shippingOptionCode,
    v2MethodId,
  )
    ? v3!.shippingOptionCode!.trim()
    : undefined;
  const contractId =
    typeof v3?.contractId === "string" && v3.contractId.trim()
      ? v3.contractId.trim()
      : undefined;

  const minWeightKg = Number.parseFloat(method.min_weight);
  const maxWeightKg = Number.parseFloat(method.max_weight);
  const hasWeightEnvelope =
    Number.isFinite(minWeightKg) &&
    Number.isFinite(maxWeightKg) &&
    minWeightKg >= 0 &&
    maxWeightKg >= minWeightKg;

  return {
    id: encodeSendcloudQuoteId(method.id),
    providerId: "sendcloud",
    carrier,
    serviceName: method.name,
    pricePence: Math.round(price * 100),
    currency: "GBP",
    estimatedDays,
    v2MethodId,
    ...(shippingOptionCode ? { shippingOptionCode } : {}),
    ...(contractId ? { contractId } : {}),
    quoteApiVersion: resolveShippingQuoteApiVersion({ shippingOptionCode, v2MethodId }),
    ...(hasWeightEnvelope ? { minWeightKg, maxWeightKg } : {}),
  };
}

export function buildSendcloudParcelPayload(input: {
  methodId: number;
  parcelTier: ParcelTier;
  weightKg?: number;
  deliveryAddress: ShippingAddress;
  /** Seller dispatch / collection — required for outbound payload integrity. */
  collectionAddress: ShippingAddress;
  orderNumber: string;
  declaredValueGbp?: number;
  /** Propagated to Sendcloud `external_reference` (official unique idempotence field). */
  externalReference?: string;
}): SendcloudParcelCreatePayload {
  const spec = parcelSpecFromTier(input.parcelTier, input.weightKg);
  if (
    !Number.isFinite(spec.weightKg) ||
    spec.weightKg <= 0 ||
    !Number.isFinite(spec.lengthCm) ||
    !Number.isFinite(spec.widthCm) ||
    !Number.isFinite(spec.heightCm)
  ) {
    throw new Error("Invalid parcel dimensions for Sendcloud parcel create");
  }

  const address = toSendcloudAddress(input.deliveryAddress);
  const collection = toSendcloudAddress(input.collectionAddress);
  const externalReference = input.externalReference?.trim();

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
    ...(externalReference ? { external_reference: externalReference } : {}),
    total_order_value: (input.declaredValueGbp ?? 50).toFixed(2),
    total_order_value_currency: "GBP",
    // Official Create Parcel OpenAPI supports from_* for sender/collection.
    from_name: collection.name,
    from_address_1: collection.address,
    from_house_number: collection.house_number,
    from_city: collection.city,
    from_postal_code: collection.postal_code,
    from_country: collection.country,
    from_telephone: collection.telephone || undefined,
    from_email: collection.email || undefined,
  };
}

/** True when Sendcloud returned a usable label URL (never fabricate). */
export function isUsableSendcloudLabelUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function extractSendcloudLabelUrl(
  parcel: {
    label?: { normal_printer?: string[]; label_printer?: string };
    documents?: Array<{ type: string; link: string }>;
  },
  labelSize: SellerDefaultLabelSize = DEFAULT_SELLER_LABEL_SIZE,
): string | null {
  const labelPrinter = parcel.label?.label_printer?.trim();
  const normalPrinter = parcel.label?.normal_printer?.[0]?.trim();

  if (labelSize === "a4_pdf") {
    return normalPrinter ?? labelPrinter ?? parcel.documents?.find((doc) => doc.type === "label")?.link ?? null;
  }

  return labelPrinter ?? normalPrinter ?? parcel.documents?.find((doc) => doc.type === "label")?.link ?? null;
}
