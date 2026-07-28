/**
 * ROVEXO MASTER_CHECKOUT_ARCHITECTURE v1.0 — CHECKOUT_SESSION_ENGINE
 * Sole temporary object before payment. TTL = 120 seconds Absolute Law.
 * NOT an Order. NOT a Transaction.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { releaseProductInventory } from "@/lib/inventory/service";
import {
  FINANCIAL_LOGGER,
  mintCheckoutSessionPublicId,
} from "@/lib/checkout/engines/idempotency-engine-v1";
import { CHECKOUT_SESSION_TTL_SECONDS } from "@/lib/checkout/engines/status-map-v1";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe/server";
import { isStripeRequired } from "@/lib/stripe/server";
import { mustUseVirtualPayments } from "@/lib/full-demo/security";

export type CheckoutSessionStatus = "open" | "expired" | "cancelled" | "paid";

export type CheckoutSessionRow = {
  id: string;
  public_id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  product_slug: string;
  currency: string;
  item_price: number;
  platform_fee: number;
  shipping: number;
  total: number;
  offer_id: string | null;
  conversation_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  order_id: string | null;
  status: CheckoutSessionStatus;
  expires_at: string;
  created_at: string;
  paid_at: string | null;
};

export type PaymentIntentShell = {
  id: string;
  checkoutSessionId: string;
  status: "PENDING_PAYMENT" | "READY";
  mode: "stripe" | "virtual" | "dev";
};

function expiresAtIso(fromMs = Date.now()): string {
  return new Date(fromMs + CHECKOUT_SESSION_TTL_SECONDS * 1000).toISOString();
}

export function CHECKOUT_SESSION_ENGINE_isExpired(
  expiresAt: string | null | undefined,
): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
}

export async function CHECKOUT_SESSION_ENGINE_create(input: {
  buyerId: string;
  sellerId: string;
  listingId: string;
  productSlug: string;
  currency: string;
  itemPrice: number;
  platformFee: number;
  shipping: number;
  total: number;
  offerId?: string | null;
  conversationId?: string | null;
}): Promise<{ ok: true; session: CheckoutSessionRow } | { ok: false; reason: string }> {
  const admin = createAdminClient();
  const publicId = mintCheckoutSessionPublicId();
  const expiresAt = expiresAtIso();

  const { data, error } = await admin
    .from("checkout_sessions")
    .insert({
      public_id: publicId,
      buyer_id: input.buyerId,
      seller_id: input.sellerId,
      listing_id: input.listingId,
      product_slug: input.productSlug,
      currency: input.currency,
      item_price: input.itemPrice,
      platform_fee: input.platformFee,
      shipping: input.shipping,
      total: input.total,
      offer_id: input.offerId ?? null,
      conversation_id: input.conversationId ?? null,
      status: "open",
      expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (error || !data) {
    FINANCIAL_LOGGER("STOP", error?.message ?? "checkout session create failed");
    return { ok: false, reason: "Unable to create checkout session." };
  }

  FINANCIAL_LOGGER("PAYMENT SESSION PASS", publicId);
  return { ok: true, session: data as CheckoutSessionRow };
}

export async function CHECKOUT_SESSION_ENGINE_getByPublicId(
  publicId: string,
): Promise<CheckoutSessionRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("checkout_sessions")
    .select("*")
    .eq("public_id", publicId)
    .maybeSingle();
  return (data as CheckoutSessionRow | null) ?? null;
}

export async function CHECKOUT_SESSION_ENGINE_getOpenForBuyerListing(input: {
  buyerId: string;
  listingId: string;
}): Promise<CheckoutSessionRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("checkout_sessions")
    .select("*")
    .eq("buyer_id", input.buyerId)
    .eq("listing_id", input.listingId)
    .eq("status", "open")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as CheckoutSessionRow | null) ?? null;
}

/**
 * Expire / cancel session + release inventory + expire Stripe session if any.
 * Absolute Law: reserved → published, reserved=false.
 */
export async function CHECKOUT_SESSION_ENGINE_destroy(input: {
  session: CheckoutSessionRow;
  status: "expired" | "cancelled";
}): Promise<void> {
  const admin = createAdminClient();
  const session = input.session;

  if (session.status === "paid") {
    return;
  }

  if (isStripeConfigured() && session.stripe_checkout_session_id) {
    try {
      await getStripeClient().checkout.sessions.expire(session.stripe_checkout_session_id);
    } catch {
      // already expired/consumed
    }
  }

  await releaseProductInventory(session.listing_id, 1);

  await admin
    .from("checkout_sessions")
    .update({
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id)
    .eq("status", "open");

  FINANCIAL_LOGGER("STOP", `checkout session ${input.status}=${session.public_id}`);
}

export async function CHECKOUT_SESSION_ENGINE_markPaid(input: {
  sessionId: string;
  orderId: string;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("checkout_sessions")
    .update({
      status: "paid",
      order_id: input.orderId,
      paid_at: new Date().toISOString(),
      stripe_checkout_session_id: input.stripeSessionId ?? null,
      stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.sessionId)
    .eq("status", "open");
}

export async function CHECKOUT_SESSION_ENGINE_attachStripe(input: {
  sessionId: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId?: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("checkout_sessions")
    .update({
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.sessionId);
}

/** Expire all open sessions past expires_at; unlock listings. */
export async function CHECKOUT_SESSION_ENGINE_expireAll(): Promise<{ expired: number }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: rows } = await admin
    .from("checkout_sessions")
    .select("*")
    .eq("status", "open")
    .lt("expires_at", now);

  let expired = 0;
  for (const row of rows ?? []) {
    await CHECKOUT_SESSION_ENGINE_destroy({
      session: row as CheckoutSessionRow,
      status: "expired",
    });
    expired += 1;
  }
  return { expired };
}

export function PAYMENT_INTENT_ENGINE_createShell(input: {
  checkoutSessionPublicId: string;
}): PaymentIntentShell | { ok: false; reason: string } {
  const key = input.checkoutSessionPublicId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
  if (mustUseVirtualPayments()) {
    return {
      id: `pi_virtual_${key}`,
      checkoutSessionId: input.checkoutSessionPublicId,
      status: "READY",
      mode: "virtual",
    };
  }
  if (isStripeConfigured()) {
    return {
      id: `pi_pending_${key}`,
      checkoutSessionId: input.checkoutSessionPublicId,
      status: "PENDING_PAYMENT",
      mode: "stripe",
    };
  }
  if (isStripeRequired()) {
    return { ok: false, reason: "Payments are not configured." };
  }
  return {
    id: `pi_dev_${key}`,
    checkoutSessionId: input.checkoutSessionPublicId,
    status: "READY",
    mode: "dev",
  };
}

/** @deprecated Legacy order-bound shell — Master Architecture uses checkoutSessionPublicId. */
export function CHECKOUT_SESSION_ENGINE_createLegacy(input: {
  orderId: string;
  transactionId: string;
}): { id: string; orderId: string; transactionId: string; status: "PENDING_PAYMENT" } {
  return {
    id: `cs_legacy_${input.orderId.replace(/-/g, "").slice(0, 20)}`,
    orderId: input.orderId,
    transactionId: input.transactionId,
    status: "PENDING_PAYMENT",
  };
}
