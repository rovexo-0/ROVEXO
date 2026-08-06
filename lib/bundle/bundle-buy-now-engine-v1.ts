/**
 * BUNDLE_BUY_NOW_ENGINE v1.0 — atomic multi-item checkout start.
 * Extends Master Checkout Architecture (no second checkout system).
 * VERIFY → RESERVE ALL → SESSION (120s + snapshot) → /checkout
 */

import "server-only";

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";
import {
  formatBuyNowUserError,
  type BuyNowRvxCode,
} from "@/lib/checkout/buy-now-guard-v1";
import {
  FINANCIAL_LOGGER,
  IDEMPOTENCY_ENGINE_normalize,
  mintLockToken,
} from "@/lib/checkout/engines/idempotency-engine-v1";
import {
  CHECKOUT_SESSION_ENGINE_create,
  CHECKOUT_SESSION_ENGINE_destroy,
  CHECKOUT_SESSION_ENGINE_expireAll,
  PAYMENT_INTENT_ENGINE_createShell,
  type CheckoutSessionRow,
} from "@/lib/checkout/engines/checkout-session-engine-v1";
import { AUTO_CANCEL_ENGINE_run } from "@/lib/checkout/engines/auto-cancel-engine-v1";
import { amountsMatch } from "@/lib/checkout/buy-now-absolute-law-v1";
import { revalidateBundleForCheckout } from "@/lib/bundle/bundle-checkout-integrity-v1";
import {
  verifyBundleInventoryAvailable,
} from "@/lib/bundle/bundle-reservation-engine-v1";
import {
  allocateLockedBundleLinePrices,
  buildBundleCheckoutSnapshot,
  isBundleCheckoutSnapshot,
  snapshotPrimarySlug,
} from "@/lib/bundle/bundle-snapshot-v1";
import { bundleCheckoutLog } from "@/lib/bundle/bundle-checkout-log-v1";
import { notifyBundleCheckoutStarted } from "@/lib/bundle/bundle-notification-matrix-v1";
import type { BuyNowEngineFailure, BuyNowEngineSuccess } from "@/lib/checkout/engines/buy-now-engine-v1";
import { expireStaleBundleOffers, setBundleStatus } from "@/lib/bundle/bundle-lifecycle-v1";
import { FINANCIAL_AUDIT_ENGINE } from "@/lib/checkout/engines/financial-audit-engine-v1";
import { resolveLockedAcceptedOffer } from "@/lib/offers/accepted-price";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseBundleMessageMeta } from "@/lib/bundle/bundle-payload-v1";

function db() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function mintBundleIdempotency(buyerId: string, bundleId: string): string {
  const digest = createHash("sha256").update(`${buyerId}:bundle:${bundleId}`).digest("hex").slice(0, 24);
  return `bn_${digest}`;
}

function fail(code: BuyNowRvxCode, override?: string): BuyNowEngineFailure {
  FINANCIAL_LOGGER("STOP");
  FINANCIAL_LOGGER("CHECKOUT BLOCKED");
  FINANCIAL_LOGGER("PAYMENT BLOCKED");
  FINANCIAL_LOGGER("FINISHED");
  bundleCheckoutLog("Checkout Failed", { code, override });
  return {
    ok: false,
    code,
    error: override ?? formatBuyNowUserError(code).split("\n")[1] ?? code,
    userFacing: override
      ? `Sorry\n${override}`
      : formatBuyNowUserError(code),
  };
}

async function getOpenBundleSession(input: {
  buyerId: string;
  bundleId: string;
}): Promise<(CheckoutSessionRow & { bundle_lines?: unknown }) | null> {
  const admin = db();
  const { data } = await admin
    .from("checkout_sessions")
    .select("*")
    .eq("buyer_id", input.buyerId)
    .eq("status", "open")
    .gt("expires_at", new Date().toISOString())
    .filter("bundle_lines->>bundleId", "eq", input.bundleId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data && isBundleCheckoutSnapshot((data as { bundle_lines?: unknown }).bundle_lines)) {
    return data as CheckoutSessionRow & { bundle_lines?: unknown };
  }
  return null;
}

