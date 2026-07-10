import { createAdminClient } from "@/lib/supabase/admin";
import { getDeliveryCarrierFromQuote, getDeliveryPrice } from "@/lib/checkout/delivery";
import {
  fetchCheckoutCarrierQuotes,
  findCheckoutCarrierQuote,
  resolveLiveDeliveryPrice,
} from "@/lib/checkout/shipping-quotes.server";
import { isPurchasable, releaseProductInventory, reserveProductInventory } from "@/lib/inventory/service";
import { notifyOrderCancelled } from "@/lib/orders/notifications";
import { onOrderCancelled } from "@/lib/trust/events";
import { calculateOrderTotals } from "@/lib/orders/pricing";
import { getOrderById } from "@/lib/orders/store";
import type { Order } from "@/lib/orders/types";
import { generateInvoiceNumber } from "@/lib/invoices/receipt";
import { calculateSellerNetAmount } from "@/lib/wallet/sales";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";
import { getAppBaseUrl, getStripeClient, isStripeConfigured, isStripeRequired } from "@/lib/stripe/server";
import { ensureStripeCustomer } from "@/lib/payments/repository";
import { assertMarketplacePurchaseAllowedForProductSlug } from "@/lib/transaction-mode/validate";
import { completePaidOrderFulfillment } from "@/lib/orders/post-payment.server";

const RESERVATION_MINUTES = 30;

export const ORDER_CHECKOUT_RESERVATION_MINUTES = RESERVATION_MINUTES;

type CheckoutInput = {
  buyerId: string;
  productSlug: string;
  deliveryOption: string;
  shippingAddressId?: string;
  shippingQuoteId?: string | null;
};

type CheckoutResult =
  | { orderId: string; url: string; order?: Order }
  | { error: string };

