import type { Parcel2GoApiQuote } from "@/src/services/shipping/parcel2go/types";

export const PARCEL2GO_QUOTE_PREFIX = "parcel2go:";

export type Parcel2GoQuotePayload = {
  serviceSlug: string;
  serviceName: string;
  carrier: string;
  totalPrice: number;
  currency: string;
  collectionDate: string | null;
  estimatedDeliveryDate: string | null;
  cutOff: string | null;
};

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function encodeParcel2GoQuoteId(quote: Parcel2GoApiQuote): string {
  const payload: Parcel2GoQuotePayload = {
    serviceSlug: quote.Service?.Slug ?? "",
    serviceName: quote.Service?.Name ?? "Standard",
    carrier: quote.Service?.CourierName ?? "Courier",
    totalPrice: Number(quote.TotalPrice ?? 0),
    currency: quote.CurrencyCode ?? "GBP",
    collectionDate: quote.Collection ?? null,
    estimatedDeliveryDate: quote.EstimatedDeliveryDate ?? null,
    cutOff: quote.CutOff ?? null,
  };

  return `${PARCEL2GO_QUOTE_PREFIX}${toBase64Url(JSON.stringify(payload))}`;
}

export function parseParcel2GoQuoteId(quoteId: string): Parcel2GoQuotePayload | null {
  if (!quoteId.startsWith(PARCEL2GO_QUOTE_PREFIX)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(quoteId.slice(PARCEL2GO_QUOTE_PREFIX.length))) as Parcel2GoQuotePayload;
    if (!payload.serviceSlug) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isParcel2GoQuoteId(quoteId: string): boolean {
  return parseParcel2GoQuoteId(quoteId) !== null;
}
