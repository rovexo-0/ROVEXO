import { createAdminClient } from "@/lib/supabase/admin";
import { getDeliveryCarrier, getDeliveryPrice, type DeliveryOptionId } from "@/lib/checkout/delivery";
import { isPurchasable, releaseProductInventory, reserveProductInventory } from "@/lib/inventory/service";
import { notifyOrderPaid, notifyOrderCancelled } from "@/lib/orders/notifications";
import { onOrderCancelled } from "@/lib/trust/events";
import { calculateOrderTotals } from "@/lib/orders/pricing";
import { getOrderById } from "@/lib/orders/store";
import type { Order } from "@/lib/orders/types";
import { buildOrderReceiptUrl, generateInvoiceNumber } from "@/lib/invoices/receipt";
import { calculateSellerNetAmount } from "@/lib/wallet/sales";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";
import { getAppBaseUrl, getStripeClient, isStripeConfigured, isStripeRequired } from "@/lib/stripe/server";

const RESERVATION_MINUTES = 30;

export const ORDER_CHECKOUT_RESERVATION_MINUTES = RESERVATION_MINUTES;

type CheckoutInput = {
  buyerId: string;
  productSlug: string;
  deliveryOption: DeliveryOptionId;
  shippingAddressId?: string;
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

  const deliveryCarrier = getDeliveryCarrier(input.deliveryOption);
  const listingOffersFreeDelivery = product.shipping_price === 0;
  const deliveryPrice = getDeliveryPrice(input.deliveryOption, { listingOffersFreeDelivery });
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
      protected_fee: totals.protectedFee,
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
  const successQuery = new URLSearchParams({
    order: "success",
    order_id: orderRow.id,
  });
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
      url: `${baseUrl}/checkout/${product.slug}?${successQuery.toString()}`,
      order: order ?? undefined,
    };
  }

  const stripe = getStripeClient();
  const { data: buyerProfile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", input.buyerId)
    .maybeSingle();

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
        unit_amount: Math.round(totals.protectedFee * 100),
        product_data: { name: "Buyer Protection" },
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
      customer_email: buyerProfile?.email ?? undefined,
      line_items: lineItems,
      metadata: {
        checkoutType: "order",
        orderId: orderRow.id,
        buyerId: input.buyerId,
        sellerId: product.seller_id,
        productId: product.id,
      },
      success_url: `${baseUrl}/checkout/${product.slug}?${successQuery.toString()}&session_id={CHECKOUT_SESSION_ID}`,
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

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      buyer_id,
      seller_id,
      item_price,
      stripe_session_id,
      order_items ( product_id, title, image_url, quantity )
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    return { success: false, error: "Order not found." };
  }

  if (order.status !== "awaiting_payment") {
    return { success: true };
  }

  if (session.payment_status && session.payment_status !== "paid") {
    return { success: false, error: "Payment not completed." };
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const now = new Date().toISOString();

  await admin
    .from("orders")
    .update({
      status: "awaiting_shipment",
      paid_at: now,
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      reserved_until: null,
      receipt_url: buildOrderReceiptUrl(orderId),
    })
    .eq("id", orderId)
    .eq("status", "awaiting_payment");

  const item = (
    order.order_items as Array<{
      product_id: string | null;
      title: string;
      image_url: string;
      quantity: number;
    }> | null
  )?.[0];

  if (item) {
    const { platformFee, sellerAmount } = calculateSellerNetAmount(Number(order.item_price));
    await admin
      .from("orders")
      .update({
        platform_fee: platformFee,
        seller_payout: sellerAmount,
      })
      .eq("id", orderId);
  }

  const [{ data: buyerProfile }, { data: sellerProfile }] = await Promise.all([
    admin.from("profiles").select("email").eq("id", order.buyer_id).maybeSingle(),
    admin.from("profiles").select("email").eq("id", order.seller_id).maybeSingle(),
  ]);

  await notifyOrderPaid({
    buyerId: order.buyer_id,
    buyerEmail: buyerProfile?.email ?? "",
    sellerId: order.seller_id,
    sellerEmail: sellerProfile?.email ?? "",
    orderNumber: order.order_number,
    productTitle: item?.title ?? "Item",
  });

  return { success: true };
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
