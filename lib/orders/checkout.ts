import { createAdminClient } from "@/lib/supabase/admin";
import { getDeliveryCarrierFromQuote } from "@/lib/checkout/delivery";
import {
  fetchCheckoutCarrierQuotes,
  findCheckoutCarrierQuote,
} from "@/lib/checkout/shipping-quotes.server";
import {
  isPurchasable,
  releaseProductInventory,
  restoreProductInventoryClaim,
} from "@/lib/inventory/service";
import { notifyOrderCancelled } from "@/lib/orders/notifications";
import { onOrderCancelled } from "@/lib/trust/events";
import { getOrderById } from "@/lib/orders/store";
import type { Order } from "@/lib/orders/types";
import { calculateSellerNetAmount } from "@/lib/wallet/sales";
import { getAppBaseUrl, getStripeClient, isStripeConfigured, isStripeRequired } from "@/lib/stripe/server";
import { ensureStripeCustomer } from "@/lib/payments/repository";
import { assertMarketplacePurchaseAllowedForProductSlug } from "@/lib/transaction-mode/validate";
import { completePaidOrderFulfillment } from "@/lib/orders/post-payment.server";
import { resolveLockedAcceptedOffer } from "@/lib/offers/accepted-price";
import { mustSettleWithoutStripe, mustUseVirtualPayments } from "@/lib/full-demo/security";
import { debitVirtualBuyerWallet } from "@/lib/full-demo/virtual-checkout";
import { isSelfPurchaseBlocked } from "@/lib/checkout/self-purchase-absolute-law-v1";
import {
  CHECKOUT_SESSION_ENGINE_attachStripe,
  CHECKOUT_SESSION_ENGINE_destroy,
  CHECKOUT_SESSION_ENGINE_expireAll,
  CHECKOUT_SESSION_ENGINE_getByPublicId,
  CHECKOUT_SESSION_ENGINE_isExpired,
  CHECKOUT_SESSION_ENGINE_markPaid,
} from "@/lib/checkout/engines/checkout-session-engine-v1";
import { CHECKOUT_SESSION_TTL_SECONDS } from "@/lib/checkout/engines/status-map-v1";
import { createOrderFromPaidCheckoutSession } from "@/lib/orders/create-order-from-checkout-session.server";
import {
  buildSelectedShippingQuotePayload,
  parseConfirmedShippingQuotePayloadFromMetadata,
} from "@/lib/shipping/selected-shipping-quote-contract-v1";
import type { ShippingQuotePayload } from "@/lib/shipping/types";
import { isBundleCheckoutSnapshot } from "@/lib/bundle/bundle-snapshot-v1";
import {
  CHECKOUT_RACE_CONDITION_V1,
  isItemJustSoldError,
} from "@/lib/checkout/checkout-race-condition-v1";

/** Refund Stripe PI when payment won the race for money but lost inventory claim. */
async function refundItemJustSoldPayment(input: {
  paymentIntentId: string | null;
  checkoutSessionPublicId: string;
}): Promise<void> {
  const fresh = await CHECKOUT_SESSION_ENGINE_getByPublicId(input.checkoutSessionPublicId);
  if (fresh && fresh.status === "open") {
    await CHECKOUT_SESSION_ENGINE_destroy({ session: fresh, status: "cancelled" });
  }

  if (!input.paymentIntentId || !isStripeConfigured()) return;
  if (
    input.paymentIntentId.startsWith("pi_virtual_") ||
    input.paymentIntentId.startsWith("virtual_")
  ) {
    return;
  }

  try {
    const stripe = getStripeClient();
    await stripe.refunds.create(
      {
        payment_intent: input.paymentIntentId,
        reason: "requested_by_customer",
        metadata: {
          reason: CHECKOUT_RACE_CONDITION_V1.conflictCode,
          checkoutSessionId: input.checkoutSessionPublicId,
        },
      },
      {
        idempotencyKey: `item-just-sold-refund-${input.paymentIntentId}`,
      },
    );
  } catch (error) {
    console.error(
      "[checkout-race] refund after ITEM_JUST_SOLD failed:",
      error instanceof Error ? error.message : error,
    );
  }
}

/** @deprecated Legacy awaiting_payment window. Absolute Law = 120s checkout session. */
const RESERVATION_MINUTES = Math.ceil(CHECKOUT_SESSION_TTL_SECONDS / 60);

export const ORDER_CHECKOUT_RESERVATION_MINUTES = RESERVATION_MINUTES;

