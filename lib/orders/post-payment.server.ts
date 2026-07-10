import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { CHECKOUT_CARRIERS } from "@/lib/checkout/delivery";
import { openEscrowForOrder } from "@/lib/commerce-engine";
import { buildOrderReceiptUrl } from "@/lib/invoices/receipt";
import { notifyOrderPaid } from "@/lib/orders/notifications";
import { calculateSellerNetAmount } from "@/lib/wallet/sales";
import { createShippingAdminClient } from "@/lib/shipping/db-client";
import { ShippingService } from "@/lib/shipping/engine";
import { fetchShippingQuotesServer } from "@/lib/shipping/pricing/service.server";
import {
  createShipmentParcel,
  listShipmentParcelsForOrder,
} from "@/lib/shipping/parcels-repository";
import {
  ensureShippingRecord,
  getShippingRecord,
  saveShippingQuotes,
} from "@/lib/shipping/store";
import type { UkCarrier } from "@/lib/shipping/carriers";
import type { ShippingAddress, ShippingQuote } from "@/lib/shipping/types";

const PAID_ORDER_STATUSES = new Set([
  "awaiting_shipment",
  "shipped",
  "delivered",
  "completed",
  "issue_open",
]);

type OrderItemRow = {
  product_id: string | null;
  title: string;
  image_url: string;
  quantity: number;
  slug: string;
};

type PaidOrderRow = {
  id: string;
  order_number: string;
  status: string;
  buyer_id: string;
  seller_id: string;
  item_price: number;
  delivery_fee: number | null;
  delivery_carrier: string;
  shipping_address_id: string | null;
  order_items: OrderItemRow[];
};

function inferCity(addressLine: string, postcode: string): string {
  const segments = addressLine.split(",").map((part) => part.trim()).filter(Boolean);
  if (segments.length > 1) return segments[segments.length - 1];
  return postcode.trim().split(/\s+/)[0] || "United Kingdom";
}

async function resolveDeliveryAddress(
  shippingAddressId: string | null,
): Promise<ShippingAddress | null> {
  if (!shippingAddressId) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("shipping_addresses")
    .select("recipient_name, address_line, address_line_2, city, postcode, country")
    .eq("id", shippingAddressId)
    .maybeSingle();

  if (!data?.address_line || !data.postcode) return null;

  return {
    role: "delivery",
    fullName: data.recipient_name?.trim() || "Buyer",
    line1: data.address_line,
    line2: data.address_line_2 ?? undefined,
    city: data.city?.trim() || inferCity(data.address_line, data.postcode),
    postcode: data.postcode,
    country: data.country?.trim() || "United Kingdom",
    validated: true,
  };
}

async function resolveCollectionAddress(
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

  if (!row?.address_line || !row.postcode) return null;

  return {
    role: "collection",
    fullName: row.recipient_name?.trim() || sellerName,
    line1: row.address_line,
    line2: row.address_line_2 ?? undefined,
    city: row.city?.trim() || inferCity(row.address_line, row.postcode),
    postcode: row.postcode,
    country: row.country?.trim() || "United Kingdom",
    validated: true,
  };
}

async function sellerHasSaleTransaction(orderNumber: string, sellerId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("wallet_transactions")
    .select("id")
    .eq("user_id", sellerId)
    .eq("order_number", orderNumber)
    .eq("type", "sale")
    .maybeSingle();

  return Boolean(data?.id);
}

function pickSelectedQuoteId(
  quotes: ShippingQuote[],
  carrier: string,
  deliveryFee: number,
): string | null {
  if (quotes.length === 0) return null;

  const carrierQuotes = quotes.filter((quote) => String(quote.carrier) === carrier);
  const pool = carrierQuotes.length > 0 ? carrierQuotes : quotes;
  const targetPence = Math.round(Math.max(0, deliveryFee) * 100);

  const exact = pool.find((quote) => quote.pricePence === targetPence);
  if (exact) return exact.id;

  const supported = pool.find((quote) =>
    CHECKOUT_CARRIERS.includes(String(quote.carrier) as UkCarrier),
  );
  return (supported ?? pool[0])?.id ?? null;
}

