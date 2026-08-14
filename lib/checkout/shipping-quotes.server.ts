import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { CHECKOUT_CARRIERS } from "@/lib/checkout/delivery";
import { mapProviderQuotesToCheckoutOptions } from "@/lib/checkout/map-provider-quotes-to-checkout-v1";
import { fetchShippingQuotesServer } from "@/lib/shipping/pricing/service.server";
import { isSendcloudQuoteId } from "@/lib/shipping/pricing/sendcloud-mappers";
import { isSendcloudConfigured } from "@/lib/shipping/env";
import { ShippingService } from "@/lib/shipping/engine";
import {
  resolveCanonicalParcelSize,
  canonicalParcelMeasurements,
} from "@/lib/shipping/canonical-parcel-size-v1";
import { resolveListingParcelTier } from "@/lib/shipping/parcels";
import type { ShippingAddress } from "@/lib/shipping/types";

import type { CheckoutCarrierQuote, CheckoutShippingQuoteReason } from "@/lib/checkout/types";

export { mapProviderQuotesToCheckoutOptions } from "@/lib/checkout/map-provider-quotes-to-checkout-v1";

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
}): Promise<{ live: boolean; options: CheckoutCarrierQuote[]; reason?: CheckoutShippingQuoteReason | null }> {
  if (!isSendcloudConfigured()) {
    return { live: false, options: [], reason: "provider_unavailable" };
  }

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("seller_id, parcel_size, profiles!products_seller_id_fkey(full_name)")
    .eq("slug", input.productSlug)
    .maybeSingle();

  if (!product?.seller_id) {
    return { live: true, options: [], reason: "product_unavailable" };
  }

  const sellerName =
    (product.profiles as { full_name?: string } | null)?.full_name?.trim() || "Seller";

  const collection = await resolveSellerCollectionAddress(product.seller_id, sellerName);
  if (!collection) {
    return { live: true, options: [], reason: "seller_dispatch_not_ready" };
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
    return { live: true, options: [], reason: "address_incomplete" };
  }

  const parcelSizeRaw = (product as { parcel_size?: string | null }).parcel_size;
  const parcelTier = resolveListingParcelTier(parcelSizeRaw);
  const parcelDef = resolveCanonicalParcelSize(parcelSizeRaw);
  if (!parcelTier || !parcelDef) {
    // FAIL CLOSED — never invent medium_parcel / small_parcel measurements.
    return { live: true, options: [], reason: "product_unavailable" };
  }

  const parcel = canonicalParcelMeasurements(parcelDef);

  const pricing = await fetchShippingQuotesServer({
    parcelTier,
    weightKg: parcel.weightKg,
    collectionAddress: collectionValidated.normalized,
    deliveryAddress: deliveryValidated.normalized,
    preferredCarriers: [...CHECKOUT_CARRIERS],
  });

  const options = mapProviderQuotesToCheckoutOptions(pricing.quotes, { parcel });
  let reason: CheckoutShippingQuoteReason | null = null;
  if (options.length === 0) {
    if (pricing.quotes.length > 0) {
      reason = "no_supported_carriers";
    } else if (!pricing.providerAvailable) {
      reason = "provider_unavailable";
    }
  }

  return {
    live: pricing.providerAvailable,
    options,
    reason,
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
  if (!isSendcloudQuoteId(quoteId)) return null;

  const { options } = await fetchCheckoutCarrierQuotes(input);
  const match = findCheckoutCarrierQuote(options, input.shippingQuoteId);
  return match?.price ?? null;
}