type CheckoutInput = {
  buyerId: string;
  productSlug: string;
  deliveryOption: string;
  shippingAddressId?: string;
  shippingQuoteId?: string | null;
  hubConversationId?: string;
  /** Wallet payment method id (SSOT) — maps to Stripe PM when present. */
  paymentMethodId?: string | null;
  /** UI settlement choice — card vs Rovexo Balance. */
  paymentMethod?: "card" | "rovexo_balance" | null;
  /** Accepted offer id — locks transaction price to offers.amount. */
  offerId?: string | null;
  /** Buy Now / Confirm & Pay idempotency — prevents duplicate orders on double-submit. */
  idempotencyKey?: string | null;
  /** @deprecated Legacy Blood XXIV pending order — cutover drain only. */
  orderId?: string | null;
  /** Master Architecture — durable Checkout Session public_id (`cs`). */
  checkoutSessionId?: string | null;
};

type CheckoutResult =
  | { orderId: string | null; url: string; order?: Order; checkoutSessionId?: string }
  | { error: string };

type CheckoutProductRow = {
  id: string;
  slug: string;
  title: string;
  price: number;
  condition: string;
  stock: number;
  status: string;
  seller_id: string;
  shipping_price: number | null;
  product_images: Array<{ url: string; is_primary: boolean; sort_order: number }> | null;
};

/**
 * Blood XXIV — Confirm & Pay against an existing PENDING_PAYMENT order (no second order).
 */
