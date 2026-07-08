import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { CHECKOUT_CARRIERS } from "@/lib/checkout/delivery";
import { fetchShippingQuotesServer } from "@/lib/shipping/pricing/service.server";
import { isParcel2GoQuoteId } from "@/lib/shipping/pricing/parcel2go-mappers";
import { parseShippoQuoteId } from "@/lib/shipping/pricing/shippo-mappers";
import { isParcel2GoConfigured } from "@/src/services/shipping/env";
import { isShippoConfigured } from "@/lib/shipping/env";
import { ShippingService } from "@/lib/shipping/engine";
import type { UkCarrier } from "@/lib/shipping/carriers";
import type { ShippingAddress, ShippingQuote } from "@/lib/shipping/types";

import type { CheckoutCarrierQuote } from "@/lib/checkout/types";

export type { CheckoutCarrierQuote };

function inferCity(addressLine: string, postcode: string): string {
  const segments = addressLine.split(",").map((part) => part.trim()).filter(Boolean);
  if (segments.length > 1) return segments[segments.length - 1];
  return postcode.trim().split(/\s+/)[0] || "United Kingdom";
}

function toShippingAddress(input: {
  fullName: string;
  line1: string;
  postcode: string;
  country: string;
  role: ShippingAddress["role"];
}): ShippingAddress {
  return {
    role: input.role,
    fullName: input.fullName,
    line1: input.line1,
    city: inferCity(input.line1, input.postcode),
    postcode: input.postcode,
    country: input.country,
    validated: false,
  };
}

async function resolveSellerCollectionAddress(
  sellerId: string,
  sellerName: string,
): Promise<ShippingAddress | null> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("shipping_addresses")
    .select("recipient_name, address_line, address_line_2, city, postcode, country")
    .eq("user_id", sellerId)
    .eq("address_type", "shipping")
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) return null;

  const line1 = row.address_line?.trim();
  const postcode = row.postcode?.trim();
  if (!line1 || !postcode) return null;

  return {
    role: "collection",
    fullName: row.recipient_name?.trim() || sellerName,
    line1,
    line2: row.address_line_2 ?? undefined,
    city: row.city?.trim() || inferCity(line1, postcode),
    postcode,
    country: row.country?.trim() || "United Kingdom",
    validated: false,
  };
}

function formatEta(quote: ShippingQuote): string {
  const { min, max } = quote.estimatedDays;
  if (min === max) return `${min} day${min === 1 ? "" : "s"}`;
  return `${min}–${max} days`;
}

function pickCheapestPerCarrier(quotes: ShippingQuote[]): CheckoutCarrierQuote[] {
  const byCarrier = new Map<string, ShippingQuote>();

  for (const quote of quotes) {
    const carrierKey = String(quote.carrier);
    if (!CHECKOUT_CARRIERS.includes(carrierKey as UkCarrier)) continue;

    const existing = byCarrier.get(carrierKey);
    if (!existing || quote.pricePence < existing.pricePence) {
      byCarrier.set(carrierKey, quote);
    }
  }

  return CHECKOUT_CARRIERS.filter((carrier) => byCarrier.has(carrier))
    .map((carrier) => {
      const quote = byCarrier.get(carrier)!;
      return {
        id: quote.id,
        carrier: quote.carrier,
        serviceName: quote.serviceName,
        price: quote.pricePence / 100,
        eta: formatEta(quote),
      };
    });
}

export function findCheckoutCarrierQuote(
  options: CheckoutCarrierQuote[],
  quoteId: string,
): CheckoutCarrierQuote | null {
  return options.find((option) => option.id === quoteId) ?? null;
}

export async function fetchCheckoutCarrierQuotes(input: {
  productSlug: string;
  recipientName: string;
  addressLine: string;
  postcode: string;
  country: string;
}): Promise<{ live: boolean; options: CheckoutCarrierQuote[] }> {
  if (!isParcel2GoConfigured() && !isShippoConfigured()) {
    return { live: false, options: [] };
  }

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("seller_id, profiles!products_seller_id_fkey(full_name)")
    .eq("slug", input.productSlug)
    .maybeSingle();

  if (!product?.seller_id) {
    return { live: true, options: [] };
  }

  const sellerName =
    (product.profiles as { full_name?: string } | null)?.full_name?.trim() || "Seller";

  const collection = await resolveSellerCollectionAddress(product.seller_id, sellerName);
  if (!collection) {
    return { live: true, options: [] };
  }

  const deliveryDraft = toShippingAddress({
    fullName: input.recipientName,
    line1: input.addressLine,
    postcode: input.postcode,
    country: input.country,
    role: "delivery",
  });

  const collectionValidated = ShippingService.validateAddress(collection);
  const deliveryValidated = ShippingService.validateAddress(deliveryDraft);

  if (!collectionValidated.valid || !deliveryValidated.valid) {
    return { live: true, options: [] };
  }

  const pricing = await fetchShippingQuotesServer({
    parcelTier: "small_parcel",
    collectionAddress: collectionValidated.normalized,
    deliveryAddress: deliveryValidated.normalized,
    preferredCarriers: CHECKOUT_CARRIERS,
  });

  return {
    live: pricing.providerAvailable,
    options: pickCheapestPerCarrier(pricing.quotes),
  };
}

export async function resolveLiveDeliveryPrice(input: {
  productSlug: string;
  shippingQuoteId: string;
  recipientName: string;
  addressLine: string;
  postcode: string;
  country: string;
}): Promise<number | null> {
  const quoteId = input.shippingQuoteId;
  if (!isParcel2GoQuoteId(quoteId) && !parseShippoQuoteId(quoteId)) return null;

  const { options } = await fetchCheckoutCarrierQuotes(input);
  const match = findCheckoutCarrierQuote(options, input.shippingQuoteId);
  return match?.price ?? null;
}