async function ensureOrderShippingPipeline(order: PaidOrderRow): Promise<void> {
  const record = await ensureShippingRecord({ orderId: order.id });
  if (!record) {
    throw new Error(`Failed to create shipping record for order ${order.id}.`);
  }

  const admin = createAdminClient();
  const [{ data: sellerProfile }, deliveryAddress] = await Promise.all([
    admin.from("profiles").select("full_name").eq("id", order.seller_id).maybeSingle(),
    resolveDeliveryAddress(order.shipping_address_id),
  ]);

  const collectionAddress = await resolveCollectionAddress(
    order.seller_id,
    sellerProfile?.full_name?.trim() || "Seller",
  );

  if (collectionAddress && deliveryAddress) {
    const shippingAdmin = createShippingAdminClient();
    await shippingAdmin
      .from("shipping_records")
      .update({
        collection_address: collectionAddress,
        delivery_address: deliveryAddress,
      })
      .eq("order_id", order.id);
  }

  const refreshed = await getShippingRecord(order.id);
  const hasQuotes = (refreshed?.pricing?.quotes.length ?? 0) > 0;

  if (!hasQuotes && collectionAddress && deliveryAddress) {
    const collectionValidated = ShippingService.validateAddress(collectionAddress);
    const deliveryValidated = ShippingService.validateAddress(deliveryAddress);

    if (collectionValidated.valid && deliveryValidated.valid) {
      const pricing = await fetchShippingQuotesServer({
        parcelTier: refreshed?.parcelTier ?? "small_parcel",
        collectionAddress: collectionValidated.normalized,
        deliveryAddress: deliveryValidated.normalized,
        preferredCarriers: CHECKOUT_CARRIERS,
      });

      if (pricing.quotes.length > 0) {
        pricing.selectedQuoteId =
          pickSelectedQuoteId(
            pricing.quotes,
            order.delivery_carrier,
            Number(order.delivery_fee ?? 0),
          ) ?? pricing.selectedQuoteId;
        await saveShippingQuotes({ orderId: order.id, pricing });
      }
    }
  }

  const parcels = await listShipmentParcelsForOrder(order.id);
  if (parcels.length === 0) {
    const parcel = await createShipmentParcel({
      orderId: order.id,
      carrier: order.delivery_carrier,
      productItemIds: order.order_items
        .map((item) => item.product_id)
        .filter((id): id is string => Boolean(id)),
    });
    if (!parcel) {
      throw new Error(`Failed to create shipment parcel for order ${order.id}.`);
    }
  }
}

/**
 * Idempotent post-payment pipeline for marketplace orders.
 * Safe to call from Stripe webhooks, checkout confirmation, and retries.
 */
export async function completePaidOrderFulfillment(input: {
  orderId: string;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    return await runCompletePaidOrderFulfillment(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[orders/post-payment] fulfillment failed:", message);
    return { success: false, error: message };
  }
}

async function runCompletePaidOrderFulfillment(input: {
  orderId: string;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
}): Promise<{ success: boolean; error?: string }> {
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
      delivery_fee,
      delivery_carrier,
      shipping_address_id,
      order_items ( product_id, title, image_url, quantity, slug )
    `,
    )
    .eq("id", input.orderId)
    .maybeSingle();

  if (!order) {
    return { success: false, error: "Order not found." };
  }

  const row = order as PaidOrderRow;
  const awaitingPayment = row.status === "awaiting_payment";
  const alreadyPaid = PAID_ORDER_STATUSES.has(row.status);

  if (!awaitingPayment && !alreadyPaid) {
    return { success: false, error: "Order cannot be fulfilled." };
  }

  if (awaitingPayment) {
    const now = new Date().toISOString();
    await admin
      .from("orders")
      .update({
        status: "awaiting_shipment",
        paid_at: now,
        stripe_session_id: input.stripeSessionId ?? null,
        stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
        reserved_until: null,
        receipt_url: buildOrderReceiptUrl(input.orderId),
      })
      .eq("id", input.orderId)
      .eq("status", "awaiting_payment");
  }

  const item = row.order_items?.[0];
  if (!item) {
    return { success: false, error: "Order item missing." };
  }

  const { platformFee, sellerAmount } = calculateSellerNetAmount(Number(row.item_price));
  await admin
    .from("orders")
    .update({
      platform_fee: platformFee,
      seller_payout: sellerAmount,
    })
    .eq("id", input.orderId);

  await openEscrowForOrder({
    orderId: input.orderId,
    orderNumber: row.order_number,
    sellerId: row.seller_id,
    buyerId: row.buyer_id,
    productTitle: item.title,
    productImageUrl: item.image_url,
    itemPrice: Number(row.item_price),
    deliveryFee: Number(row.delivery_fee ?? 0),
    stripePaymentIntentId: input.stripePaymentIntentId ?? null,
    correlationId: input.stripeSessionId ?? null,
  });

  if (!(await sellerHasSaleTransaction(row.order_number, row.seller_id))) {
    throw new Error("Failed to open seller escrow — pending wallet sale was not recorded.");
  }

  await ensureOrderShippingPipeline(row);

  const [{ data: buyerProfile }, { data: sellerProfile }] = await Promise.all([
    admin.from("profiles").select("email").eq("id", row.buyer_id).maybeSingle(),
    admin.from("profiles").select("email").eq("id", row.seller_id).maybeSingle(),
  ]);

  await notifyOrderPaid({
    buyerId: row.buyer_id,
    buyerEmail: buyerProfile?.email ?? "",
    sellerId: row.seller_id,
    sellerEmail: sellerProfile?.email ?? "",
    orderNumber: row.order_number,
    productTitle: item.title,
  });

  return { success: true };
}