async function resolveBundleLockedOfferPrice(input: {
  buyerId: string;
  bundleId: string;
  offerId?: string | null;
  lockedItemPrice?: number | null;
}): Promise<{ offerId: string | null; lockedItemPrice: number | null }> {
  if (
    input.lockedItemPrice != null &&
    Number.isFinite(input.lockedItemPrice) &&
    input.lockedItemPrice > 0
  ) {
    return {
      offerId: input.offerId ?? null,
      lockedItemPrice: Number(input.lockedItemPrice),
    };
  }
  if (!input.offerId) {
    return { offerId: null, lockedItemPrice: null };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("offers")
    .select("id, amount, status, buyer_id, message")
    .eq("id", input.offerId)
    .maybeSingle();

  if (
    !data ||
    data.buyer_id !== input.buyerId ||
    (data.status !== "accepted" && data.status !== "pending") ||
    !Number.isFinite(Number(data.amount)) ||
    Number(data.amount) <= 0
  ) {
    return { offerId: null, lockedItemPrice: null };
  }

  const { bundle } = parseBundleMessageMeta(data.message);
  if (!bundle?.bundleId || bundle.bundleId !== input.bundleId) {
    return { offerId: null, lockedItemPrice: null };
  }

  // Prefer accepted lock; pending only when accept path passes lockedItemPrice explicitly.
  if (data.status === "accepted") {
    return { offerId: data.id, lockedItemPrice: Number(data.amount) };
  }

  // Also try standard accepted resolver against primary product.
  const primaryId = bundle.lines[0]?.productId;
  if (primaryId) {
    const locked = await resolveLockedAcceptedOffer({
      buyerId: input.buyerId,
      productId: primaryId,
      offerId: input.offerId,
    });
    if (locked) {
      return { offerId: locked.offerId, lockedItemPrice: locked.acceptedOfferPrice };
    }
  }

  return { offerId: input.offerId, lockedItemPrice: null };
}

export async function BUNDLE_BUY_NOW_ENGINE(input: {
  buyerId: string;
  bundleId: string;
  clientIdempotencyKey?: string | null;
  conversationId?: string | null;
  offerId?: string | null;
  /** Accepted/pending-accept offer locks item subtotal (buyer pays this, not list). */
  lockedItemPrice?: number | null;
}): Promise<BuyNowEngineSuccess | BuyNowEngineFailure> {
  FINANCIAL_LOGGER("BUY NOW STARTED");
  bundleCheckoutLog("Checkout Started", { bundleId: input.bundleId, buyerId: input.buyerId });

  await CHECKOUT_SESSION_ENGINE_expireAll();
  await AUTO_CANCEL_ENGINE_run();
  void expireStaleBundleOffers().catch(() => undefined);

  const offerLock = await resolveBundleLockedOfferPrice({
    buyerId: input.buyerId,
    bundleId: input.bundleId,
    offerId: input.offerId,
    lockedItemPrice: input.lockedItemPrice,
  });

  const integrity = await revalidateBundleForCheckout({
    buyerId: input.buyerId,
    bundleId: input.bundleId,
    allowedStatuses: ["active", "offer_pending"],
    skipListPriceMatch: offerLock.lockedItemPrice != null,
  });

  if (!integrity.ok) {
    const code: BuyNowRvxCode =
      integrity.reason === "price_changed"
        ? "RVX-2004"
        : integrity.reason === "seller_suspended" || integrity.reason === "self_purchase"
          ? "RVX-2003"
          : integrity.reason === "currency"
            ? "RVX-2006"
            : integrity.reason === "stock" || integrity.unavailable
              ? "RVX-2007"
              : "RVX-2001";
    return fail(code, integrity.message);
  }

  let snapshot = integrity.snapshot;
  if (offerLock.lockedItemPrice != null) {
    const audit = FINANCIAL_AUDIT_ENGINE({
      itemPrice: Number(offerLock.lockedItemPrice),
      shipping: snapshot.shipping,
      currency: snapshot.currency,
    });
    if (!audit.ok) {
      return fail("RVX-2004", "Unable to lock offer total.");
    }
    const lockedLines = allocateLockedBundleLinePrices(
      snapshot.lines,
      Number(offerLock.lockedItemPrice),
    );
    snapshot = buildBundleCheckoutSnapshot({
      bundleId: snapshot.bundleId,
      buyerId: snapshot.buyerId,
      sellerId: snapshot.sellerId,
      sellerName: snapshot.sellerName,
      currency: snapshot.currency,
      itemPrice: Number(offerLock.lockedItemPrice),
      platformFee: audit.platformFee,
      shipping: snapshot.shipping,
      discount: 0,
      total: audit.total,
      lines: lockedLines,
      offerId: offerLock.offerId ?? input.offerId ?? null,
      priorStatus: snapshot.priorStatus ?? null,
    });
  }

  bundleCheckoutLog("Bundle Revalidated", { bundleId: snapshot.bundleId });
  bundleCheckoutLog("Snapshot Locked", { bundleId: snapshot.bundleId, total: snapshot.total });

  const idempotencyKey = IDEMPOTENCY_ENGINE_normalize(
    input.clientIdempotencyKey,
    mintBundleIdempotency(input.buyerId, snapshot.bundleId),
  );

  const primarySlug = snapshotPrimarySlug(snapshot);
  const existing = await getOpenBundleSession({
    buyerId: input.buyerId,
    bundleId: snapshot.bundleId,
  });

  if (existing) {
    if (
      amountsMatch(Number(existing.item_price), snapshot.itemPrice) &&
      amountsMatch(Number(existing.platform_fee), snapshot.platformFee) &&
      amountsMatch(Number(existing.shipping), snapshot.shipping) &&
      amountsMatch(Number(existing.total), snapshot.total)
    ) {
      const pi = PAYMENT_INTENT_ENGINE_createShell({
        checkoutSessionPublicId: existing.public_id,
      });
      if ("ok" in pi && pi.ok === false) {
        return fail("RVX-2010");
      }
      const paymentIntent = pi as Exclude<
        ReturnType<typeof PAYMENT_INTENT_ENGINE_createShell>,
        { ok: false }
      >;
      const params = new URLSearchParams();
      params.set("bn", idempotencyKey);
      params.set("cs", existing.public_id);
      params.set("bundle", snapshot.bundleId);
      if (offerLock.offerId) params.set("offerId", offerLock.offerId);
      if (input.conversationId) params.set("conversationId", input.conversationId);
      FINANCIAL_LOGGER("SUCCESS");
      FINANCIAL_LOGGER("CHECKOUT ALLOWED");
      FINANCIAL_LOGGER("FINISHED");
      return {
        ok: true,
        checkoutPath: `/checkout/${primarySlug}?${params.toString()}`,
        idempotencyKey,
        lockToken: mintLockToken(),
        orderId: null,
        transactionId: null,
        checkoutSessionId: existing.public_id,
        paymentIntentId: paymentIntent.id,
        listingId: snapshot.lines[0]!.productId,
        buyerId: input.buyerId,
        sellerId: snapshot.sellerId,
        price: snapshot.itemPrice,
        platformFee: snapshot.platformFee,
        shipping: snapshot.shipping,
        currency: snapshot.currency,
        reservedUntil: existing.expires_at,
      };
    }
    await CHECKOUT_SESSION_ENGINE_destroy({ session: existing, status: "cancelled" });
  }

  const reserved = await verifyBundleInventoryAvailable(snapshot);
  if (!reserved.ok) {
    return fail("RVX-2007", reserved.message);
  }

  const sessionResult = await CHECKOUT_SESSION_ENGINE_create({
    buyerId: input.buyerId,
    sellerId: snapshot.sellerId,
    listingId: snapshot.lines[0]!.productId,
    productSlug: primarySlug,
    currency: snapshot.currency,
    itemPrice: snapshot.itemPrice,
    platformFee: snapshot.platformFee,
    shipping: snapshot.shipping,
    total: snapshot.total,
    conversationId: input.conversationId ?? null,
    offerId: offerLock.offerId ?? snapshot.offerId ?? null,
    bundleLines: snapshot,
  });

  if (!sessionResult.ok) {
    return fail("RVX-2008", sessionResult.reason);
  }

  const markedCheckout = await setBundleStatus({
    bundleId: snapshot.bundleId,
    fromStatuses: ["active", "offer_pending"],
    toStatus: "checkout",
    actorId: input.buyerId,
    patch: { checkout_session_id: sessionResult.session.id },
    eventType: "bundle.checkout_started",
    payload: {
      offerId: offerLock.offerId ?? null,
      sessionPublicId: sessionResult.session.public_id,
    },
  });
  if (!markedCheckout) {
    await CHECKOUT_SESSION_ENGINE_destroy({
      session: sessionResult.session,
      status: "cancelled",
    });
    return fail("RVX-2008", "Bundle is no longer available for checkout.");
  }

  const pi = PAYMENT_INTENT_ENGINE_createShell({
    checkoutSessionPublicId: sessionResult.session.public_id,
  });
  if ("ok" in pi && pi.ok === false) {
    await CHECKOUT_SESSION_ENGINE_destroy({
      session: sessionResult.session,
      status: "cancelled",
    });
    return fail("RVX-2010");
  }
  const paymentIntent = pi as Exclude<
    ReturnType<typeof PAYMENT_INTENT_ENGINE_createShell>,
    { ok: false }
  >;

  void notifyBundleCheckoutStarted({
    buyerId: input.buyerId,
    sellerId: snapshot.sellerId,
    snapshot,
    checkoutSessionPublicId: sessionResult.session.public_id,
  });

  const params = new URLSearchParams();
  params.set("bn", idempotencyKey);
  params.set("cs", sessionResult.session.public_id);
  params.set("bundle", snapshot.bundleId);
  if (offerLock.offerId) params.set("offerId", offerLock.offerId);
  if (input.conversationId) params.set("conversationId", input.conversationId);

  FINANCIAL_LOGGER("SUCCESS");
  FINANCIAL_LOGGER("CHECKOUT ALLOWED");
  FINANCIAL_LOGGER("FINISHED");

  return {
    ok: true,
    checkoutPath: `/checkout/${primarySlug}?${params.toString()}`,
    idempotencyKey,
    lockToken: mintLockToken(),
    orderId: null,
    transactionId: null,
    checkoutSessionId: sessionResult.session.public_id,
    paymentIntentId: paymentIntent.id,
    listingId: snapshot.lines[0]!.productId,
    buyerId: input.buyerId,
    sellerId: snapshot.sellerId,
    price: snapshot.itemPrice,
    platformFee: snapshot.platformFee,
    shipping: snapshot.shipping,
    currency: snapshot.currency,
    reservedUntil: sessionResult.session.expires_at,
  };
}
