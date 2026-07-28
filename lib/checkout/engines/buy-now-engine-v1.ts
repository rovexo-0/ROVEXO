/**
 * MASTER_CHECKOUT_ARCHITECTURE v1.0 — BUY_NOW_ENGINE
 * VERIFY → LOCK (reserved) → Checkout Session (120s) → /checkout
 * NO Order · NO Transaction before payment success.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveMarket } from "@/lib/seo/markets";
import { assertMarketplacePurchaseAllowedForProductSlug } from "@/lib/transaction-mode/validate";
import {
  BUY_NOW_BLOOD_FIX_V1,
  formatBuyNowUserError,
  runBuyNowGuard,
  resolveCheckoutGuard16,
  resolveCheckoutGuard16FailureCode,
  type BuyNowRvxCode,
  type CheckoutGuard16Check,
} from "@/lib/checkout/buy-now-guard-v1";
import {
  FINANCIAL_LOGGER,
  IDEMPOTENCY_ENGINE_mint,
  IDEMPOTENCY_ENGINE_normalize,
  mintLockToken,
} from "@/lib/checkout/engines/idempotency-engine-v1";
import { FINANCIAL_AUDIT_ENGINE } from "@/lib/checkout/engines/financial-audit-engine-v1";
import { LISTING_LOCK_ENGINE, LISTING_UNLOCK_ENGINE } from "@/lib/checkout/engines/listing-lock-engine-v1";
import {
  CHECKOUT_SESSION_ENGINE_create,
  CHECKOUT_SESSION_ENGINE_destroy,
  CHECKOUT_SESSION_ENGINE_expireAll,
  CHECKOUT_SESSION_ENGINE_getOpenForBuyerListing,
  CHECKOUT_SESSION_ENGINE_isExpired,
  PAYMENT_INTENT_ENGINE_createShell,
} from "@/lib/checkout/engines/checkout-session-engine-v1";
import { AUTO_CANCEL_ENGINE_run } from "@/lib/checkout/engines/auto-cancel-engine-v1";
import { resolveTransactionItemPrice, resolveLockedAcceptedOffer } from "@/lib/offers/accepted-price";
import { isPurchasable } from "@/lib/inventory/service";
import {
  BUY_NOW_ABSOLUTE_LAW_V2,
  amountsMatch,
} from "@/lib/checkout/buy-now-absolute-law-v1";
import { isSelfPurchaseBlocked } from "@/lib/checkout/self-purchase-absolute-law-v1";
import {
  BuyNowTraceEngine,
  BUY_NOW_TRACE_ENGINE_FILE,
  type BuyNowTraceBlockingFailure,
} from "@/lib/checkout/engines/buy-now-trace-engine-v1";

void BUY_NOW_BLOOD_FIX_V1;
void BUY_NOW_ABSOLUTE_LAW_V2;

const TRACE_FILE = BUY_NOW_TRACE_ENGINE_FILE;

export type BuyNowEngineSuccess = {
  ok: true;
  checkoutPath: string;
  idempotencyKey: string;
  lockToken: string;
  /** Null until payment success — Master Architecture. */
  orderId: null;
  /** Null until payment success — Master Architecture. */
  transactionId: null;
  checkoutSessionId: string;
  paymentIntentId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  price: number;
  platformFee: number;
  shipping: number;
  currency: string;
  reservedUntil: string;
};

export type BuyNowEngineFailure = {
  ok: false;
  code: BuyNowRvxCode;
  error: string;
  userFacing: string;
  trace?: BuyNowTraceBlockingFailure;
};

export type BuyNowEngineResult = BuyNowEngineSuccess | BuyNowEngineFailure;

function fail(
  code: BuyNowRvxCode,
  trace?: BuyNowTraceEngine,
  blocking?: BuyNowTraceBlockingFailure,
): BuyNowEngineFailure {
  FINANCIAL_LOGGER("STOP");
  FINANCIAL_LOGGER("CHECKOUT BLOCKED");
  FINANCIAL_LOGGER("PAYMENT BLOCKED");
  FINANCIAL_LOGGER("FINISHED");
  return {
    ok: false,
    code,
    error: formatBuyNowUserError(code).split("\n")[1] ?? code,
    userFacing: formatBuyNowUserError(code),
    trace: blocking ?? trace?.getBlockingFailure() ?? undefined,
  };
}

async function isAccountActive(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<boolean> {
  const { data: profile } = await admin
    .from("profiles")
    .select("id, account_status")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.id) return false;
  return profile.account_status !== "suspended" && profile.account_status !== "deleted";
}

export function CHECKOUT_GUARD(checks: Record<CheckoutGuard16Check, boolean>): "ALL_PASSED" | "STOP" {
  return resolveCheckoutGuard16(checks);
}

/**
 * BUY_NOW_ENGINE — Master Checkout Architecture:
 * VERIFY ALL → LOCK → CHECKOUT SESSION (120s) → /checkout?cs=
 * Fail after lock → unlock. No Order / Transaction before payment.
 */
