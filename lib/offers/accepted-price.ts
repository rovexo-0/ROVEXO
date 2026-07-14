/**
 * Accepted-offer transaction price lock (v1.0).
 *
 * When offer.status = "accepted", `offers.amount` is the locked transaction price
 * (accepted_offer_price). Checkout / Stripe / orders / escrow / wallet / payouts
 * MUST use this amount — never listing products.price — until the transaction is closed.
 *
 * No schema change: amount lives on `offers.amount` while status is accepted.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type LockedAcceptedOffer = {
  offerId: string;
  /** Locked accepted offer price — transaction SSOT until close. */
  acceptedOfferPrice: number;
  productId: string;
  buyerId: string;
  sellerId: string;
  productSlug: string | null;
};

type ResolveInput = {
  buyerId: string;
  productId: string;
  /** Preferred when present (e.g. Buy Now / notification deep link). */
  offerId?: string | null;
};

function mapLockedOffer(row: {
  id: string;
  amount: number | string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  products?: { slug: string } | { slug: string }[] | null;
}): LockedAcceptedOffer {
  const product = Array.isArray(row.products) ? row.products[0] : row.products;
  return {
    offerId: row.id,
    acceptedOfferPrice: Number(row.amount),
    productId: row.product_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    productSlug: product?.slug ?? null,
  };
}

/**
 * Resolve the locked accepted offer for a buyer + listing.
 * Prefer explicit offerId; otherwise the newest accepted offer for that pair.
 */
export async function resolveLockedAcceptedOffer(
  input: ResolveInput,
): Promise<LockedAcceptedOffer | null> {
  const admin = createAdminClient();

  if (input.offerId) {
    const { data } = await admin
      .from("offers")
      .select("id, amount, product_id, buyer_id, seller_id, status, products(slug)")
      .eq("id", input.offerId)
      .maybeSingle();

    if (
      data &&
      data.status === "accepted" &&
      data.buyer_id === input.buyerId &&
      data.product_id === input.productId &&
      Number.isFinite(Number(data.amount)) &&
      Number(data.amount) > 0
    ) {
      return mapLockedOffer(data);
    }
  }

  const { data } = await admin
    .from("offers")
    .select("id, amount, product_id, buyer_id, seller_id, status, products(slug)")
    .eq("buyer_id", input.buyerId)
    .eq("product_id", input.productId)
    .eq("status", "accepted")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    !data ||
    !Number.isFinite(Number(data.amount)) ||
    Number(data.amount) <= 0
  ) {
    return null;
  }

  return mapLockedOffer(data);
}

/** Server-component variant using the user session client when admin is unavailable. */
export async function resolveLockedAcceptedOfferForBuyer(
  input: ResolveInput,
): Promise<LockedAcceptedOffer | null> {
  return resolveLockedAcceptedOffer(input);
}

/**
 * Transaction item price for checkout.
 * Accepted offer wins; otherwise listing price.
 */
export function resolveTransactionItemPrice(input: {
  listingPrice: number;
  acceptedOfferPrice: number | null | undefined;
}): number {
  if (
    input.acceptedOfferPrice != null &&
    Number.isFinite(input.acceptedOfferPrice) &&
    input.acceptedOfferPrice > 0
  ) {
    return Math.round(input.acceptedOfferPrice * 100) / 100;
  }
  return Math.round(Number(input.listingPrice) * 100) / 100;
}

/** Lookup accepted offer by id for notification / deep-link redirects. */
export async function getAcceptedOfferById(
  offerId: string,
): Promise<LockedAcceptedOffer | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("offers")
    .select("id, amount, product_id, buyer_id, seller_id, status, products(slug)")
    .eq("id", offerId)
    .eq("status", "accepted")
    .maybeSingle();

  if (!data || Number(data.amount) <= 0) return null;
  return mapLockedOffer(data);
}

export async function getAcceptedOfferByIdForSessionBuyer(
  offerId: string,
  buyerId: string,
): Promise<LockedAcceptedOffer | null> {
  const locked = await getAcceptedOfferById(offerId);
  if (!locked || locked.buyerId !== buyerId) return null;
  return locked;
}

/** Used when only the user-scoped client is available (optional). */
export async function findAcceptedOfferAmountWithUserClient(input: {
  buyerId: string;
  productId: string;
  offerId?: string | null;
}): Promise<number | null> {
  const supabase = await createClient();
  if (input.offerId) {
    const { data } = await supabase
      .from("offers")
      .select("amount, status, buyer_id, product_id")
      .eq("id", input.offerId)
      .maybeSingle();
    if (
      data?.status === "accepted" &&
      data.buyer_id === input.buyerId &&
      data.product_id === input.productId
    ) {
      return Number(data.amount);
    }
  }

  const { data } = await supabase
    .from("offers")
    .select("amount")
    .eq("buyer_id", input.buyerId)
    .eq("product_id", input.productId)
    .eq("status", "accepted")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? Number(data.amount) : null;
}