async function finalizePendingOrderCheckoutSession(
  input: CheckoutInput & { orderId: string; product: CheckoutProductRow },
): Promise<CheckoutResult> {
  const admin = createAdminClient();
  const product = input.product;

  const { data: orderRow } = await admin
    .from("orders")
    .select(
      "id, order_number, buyer_id, status, reserved_until, stripe_session_id, item_price, delivery_fee, protected_fee, total",
    )
    .eq("id", input.orderId)
    .maybeSingle();

  if (!orderRow || orderRow.buyer_id !== input.buyerId || orderRow.status !== "awaiting_payment") {
    return { error: "Unable to create order." };
  }

  if (!orderRow.reserved_until || new Date(orderRow.reserved_until).getTime() <= Date.now()) {
    return { error: "Payment session expired." };
  }

  if (orderRow.stripe_session_id && isStripeConfigured() && !mustUseVirtualPayments()) {
    try {
      const stripe = getStripeClient();
      const session = await stripe.checkout.sessions.retrieve(orderRow.stripe_session_id);
      if (session.url && session.status === "open") {
        const order = await getOrderById(orderRow.id);
        return { orderId: orderRow.id, url: session.url, order: order ?? undefined };
      }
    } catch {
      // recreate session below
    }
  }

  // Absolute Total Price Law v1.0 — money locked at Buy Now must never change.
  const lockedItemPrice = Number(orderRow.item_price);
  const lockedDelivery = Number(orderRow.delivery_fee ?? 0);
  const lockedPlatformFee = Number(orderRow.protected_fee);
  const lockedTotal = Number(orderRow.total);
  if (
    !Number.isFinite(lockedItemPrice) ||
    !Number.isFinite(lockedDelivery) ||
    !Number.isFinite(lockedPlatformFee) ||
    !Number.isFinite(lockedTotal) ||
    lockedTotal <= 0
  ) {
    return { error: "Unable to create order." };
  }

  const listingOffersFreeDelivery = product.shipping_price === 0;
  let deliveryCarrier = getDeliveryCarrierFromQuote(null);

  if (input.shippingQuoteId && input.shippingAddressId) {
    const { data: shippingAddress } = await admin
      .from("shipping_addresses")
      .select("recipient_name, address_line, postcode, country")
      .eq("id", input.shippingAddressId)
      .maybeSingle();

    if (shippingAddress) {
      const { options } = await fetchCheckoutCarrierQuotes({
        productSlug: input.productSlug,
        recipientName: shippingAddress.recipient_name,
        addressLine: shippingAddress.address_line,
        postcode: shippingAddress.postcode,
        country: shippingAddress.country,
      });
      deliveryCarrier = getDeliveryCarrierFromQuote(
        findCheckoutCarrierQuote(options, input.shippingQuoteId ?? ""),
      );
    }
  }

  if (!listingOffersFreeDelivery && lockedDelivery < 0) {
    return { error: "Unable to retrieve shipping price." };
  }

  const { platformFee, sellerAmount } = calculateSellerNetAmount(lockedItemPrice);
  const totals = {
    itemPrice: lockedItemPrice,
    platformFee: lockedPlatformFee,
    delivery: lockedDelivery,
    deliveryPending: false,
    total: lockedTotal,
  };

  const lockedOffer = await resolveLockedAcceptedOffer({
    buyerId: input.buyerId,
    productId: product.id,
    offerId: input.offerId,
  });

  await admin
    .from("orders")
    .update({
      delivery_carrier: deliveryCarrier,
      selected_shipping_quote_id:
        typeof input.shippingQuoteId === "string" && input.shippingQuoteId.trim()
          ? input.shippingQuoteId.trim()
          : null,
      platform_fee: platformFee,
      seller_payout: sellerAmount,
      shipping_address_id: input.shippingAddressId ?? null,
    })
    .eq("id", orderRow.id);

  const baseUrl = getAppBaseUrl();
  const orderSuccessPath = `/checkout/${product.slug}/success?order_id=${orderRow.id}`;
  const orderSuccessUrl = `${baseUrl}${orderSuccessPath}`;
  const cancelQuery = new URLSearchParams({
    order: "cancelled",
    order_id: orderRow.id,
  });
  const cancelPath = input.hubConversationId
    ? `/inbox/conversation/${input.hubConversationId}?payment=cancelled&${cancelQuery.toString()}&slug=${product.slug}`
    : `/checkout/${product.slug}?${cancelQuery.toString()}`;
  const cancelUrl = `${baseUrl}${cancelPath}`;
  const resolvedOrderNumber = orderRow.order_number;

  if (mustUseVirtualPayments()) {
    const debit = await debitVirtualBuyerWallet({
      buyerId: input.buyerId,
      amount: totals.total,
      orderId: orderRow.id,
      orderNumber: resolvedOrderNumber,
      productTitle: product.title,
    });

    if (!debit.ok) {
      return { error: debit.error };
    }

    const fulfilled = await fulfillOrderFromStripeSession({
      id: debit.sessionId,
      metadata: {
        checkoutType: "order",
        orderId: orderRow.id,
        buyerId: input.buyerId,
        sellerId: product.seller_id,
        productId: product.id,
        paymentMode: "virtual_demo",
      },
      payment_intent: debit.sessionId,
      payment_status: "paid",
    });

    if (!fulfilled.success) {
      return { error: fulfilled.error ?? "Unable to complete virtual payment." };
    }

    await admin.from("orders").update({ stripe_session_id: debit.sessionId }).eq("id", orderRow.id);
    const order = await getOrderById(orderRow.id);
    return { orderId: orderRow.id, url: orderSuccessUrl, order: order ?? undefined };
  }

  if (!isStripeConfigured()) {
    if (isStripeRequired()) {
      return { error: "Payments are not configured." };
    }

    const fulfilled = await fulfillOrderFromStripeSession({
      id: `dev-${orderRow.id}`,
      metadata: { checkoutType: "order", orderId: orderRow.id },
      payment_intent: null,
    });

    if (!fulfilled.success) {
      return { error: fulfilled.error ?? "Unable to complete order." };
    }

    const order = await getOrderById(orderRow.id);
    return { orderId: orderRow.id, url: orderSuccessUrl, order: order ?? undefined };
  }

  const stripe = getStripeClient();
  const customerId = await ensureStripeCustomer(input.buyerId);
  const { listPaymentMethods, setDefaultPaymentMethod } = await import("@/lib/payments/repository");
  const savedMethods = await listPaymentMethods(input.buyerId);
  const selected =
    savedMethods.find((method) => method.id === input.paymentMethodId) ??
    savedMethods.find((method) => method.isDefault) ??
    savedMethods[0] ??
    null;
  if (selected && customerId) {
    try {
      await setDefaultPaymentMethod(input.buyerId, selected.id);
    } catch {
      // non-fatal
    }
  }

  const lineItems: Array<{
    quantity: number;
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: { name: string; description?: string };
    };
  }> = [
    {
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: Math.round(totals.itemPrice * 100),
        product_data: { name: product.title, description: product.condition },
      },
    },
    {
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: Math.round(totals.platformFee * 100),
        product_data: { name: "Platform Fee" },
      },
    },
  ];

  if (totals.delivery > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: Math.round(totals.delivery * 100),
        product_data: { name: `${deliveryCarrier} delivery` },
      },
    });
  }

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      payment_method_types: ["card"],
      ...(customerId ? { customer: customerId } : {}),
      line_items: lineItems,
      metadata: {
        checkoutType: "order",
        orderId: orderRow.id,
        buyerId: input.buyerId,
        sellerId: product.seller_id,
        productId: product.id,
        paymentMethodId: selected?.id ?? "",
        offerId: lockedOffer?.offerId ?? "",
        acceptedOfferPrice: lockedOffer ? String(lockedOffer.acceptedOfferPrice) : "",
      },
      payment_intent_data: {
        metadata: {
          checkoutType: "order",
          orderId: orderRow.id,
          buyerId: input.buyerId,
          sellerId: product.seller_id,
          productId: product.id,
          offerId: lockedOffer?.offerId ?? "",
          acceptedOfferPrice: lockedOffer ? String(lockedOffer.acceptedOfferPrice) : "",
        },
      },
      success_url: `${orderSuccessUrl}${orderSuccessUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      expires_at: Math.floor(Date.now() / 1000) + RESERVATION_MINUTES * 60,
    },
    { idempotencyKey: `order-checkout-${orderRow.id}` },
  );

  if (!session.url) {
    return { error: "Unable to create checkout session." };
  }

  await admin.from("orders").update({ stripe_session_id: session.id }).eq("id", orderRow.id);
  return { orderId: orderRow.id, url: session.url };
}

/**
 * Master Checkout Architecture — Confirm & Pay against open Checkout Session.
 * Creates Stripe session (or virtual pay → order). Never creates awaiting_payment.
 */
async function finalizeCheckoutSessionPayment(
  input: CheckoutInput & { checkoutSessionId: string; product: CheckoutProductRow },
): Promise<CheckoutResult> {
  const admin = createAdminClient();
  const product = input.product;
  const csPublicId = input.checkoutSessionId;

  const session = await CHECKOUT_SESSION_ENGINE_getByPublicId(csPublicId);
  if (!session || session.buyer_id !== input.buyerId || session.listing_id !== product.id) {
    return { error: "Unable to create order." };
  }

  if (session.status === "paid" && session.order_id) {
    const order = await getOrderById(session.order_id);
    const baseUrl = getAppBaseUrl();
    return {
      orderId: session.order_id,
      checkoutSessionId: session.public_id,
      url: `${baseUrl}/checkout/${product.slug}/success?order_id=${session.order_id}`,
      order: order ?? undefined,
    };
  }

  if (session.status !== "open" || CHECKOUT_SESSION_ENGINE_isExpired(session.expires_at)) {
    if (session.status === "open") {
      await CHECKOUT_SESSION_ENGINE_destroy({ session, status: "expired" });
    }
    return { error: "Payment session expired." };
  }

  // Open session only — stock/status after paid short-circuit (blocks RVX-2007 on retry).
  if (product.status !== "reserved" && product.status !== "published") {
    return { error: "This item is out of stock." };
  }
  if (product.stock <= 0) {
    return { error: "This item is out of stock." };
  }

  if (!input.shippingAddressId) {
    return { error: "Shipping address is required." };
  }

  const { data: buyerProfile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", input.buyerId)
    .maybeSingle();
  const settleWithoutStripe = mustSettleWithoutStripe({
    buyerEmail: buyerProfile?.email,
    paymentMethod: input.paymentMethod ?? null,
  });

  // Absolute Total Price Law — amounts locked on Checkout Session at Buy Now.
  // Live carrier quote (Ship to Home) may refine shipping after Buy Now; when a
  // quote is selected, persist shipping + total so PAY · debit · order stay equal.
  const lockedItemPrice = Number(session.item_price);
  let lockedDelivery = Number(session.shipping);
  const lockedPlatformFee = Number(session.platform_fee);
  let lockedTotal = Number(session.total);
  if (
    !Number.isFinite(lockedItemPrice) ||
    !Number.isFinite(lockedDelivery) ||
    !Number.isFinite(lockedPlatformFee) ||
    !Number.isFinite(lockedTotal)
  ) {
    return { error: "Unable to create order." };
  }

  const roundMoney = (value: number) => Math.round(value * 100) / 100;

  // Absolute Total Price Law — session amounts lock at Buy Now; selected live
  // carrier quote may refine shipping to canonical buyer price (provider + 15p).
  const listingShippingRaw = product.shipping_price;
  const listingShippingKnown =
    listingShippingRaw != null && Number.isFinite(Number(listingShippingRaw));

  let deliveryCarrier = getDeliveryCarrierFromQuote(null);
  let shippingRefinedFromQuote = false;
  let selectedShippingQuoteId: string | null =
    typeof input.shippingQuoteId === "string" && input.shippingQuoteId.trim()
      ? input.shippingQuoteId.trim()
      : session.selected_shipping_quote_id?.trim() || null;
  let selectedShippingQuotePayload: ShippingQuotePayload | null = null;
  if (input.shippingQuoteId && input.shippingAddressId) {
    const { data: shippingAddress } = await admin
      .from("shipping_addresses")
      .select("recipient_name, address_line, postcode, country")
      .eq("id", input.shippingAddressId)
      .maybeSingle();
    if (shippingAddress) {
      const { options } = await fetchCheckoutCarrierQuotes({
        productSlug: input.productSlug,
        recipientName: shippingAddress.recipient_name,
        addressLine: shippingAddress.address_line,
        postcode: shippingAddress.postcode,
        country: shippingAddress.country,
      });
      const selectedQuote = findCheckoutCarrierQuote(
        options,
        input.shippingQuoteId ?? "",
      );
      deliveryCarrier = getDeliveryCarrierFromQuote(selectedQuote);
      if (selectedQuote?.id) {
        selectedShippingQuoteId = selectedQuote.id;
        selectedShippingQuotePayload = buildSelectedShippingQuotePayload(selectedQuote);
      }
      if (
        selectedQuote &&
        Number.isFinite(selectedQuote.price) &&
        selectedQuote.price >= 0
      ) {
        // Canonical buyer shipping (provider pence + 15) from live quote — must match checkout UI.
        lockedDelivery = roundMoney(selectedQuote.price);
        lockedTotal = roundMoney(lockedItemPrice + lockedPlatformFee + lockedDelivery);
        shippingRefinedFromQuote = true;
      }
      // Persist exact Sendcloud quote identity (sendcloud:<methodId>) — never reconstruct later.
      const { error: amountError } = await admin
        .from("checkout_sessions")
        .update({
          selected_shipping_quote_id: selectedShippingQuoteId,
          updated_at: new Date().toISOString(),
          ...(shippingRefinedFromQuote
            ? { shipping: lockedDelivery, total: lockedTotal }
            : {}),
        })
        .eq("id", session.id)
        .eq("status", "open");
      if (amountError) {
        return { error: "Unable to lock shipping total." };
      }
    }
  } else if (selectedShippingQuoteId && !session.selected_shipping_quote_id) {
    await admin
      .from("checkout_sessions")
      .update({
        selected_shipping_quote_id: selectedShippingQuoteId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id)
      .eq("status", "open");
  }

  if (!listingShippingKnown && !input.shippingQuoteId) {
    return { error: "Select a delivery option to continue." };
  }

  if (session.stripe_checkout_session_id && isStripeConfigured() && !settleWithoutStripe) {
    try {
      const stripe = getStripeClient();
      const existing = await stripe.checkout.sessions.retrieve(session.stripe_checkout_session_id);
      if (existing.url && existing.status === "open") {
        const expectedTotalPence = Math.round(lockedTotal * 100);
        const stripeTotal = existing.amount_total;
        // Reuse only when Stripe total still matches locked ROVEXO total.
        // After shipping quote refine, recreate so PaymentIntent includes shipping.
        if (
          typeof stripeTotal === "number" &&
          stripeTotal === expectedTotalPence &&
          !shippingRefinedFromQuote
        ) {
          return {
            orderId: null,
            checkoutSessionId: session.public_id,
            url: existing.url,
          };
        }
        try {
          await stripe.checkout.sessions.expire(existing.id);
        } catch {
          // recreate below
        }
        await admin
          .from("checkout_sessions")
          .update({
            stripe_checkout_session_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id)
          .eq("status", "open");
      }
    } catch {
      // recreate below
    }
  }

  const baseUrl = getAppBaseUrl();
  const orderSuccessPath = `/checkout/${product.slug}/success?cs=${encodeURIComponent(session.public_id)}`;
  const orderSuccessUrl = `${baseUrl}${orderSuccessPath}`;
  const cancelQuery = new URLSearchParams({
    order: "cancelled",
    cs: session.public_id,
  });
  const cancelPath = input.hubConversationId
    ? `/inbox/conversation/${input.hubConversationId}?payment=cancelled&${cancelQuery.toString()}&slug=${product.slug}`
    : `/checkout/${product.slug}?${cancelQuery.toString()}`;
  const cancelUrl = `${baseUrl}${cancelPath}`;

  if (settleWithoutStripe) {
    const virtualSessionId = `virtual_${session.public_id}`;
    const virtualPi = `pi_virtual_${session.public_id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)}`;

    const created = await createOrderFromPaidCheckoutSession({
      checkoutSessionPublicId: session.public_id,
      shippingAddressId: input.shippingAddressId,
      deliveryCarrier,
      selectedShippingQuoteId,
      selectedShippingQuotePayload,
      stripeSessionId: virtualSessionId,
      stripePaymentIntentId: virtualPi,
      fulfill: false,
    });
    if (!created.success) {
      return { error: created.error };
    }

    const { data: orderMeta } = await admin
      .from("orders")
      .select("order_number")
      .eq("id", created.orderId)
      .maybeSingle();

    const debit = await debitVirtualBuyerWallet({
      buyerId: input.buyerId,
      amount: lockedTotal,
      orderId: created.orderId,
      orderNumber: orderMeta?.order_number ?? created.orderId,
      productTitle: product.title,
    });

    if (!debit.ok) {
      await admin.from("orders").update({ status: "cancelled" }).eq("id", created.orderId);
      await restoreProductInventoryClaim(product.id, 1);
      const fresh = await CHECKOUT_SESSION_ENGINE_getByPublicId(session.public_id);
      if (fresh && fresh.status === "open") {
        await CHECKOUT_SESSION_ENGINE_destroy({ session: fresh, status: "cancelled" });
      }
      return { error: debit.error };
    }

    await CHECKOUT_SESSION_ENGINE_markPaid({
      sessionId: session.id,
      orderId: created.orderId,
      stripeSessionId: debit.sessionId,
      stripePaymentIntentId: virtualPi,
    });

    const fulfilled = await completePaidOrderFulfillment({
      orderId: created.orderId,
      stripeSessionId: debit.sessionId,
      stripePaymentIntentId: virtualPi,
      inventoryAlreadyClaimed: true,
      selectedShippingQuotePayload,
    });
    if (!fulfilled.success) {
      return { error: fulfilled.error ?? "Unable to complete virtual payment." };
    }

    const order = await getOrderById(created.orderId);
    return {
      orderId: created.orderId,
      checkoutSessionId: session.public_id,
      url: `${orderSuccessUrl}&order_id=${created.orderId}`,
      order: order ?? undefined,
    };
  }

  if (!isStripeConfigured()) {
    if (isStripeRequired()) {
      return { error: "Payments are not configured." };
    }

    const created = await createOrderFromPaidCheckoutSession({
      checkoutSessionPublicId: session.public_id,
      shippingAddressId: input.shippingAddressId,
      deliveryCarrier,
      selectedShippingQuoteId,
      selectedShippingQuotePayload,
      stripeSessionId: `dev-${session.public_id}`,
      stripePaymentIntentId: null,
    });
    if (!created.success) {
      return { error: created.error };
    }
    const order = await getOrderById(created.orderId);
    return {
      orderId: created.orderId,
      checkoutSessionId: session.public_id,
      url: `${orderSuccessUrl}&order_id=${created.orderId}`,
      order: order ?? undefined,
    };
  }

  const stripe = getStripeClient();
  const customerId = await ensureStripeCustomer(input.buyerId);

  const { listPaymentMethods, setDefaultPaymentMethod } = await import("@/lib/payments/repository");
  const savedMethods = await listPaymentMethods(input.buyerId);
  const selected =
    savedMethods.find((method) => method.id === input.paymentMethodId) ??
    savedMethods.find((method) => method.isDefault) ??
    savedMethods[0] ??
    null;
  if (selected && customerId) {
    try {
      await setDefaultPaymentMethod(input.buyerId, selected.id);
    } catch {
      // Non-fatal
    }
  }

  const lineItems: Array<{
    quantity: number;
    price_data: {
      currency: string;
      unit_amount: number;
      product_data: { name: string; description?: string };
    };
  }> = [
    {
      quantity: 1,
      price_data: {
        currency: (session.currency || "gbp").toLowerCase(),
        unit_amount: Math.round(lockedItemPrice * 100),
        product_data: {
          name: isBundleCheckoutSnapshot(session.bundle_lines)
            ? `Bundle (${session.bundle_lines.lines.length} items)`
            : product.title,
          description: isBundleCheckoutSnapshot(session.bundle_lines)
            ? `bundleId:${session.bundle_lines.bundleId}`
            : product.condition,
        },
      },
    },
    {
      quantity: 1,
      price_data: {
        currency: (session.currency || "gbp").toLowerCase(),
        unit_amount: Math.round(lockedPlatformFee * 100),
        product_data: { name: "Platform Fee" },
      },
    },
  ];

  if (lockedDelivery > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: (session.currency || "gbp").toLowerCase(),
        unit_amount: Math.round(lockedDelivery * 100),
        product_data: { name: `${deliveryCarrier} delivery` },
      },
    });
  }

  // Stripe expires_at minimum is ~30m; ROVEXO Absolute Law enforces 120s via session destroy.
  const stripeExpiresAt = Math.floor(Date.now() / 1000) + 30 * 60;
  const bundleSnap = isBundleCheckoutSnapshot(session.bundle_lines) ? session.bundle_lines : null;
  const bundleLinesMeta = bundleSnap
    ? JSON.stringify(
        bundleSnap.lines.map((line) => ({
          productId: line.productId,
          qty: line.quantity,
          unitPrice: line.unitPrice,
        })),
      ).slice(0, 450)
    : "";

  const stripeSession = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      payment_method_types: ["card"],
      ...(customerId ? { customer: customerId } : {}),
      line_items: lineItems,
      metadata: {
        checkoutType: "order",
        checkoutSessionId: session.public_id,
        buyerId: input.buyerId,
        sellerId: product.seller_id,
        productId: product.id,
        shippingAddressId: input.shippingAddressId,
        deliveryCarrier,
        shippingQuoteId: selectedShippingQuoteId ?? "",
        ...(selectedShippingQuotePayload?.shippingOptionCode
          ? { shippingOptionCode: selectedShippingQuotePayload.shippingOptionCode }
          : {}),
        ...(selectedShippingQuotePayload?.contractId
          ? { shippingContractId: selectedShippingQuotePayload.contractId }
          : {}),
        paymentMethodId: selected?.id ?? "",
        offerId: session.offer_id ?? "",
        bundleId: bundleSnap?.bundleId ?? "",
        bundleLines: bundleLinesMeta,
        currency: session.currency || "GBP",
        subtotal: String(lockedItemPrice),
        snapshotLockedAt: bundleSnap?.lockedAt ?? "",
      },
      payment_intent_data: {
        metadata: {
          checkoutType: "order",
          checkoutSessionId: session.public_id,
          buyerId: input.buyerId,
          sellerId: product.seller_id,
          productId: product.id,
          shippingAddressId: input.shippingAddressId,
          deliveryCarrier,
          shippingQuoteId: selectedShippingQuoteId ?? "",
          ...(selectedShippingQuotePayload?.shippingOptionCode
            ? { shippingOptionCode: selectedShippingQuotePayload.shippingOptionCode }
            : {}),
          ...(selectedShippingQuotePayload?.contractId
            ? { shippingContractId: selectedShippingQuotePayload.contractId }
            : {}),
          offerId: session.offer_id ?? "",
          bundleId: bundleSnap?.bundleId ?? "",
          bundleLines: bundleLinesMeta,
          currency: session.currency || "GBP",
          subtotal: String(lockedItemPrice),
        },
      },
      success_url: `${orderSuccessUrl}${orderSuccessUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      expires_at: stripeExpiresAt,
    },
    {
      idempotencyKey: `cs-checkout-${session.public_id}`,
    },
  );

  if (!stripeSession.url) {
    return { error: "Unable to create checkout session." };
  }

  await CHECKOUT_SESSION_ENGINE_attachStripe({
    sessionId: session.id,
    stripeCheckoutSessionId: stripeSession.id,
    stripePaymentIntentId:
      typeof stripeSession.payment_intent === "string"
        ? stripeSession.payment_intent
        : stripeSession.payment_intent?.id ?? null,
  });

  return {
    orderId: null,
    checkoutSessionId: session.public_id,
    url: stripeSession.url,
  };
}

