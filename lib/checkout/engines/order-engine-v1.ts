/**
 * Blood XXIV — ORDER_ENGINE (create PENDING_PAYMENT before /checkout)
 * DB status: awaiting_payment (= PENDING_PAYMENT)
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getDeliveryCarrierFromQuote, getDeliveryPrice } from "@/lib/checkout/delivery";
import { calculateOrderTotals } from "@/lib/orders/pricing";
import { calculateSellerNetAmount } from "@/lib/wallet/sales";
import { generateInvoiceNumber } from "@/lib/invoices/receipt";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";
import {
  BUY_NOW_AUTO_CANCEL_MINUTES,
  DB_PENDING_PAYMENT,
} from "@/lib/checkout/engines/status-map-v1";
import { FINANCIAL_LOGGER } from "@/lib/checkout/engines/idempotency-engine-v1";
import { LISTING_UNLOCK_ENGINE } from "@/lib/checkout/engines/listing-lock-engine-v1";

function primaryImage(
  images: Array<{ url: string; is_primary: boolean; sort_order: number }> | null | undefined,
): string {
  const sorted = [...(images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  return sorted[0]?.url ?? PRODUCT_IMAGE_FALLBACK;
}

export type OrderEngineProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  condition: string;
  seller_id: string;
  shipping_price: number | null;
  product_images: Array<{ url: string; is_primary: boolean; sort_order: number }> | null;
};

export async function ORDER_ENGINE_findOpenByIdempotency(input: {
  buyerId: string;
  productId: string;
}): Promise<{
  id: string;
  order_number: string;
  stripe_session_id: string | null;
  reserved_until: string | null;
  total: number;
  item_price: number;
  protected_fee: number;
  delivery_fee: number;
} | null> {
  const admin = createAdminClient();
  const { data: items } = await admin
    .from("order_items")
    .select("order_id")
    .eq("product_id", input.productId)
    .limit(40);
  const ids = [...new Set((items ?? []).map((row) => row.order_id as string))];
  if (ids.length === 0) return null;

  const { data: openOrder } = await admin
    .from("orders")
    .select(
      "id, order_number, stripe_session_id, reserved_until, total, item_price, protected_fee, delivery_fee",
    )
    .eq("buyer_id", input.buyerId)
    .eq("status", DB_PENDING_PAYMENT)
    .in("id", ids)
    .gt("reserved_until", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!openOrder) return null;

  return {
    id: openOrder.id,
    order_number: openOrder.order_number,
    stripe_session_id: openOrder.stripe_session_id,
    reserved_until: openOrder.reserved_until,
    total: Number(openOrder.total),
    item_price: Number(openOrder.item_price),
    protected_fee: Number(openOrder.protected_fee),
    delivery_fee: Number(openOrder.delivery_fee ?? 0),
  };
}

export async function ORDER_ENGINE_createPendingPayment(input: {
  buyerId: string;
  product: OrderEngineProduct;
  itemPrice: number;
  offerId?: string | null;
}): Promise<{ ok: true; orderId: string; orderNumber: string; total: number; reservedUntil: string } | { ok: false; reason: string }> {
  const admin = createAdminClient();
  const listingOffersFreeDelivery = input.product.shipping_price === 0;
  const deliveryPrice = getDeliveryPrice({
    listingOffersFreeDelivery,
    listingShippingPrice:
      input.product.shipping_price != null ? Number(input.product.shipping_price) : null,
  });

  if (!listingOffersFreeDelivery && deliveryPrice == null) {
    await LISTING_UNLOCK_ENGINE(input.product.id, 1);
    return { ok: false, reason: "Unable to retrieve shipping price." };
  }

  const totals = calculateOrderTotals(input.itemPrice, deliveryPrice ?? 0);
  const { platformFee, sellerAmount } = calculateSellerNetAmount(totals.itemPrice);
  const reservedUntil = new Date(
    Date.now() + BUY_NOW_AUTO_CANCEL_MINUTES * 60 * 1000,
  ).toISOString();
  const deliveryCarrier = getDeliveryCarrierFromQuote(null);
  const imageUrl = primaryImage(input.product.product_images);

  const { data: orderNumber } = await admin.rpc("generate_order_number");
  const resolvedOrderNumber = orderNumber ?? `RVX${Date.now().toString(36).toUpperCase()}`;
  const invoiceNumber = generateInvoiceNumber(resolvedOrderNumber);

  const { data: orderRow, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: resolvedOrderNumber,
      buyer_id: input.buyerId,
      seller_id: input.product.seller_id,
      status: DB_PENDING_PAYMENT,
      delivery_carrier: deliveryCarrier,
      item_price: totals.itemPrice,
      protected_fee: totals.platformFee,
      delivery_fee: totals.delivery,
      total: totals.total,
      platform_fee: platformFee,
      seller_payout: sellerAmount,
      invoice_number: invoiceNumber,
      reserved_until: reservedUntil,
      shipping_address_id: null,
    })
    .select("id, order_number")
    .single();

  if (orderError || !orderRow) {
    await LISTING_UNLOCK_ENGINE(input.product.id, 1);
    FINANCIAL_LOGGER("ORDER FAILED", orderError?.message);
    return { ok: false, reason: "Unable to create order." };
  }

  const { error: itemError } = await admin.from("order_items").insert({
    order_id: orderRow.id,
    product_id: input.product.id,
    title: input.product.title,
    slug: input.product.slug,
    price: totals.itemPrice,
    image_url: imageUrl,
    condition: input.product.condition,
    quantity: 1,
  });

  if (itemError) {
    await admin.from("orders").update({ status: "cancelled" }).eq("id", orderRow.id);
    await LISTING_UNLOCK_ENGINE(input.product.id, 1);
    FINANCIAL_LOGGER("ORDER FAILED", itemError.message);
    return { ok: false, reason: "Unable to create order." };
  }

  await admin
    .from("cart_items")
    .delete()
    .eq("user_id", input.buyerId)
    .eq("product_id", input.product.id);

  FINANCIAL_LOGGER("ORDER PASS", orderRow.id);
  return {
    ok: true,
    orderId: orderRow.id,
    orderNumber: orderRow.order_number,
    total: totals.total,
    reservedUntil,
  };
}