export async function BUY_NOW_ENGINE(input: {
  buyerId: string;
  productSlug: string;
  offerId?: string | null;
  clientIdempotencyKey?: string | null;
  conversationId?: string | null;
}): Promise<BuyNowEngineResult> {
  const trace = new BuyNowTraceEngine();
  FINANCIAL_LOGGER("BUY NOW STARTED");
  trace.start("BUY_NOW", TRACE_FILE, 119, "validateListing()");
  trace.pass("BUY_NOW", TRACE_FILE, 119, "validateListing()");

  const admin = createAdminClient();
  const slug = input.productSlug.trim();
  const currency = getActiveMarket().currency;
  const idempotencyKey = IDEMPOTENCY_ENGINE_normalize(
    input.clientIdempotencyKey,
    IDEMPOTENCY_ENGINE_mint({
      buyerId: input.buyerId,
      productSlug: slug,
      offerId: input.offerId,
    }),
  );

  await CHECKOUT_SESSION_ENGINE_expireAll();
  await AUTO_CANCEL_ENGINE_run();

  const { data: product } = await admin
    .from("products")
    .select(
      "id, slug, title, price, condition, stock, status, seller_id, shipping_price, product_images(url, is_primary, sort_order)",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!product?.id) {
    return fail("RVX-2001", trace);
  }

  if (!(await isAccountActive(admin, input.buyerId))) {
    return fail("RVX-2002", trace);
  }

  const listingOwnerId = product.seller_id ?? null;
  if (isSelfPurchaseBlocked({ currentUserId: input.buyerId, listingOwnerId })) {
    return fail("RVX-2003", trace);
  }
  const sellerId = listingOwnerId as string;

  if (!(await isAccountActive(admin, sellerId))) {
    return fail("RVX-2003", trace);
  }

  const { data: sellerSettings } = await admin
    .from("user_settings")
    .select("vacation_mode")
    .eq("user_id", sellerId)
    .maybeSingle();
  if (sellerSettings?.vacation_mode) {
    return fail("RVX-2003", trace);
  }

  const purchaseCheck = await assertMarketplacePurchaseAllowedForProductSlug(slug);
  const openSessionEarly = await CHECKOUT_SESSION_ENGINE_getOpenForBuyerListing({
    buyerId: input.buyerId,
    listingId: product.id,
  });
  const canReuseSession =
    openSessionEarly && !CHECKOUT_SESSION_ENGINE_isExpired(openSessionEarly.expires_at);
  if (!(isPurchasable(product.stock, product.status) && purchaseCheck.allowed) && !canReuseSession) {
    return fail("RVX-2001", trace);
  }

  const priceValue = Number(product.price ?? NaN);
  if (!Number.isFinite(priceValue) || priceValue <= 0) {
    return fail("RVX-2004", trace);
  }

  const shippingValue = Number(product.shipping_price ?? 0);
  if (!Number.isFinite(shippingValue) || shippingValue < 0) {
    return fail("RVX-2005", trace);
  }

  if (!currency || currency.length !== 3) {
    return fail("RVX-2006", trace);
  }

  const lockedOffer = await resolveLockedAcceptedOffer({
    buyerId: input.buyerId,
    productId: product.id,
    offerId: input.offerId,
  });

  const itemPrice = resolveTransactionItemPrice({
    listingPrice: priceValue,
    acceptedOfferPrice: lockedOffer?.acceptedOfferPrice,
  });

  const audit = FINANCIAL_AUDIT_ENGINE({
    itemPrice,
    shipping: shippingValue,
    currency,
  });
  if (!audit.ok) {
    return fail("RVX-2011");
  }

  const existingSession = canReuseSession ? openSessionEarly : null;
  if (existingSession) {
    if (
      !amountsMatch(Number(existingSession.item_price), itemPrice) ||
      !amountsMatch(Number(existingSession.platform_fee), audit.platformFee) ||
      !amountsMatch(Number(existingSession.shipping), shippingValue) ||
      !amountsMatch(Number(existingSession.total), audit.total)
    ) {
      await CHECKOUT_SESSION_ENGINE_destroy({
        session: existingSession,
        status: "cancelled",
      });
    } else {
      const pi = PAYMENT_INTENT_ENGINE_createShell({
        checkoutSessionPublicId: existingSession.public_id,
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
      params.set("cs", existingSession.public_id);
      if (input.offerId) params.set("offerId", input.offerId);
      if (input.conversationId) params.set("conversationId", input.conversationId);
      FINANCIAL_LOGGER("SUCCESS");
      FINANCIAL_LOGGER("CHECKOUT ALLOWED");
      FINANCIAL_LOGGER("FINISHED");
      return {
        ok: true,
        checkoutPath: `/checkout/${slug}?${params.toString()}`,
        idempotencyKey,
        lockToken: mintLockToken(),
        orderId: null,
        transactionId: null,
        checkoutSessionId: existingSession.public_id,
        paymentIntentId: paymentIntent.id,
        listingId: product.id,
        buyerId: input.buyerId,
        sellerId,
        price: itemPrice,
        platformFee: audit.platformFee,
        shipping: shippingValue,
        currency,
        reservedUntil: existingSession.expires_at,
      };
    }
  }

  const preCreate = runBuyNowGuard(
    {
      listing: true,
      buyer: true,
      seller: true,
      price: true,
      shipping: true,
      currency: true,
      lock: true,
      order: true,
      transaction: true,
      paymentSession: true,
      financialAudit: true,
      idempotency: Boolean(idempotencyKey),
    },
    { log: true },
  );
  if (!preCreate.ok) {
    return fail(preCreate.code);
  }

  if (!isPurchasable(product.stock, product.status)) {
    return fail("RVX-2001", trace);
  }

  const lock = await LISTING_LOCK_ENGINE({
    productId: product.id,
    stock: product.stock,
    status: product.status,
  });
  if (!lock.ok) {
    return fail("RVX-2007");
  }

  const failAfterLock = async (
    code: BuyNowRvxCode,
    blocking?: BuyNowTraceBlockingFailure,
  ): Promise<BuyNowEngineFailure> => {
    await LISTING_UNLOCK_ENGINE(product.id, 1);
    return fail(code, trace, blocking);
  };

  try {
    const { data: lockedProduct } = await admin
      .from("products")
      .select("id, price, stock, status, seller_id, shipping_price, reserved")
      .eq("id", product.id)
      .maybeSingle();

    if (!lockedProduct?.id) {
      return await failAfterLock("RVX-2001");
    }
    if (lockedProduct.seller_id !== sellerId) {
      return await failAfterLock("RVX-2003");
    }
    if (lockedProduct.status !== "reserved") {
      return await failAfterLock("RVX-2001");
    }
    if (!(Number(lockedProduct.stock) > 0)) {
      return await failAfterLock("RVX-2001");
    }
    if (!amountsMatch(Number(lockedProduct.price), priceValue)) {
      return await failAfterLock("RVX-2004");
    }
    if (!amountsMatch(Number(lockedProduct.shipping_price ?? 0), shippingValue)) {
      return await failAfterLock("RVX-2005");
    }

    const sessionResult = await CHECKOUT_SESSION_ENGINE_create({
      buyerId: input.buyerId,
      sellerId,
      listingId: product.id,
      productSlug: slug,
      currency,
      itemPrice,
      platformFee: audit.platformFee,
      shipping: shippingValue,
      total: audit.total,
      offerId: input.offerId,
      conversationId: input.conversationId,
    });
    if (!sessionResult.ok) {
      return await failAfterLock("RVX-2008");
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

    const guard16: Record<CheckoutGuard16Check, boolean> = {
      listingID: Boolean(product.id),
      buyerID: Boolean(input.buyerId),
      sellerID: Boolean(sellerId),
      orderID: true,
      transactionID: true,
      price: Boolean(lockedOffer) || amountsMatch(itemPrice, Number(product.price)),
      platformFee: true,
      shipping: true,
      currency: true,
      checkoutSession: Boolean(sessionResult.session.public_id),
      paymentSession: Boolean(paymentIntent.id),
      listingLock: true,
      financialAudit: audit.ok,
      idempotency: Boolean(idempotencyKey),
      buyerAuthenticated: true,
      sellerAcceptingOrders: true,
    };

    if (CHECKOUT_GUARD(guard16) !== "ALL_PASSED") {
      await CHECKOUT_SESSION_ENGINE_destroy({
        session: sessionResult.session,
        status: "cancelled",
      });
      return fail(resolveCheckoutGuard16FailureCode(guard16));
    }

    const params = new URLSearchParams();
    params.set("bn", idempotencyKey);
    params.set("cs", sessionResult.session.public_id);
    params.set("lt", mintLockToken());
    if (input.offerId) params.set("offerId", input.offerId);
    if (input.conversationId) params.set("conversationId", input.conversationId);

    FINANCIAL_LOGGER("SUCCESS");
    FINANCIAL_LOGGER("CHECKOUT ALLOWED");
    FINANCIAL_LOGGER("FINISHED");

    return {
      ok: true,
      checkoutPath: `/checkout/${slug}?${params.toString()}`,
      idempotencyKey,
      lockToken: params.get("lt") ?? mintLockToken(),
      orderId: null,
      transactionId: null,
      checkoutSessionId: sessionResult.session.public_id,
      paymentIntentId: paymentIntent.id,
      listingId: product.id,
      buyerId: input.buyerId,
      sellerId,
      price: itemPrice,
      platformFee: audit.platformFee,
      shipping: shippingValue,
      currency,
      reservedUntil: sessionResult.session.expires_at,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    FINANCIAL_LOGGER("STOP", message);
    return await failAfterLock("RVX-2012");
  }
}