export async function createOrderCheckoutSession(
  input: CheckoutInput,
): Promise<CheckoutResult> {
  await CHECKOUT_SESSION_ENGINE_expireAll();
  // Drain leftover Blood XXIV awaiting_payment (lazy import — avoid circular deps).
  const { AUTO_CANCEL_ENGINE_run } = await import(
    "@/lib/checkout/engines/auto-cancel-engine-v1"
  );
  await AUTO_CANCEL_ENGINE_run();

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select(
      "id, slug, title, price, condition, stock, status, seller_id, shipping_price, product_images(url, is_primary, sort_order)",
    )
    .eq("slug", input.productSlug)
    .maybeSingle();

  if (!product) {
    return { error: "Product not found." };
  }

  const purchaseCheck = await assertMarketplacePurchaseAllowedForProductSlug(input.productSlug);
  if (!purchaseCheck.allowed) {
    return { error: purchaseCheck.error };
  }

  if (
    isSelfPurchaseBlocked({
      currentUserId: input.buyerId,
      listingOwnerId: product.seller_id,
    })
  ) {
    return { error: "You cannot purchase your own listing." };
  }

  const { data: sellerSettings } = await admin
    .from("user_settings")
    .select("vacation_mode")
    .eq("user_id", product.seller_id)
    .maybeSingle();

  if (sellerSettings?.vacation_mode) {
    return { error: "This seller is currently on vacation and not accepting orders." };
  }

  const csId = input.checkoutSessionId?.trim() || null;
  if (csId) {
    /**
     * Absolute Financial Law — ONE CLICK = ONE PAYMENT = ONE ORDER.
     * Duplicate Confirm & Pay (double-click / retry / refresh) MUST return the
     * same paid order. Stock is already 0 after first settlement — evaluating
     * stock BEFORE the paid-session short-circuit falsely returns RVX-2007.
     * Stock / status gates live inside finalizeCheckoutSessionPayment AFTER
     * the `status === "paid"` idempotent return.
     */
    return finalizeCheckoutSessionPayment({
      ...input,
      checkoutSessionId: csId,
      product,
    });
  }

  // Legacy cutover: Confirm & Pay with old awaiting_payment orderId only.
  const existingOrderId = input.orderId?.trim() || null;
  if (!existingOrderId) {
    return { error: "Checkout session required." };
  }

  if (!isPurchasable(product.stock, product.status) && product.status !== "reserved") {
    return { error: "This item is out of stock." };
  }

  return finalizePendingOrderCheckoutSession({
    ...input,
    orderId: existingOrderId,
    product,
  });
}