function primaryImage(
  images: Array<{ url: string; is_primary: boolean; sort_order: number }> | null | undefined,
): string {
  const sorted = [...(images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  return sorted[0]?.url ?? PRODUCT_IMAGE_FALLBACK;
}

export async function createOrderCheckoutSession(
  input: CheckoutInput,
): Promise<CheckoutResult> {
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

  if (product.seller_id === input.buyerId) {
    return { error: "You cannot purchase your own listing." };
  }

  if (!isPurchasable(product.stock, product.status)) {
    return { error: "This item is out of stock." };
  }

  const { data: sellerSettings } = await admin
    .from("user_settings")
    .select("vacation_mode")
    .eq("user_id", product.seller_id)
    .maybeSingle();

  if (sellerSettings?.vacation_mode) {
    return { error: "This seller is currently on vacation and not accepting orders." };
  }

  const reserved = await reserveProductInventory(product.id, 1);
  if (!reserved.success) {
    return { error: reserved.error ?? "Unable to reserve inventory." };
  }

  const listingOffersFreeDelivery = product.shipping_price === 0;
  let deliveryPrice = getDeliveryPrice({
    listingOffersFreeDelivery,
    listingShippingPrice: product.shipping_price != null ? Number(product.shipping_price) : null,
  });
  let deliveryCarrier = getDeliveryCarrierFromQuote(null);

  if (input.shippingQuoteId && input.shippingAddressId) {
    const { data: shippingAddress } = await admin
      .from("shipping_addresses")
      .select("recipient_name, address_line, postcode, country")
      .eq("id", input.shippingAddressId)
      .maybeSingle();

    if (shippingAddress) {
      const livePrice = await resolveLiveDeliveryPrice({
        productSlug: input.productSlug,
        shippingQuoteId: input.shippingQuoteId,
        recipientName: shippingAddress.recipient_name,
        addressLine: shippingAddress.address_line,
        postcode: shippingAddress.postcode,
        country: shippingAddress.country,
      });

      if (livePrice != null) {
        deliveryPrice = livePrice;
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
  }

  if (!listingOffersFreeDelivery && deliveryPrice == null) {
    await releaseProductInventory(product.id, 1);
    return { error: "Unable to retrieve shipping price." };
  }

  const totals = calculateOrderTotals(Number(product.price), deliveryPrice);
  const { platformFee, sellerAmount } = calculateSellerNetAmount(totals.itemPrice);
  const reservedUntil = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000).toISOString();
  const imageUrl = primaryImage(product.product_images);

  const { data: orderNumber } = await admin.rpc("generate_order_number");
  const resolvedOrderNumber = orderNumber ?? `RVX${Date.now().toString(36).toUpperCase()}`;
  const invoiceNumber = generateInvoiceNumber(resolvedOrderNumber);

  const { data: orderRow, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: resolvedOrderNumber,
      buyer_id: input.buyerId,
      seller_id: product.seller_id,
      status: "awaiting_payment",
      delivery_carrier: deliveryCarrier,
      item_price: totals.itemPrice,
      protected_fee: totals.platformFee,
      delivery_fee: totals.delivery,
      total: totals.total,
      platform_fee: platformFee,
      seller_payout: sellerAmount,
      invoice_number: invoiceNumber,
      reserved_until: reservedUntil,
      shipping_address_id: input.shippingAddressId ?? null,
    })
    .select("id, order_number")
    .single();

  if (orderError || !orderRow) {
    await releaseProductInventory(product.id, 1);
    return { error: "Unable to create order." };
  }

  await admin.from("order_items").insert({
    order_id: orderRow.id,
    product_id: product.id,
    title: product.title,
    slug: product.slug,
    price: totals.itemPrice,
    image_url: imageUrl,
    condition: product.condition,
    quantity: 1,
  });

  await admin.from("cart_items").delete().eq("user_id", input.buyerId).eq("product_id", product.id);

  const baseUrl = getAppBaseUrl();
  const orderSuccessUrl = `${baseUrl}/orders/${orderRow.id}?placed=1`;
  const cancelQuery = new URLSearchParams({
    order: "cancelled",
    order_id: orderRow.id,
  });

  if (!isStripeConfigured()) {
    if (isStripeRequired()) {
      await cancelPendingOrder(orderRow.id);
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
    return {
      orderId: orderRow.id,
      url: orderSuccessUrl,
      order: order ?? undefined,
    };
  }

  const stripe = getStripeClient();
  const customerId = await ensureStripeCustomer(input.buyerId);

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
        product_data: {
          name: product.title,
          description: product.condition,
        },
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

  // Platform collects the full payment; seller payouts run after delivery + hold via Connect transfers.
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
      },
      payment_intent_data: {
        metadata: {
          checkoutType: "order",
          orderId: orderRow.id,
          buyerId: input.buyerId,
          sellerId: product.seller_id,
          productId: product.id,
        },
      },
      success_url: `${orderSuccessUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/${product.slug}?${cancelQuery.toString()}`,
      expires_at: Math.floor(Date.now() / 1000) + RESERVATION_MINUTES * 60,
    },
    { idempotencyKey: `order-checkout-${orderRow.id}` },
  );

  if (!session.url) {
    await cancelPendingOrder(orderRow.id);
    return { error: "Unable to create checkout session." };
  }

  await admin
    .from("orders")
    .update({ stripe_session_id: session.id })
    .eq("id", orderRow.id);

  return { orderId: orderRow.id, url: session.url };
}

export async function fulfillOrderFromStripeSession(session: {
  id: string;
  metadata: Record<string, string | undefined> | null;
  payment_intent?: string | { id: string } | null;
  payment_status?: string;
}): Promise<{ success: boolean; error?: string }> {
  const metadata = session.metadata ?? {};
  if (metadata.checkoutType !== "order") {
    return { success: false, error: "Not an order checkout session." };
  }

  const orderId = metadata.orderId;
  if (!orderId) {
    return { success: false, error: "Missing order metadata." };
  }

  if (session.payment_status && session.payment_status !== "paid") {
    return { success: false, error: "Payment not completed." };
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  return completePaidOrderFulfillment({
    orderId,
    stripeSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
  });
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

  const orderId = session.metadata?.orderId;
  const order = orderId ? await getOrderById(orderId) : null;
  return { success: true, order: order ?? undefined };
}