export async function fulfillOrderFromStripeSession(session: {
  id: string;
  metadata: Record<string, string | undefined> | null;
  payment_intent?: string | { id: string } | null;
  payment_status?: string;
}): Promise<{ success: boolean; error?: string; orderId?: string }> {
  const metadata = session.metadata ?? {};
  if (metadata.checkoutType !== "order") {
    return { success: false, error: "Not an order checkout session." };
  }

  if (session.payment_status && session.payment_status !== "paid") {
    return { success: false, error: "Payment not completed." };
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const checkoutSessionId = metadata.checkoutSessionId?.trim() || null;
  if (checkoutSessionId) {
    const created = await createOrderFromPaidCheckoutSession({
      checkoutSessionPublicId: checkoutSessionId,
      shippingAddressId: metadata.shippingAddressId || null,
      deliveryCarrier: metadata.deliveryCarrier || null,
      selectedShippingQuoteId: metadata.shippingQuoteId || null,
      selectedShippingQuotePayload: parseConfirmedShippingQuotePayloadFromMetadata({
        selectedQuoteId: metadata.shippingQuoteId || null,
        shippingOptionCode: metadata.shippingOptionCode || null,
        contractId: metadata.shippingContractId || null,
      }),
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
    });
    if (!created.success) {
      if (isItemJustSoldError(created.error)) {
        await refundItemJustSoldPayment({
          paymentIntentId,
          checkoutSessionPublicId: checkoutSessionId,
        });
      }
      return { success: false, error: created.error };
    }
    return { success: true, orderId: created.orderId };
  }

  const orderId = metadata.orderId;
  if (!orderId) {
    return { success: false, error: "Missing order metadata." };
  }

  const fulfilled = await completePaidOrderFulfillment({
    orderId,
    stripeSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
  });
  return { ...fulfilled, orderId };
}

export async function cancelPendingOrder(
  orderId: string,
  reason?: string,
  options?: { initiatedBy?: "buyer" | "seller" | "system" },
): Promise<void> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("status, order_number, buyer_id, seller_id, order_items(product_id, quantity)")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.status !== "awaiting_payment") {
    return;
  }

  const item = (
    order.order_items as Array<{ product_id: string | null; quantity: number }> | null
  )?.[0];

  if (item?.product_id) {
    await releaseProductInventory(item.product_id, item.quantity ?? 1);
  }

  await admin.from("orders").update({ status: "cancelled" }).eq("id", orderId);

  const { data: buyerProfile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", order.buyer_id)
    .maybeSingle();

  await notifyOrderCancelled({
    buyerId: order.buyer_id,
    buyerEmail: buyerProfile?.email ?? "",
    orderId,
    orderNumber: order.order_number,
    reason,
  });

  void onOrderCancelled({
    orderId,
    buyerId: order.buyer_id,
    sellerId: String(order.seller_id),
    initiatedBy: options?.initiatedBy ?? "system",
  });
}

export async function confirmOrderCheckoutSession(
  sessionId: string,
  buyerId: string,
): Promise<{ success: boolean; order?: Order; error?: string }> {
  if (!isStripeConfigured()) {
    return { success: false, error: "Stripe is not configured." };
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.metadata?.buyerId !== buyerId) {
    return { success: false, error: "Checkout session does not belong to this buyer." };
  }

  if (session.payment_status !== "paid") {
    return { success: false, error: "Payment not completed." };
  }

  const result = await fulfillOrderFromStripeSession(session);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  let finalOrderId: string | null = result.orderId ?? session.metadata?.orderId ?? null;
  if (!finalOrderId && session.metadata?.checkoutSessionId) {
    const row = await CHECKOUT_SESSION_ENGINE_getByPublicId(session.metadata.checkoutSessionId);
    finalOrderId = row?.order_id ?? null;
  }

  const order = finalOrderId ? await getOrderById(finalOrderId) : null;
  return { success: true, order: order ?? undefined };
}

