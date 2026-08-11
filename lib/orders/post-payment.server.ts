import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { CHECKOUT_CARRIERS } from "@/lib/checkout/delivery";
import { openEscrowForOrder } from "@/lib/commerce-engine";
import { mustUseDemoShipping } from "@/lib/full-demo/security";
import { buildOrderReceiptUrl } from "@/lib/invoices/receipt";
import { notifyOrderPaid } from "@/lib/orders/notifications";
import { ensureOrderConversation } from "@/lib/orders/ensure-order-conversation";
import { calculateSellerNetAmount } from "@/lib/wallet/sales";
import { createShippingAdminClient } from "@/lib/shipping/db-client";
import { ShippingService } from "@/lib/shipping/engine";
import { fetchShippingQuotesServer } from "@/lib/shipping/pricing/service.server";
import { isSendcloudQuoteId, parseSendcloudQuoteId } from "@/lib/shipping/pricing/sendcloud-mappers";
import {
  createShipmentParcel,
  listShipmentParcelsForOrder,
} from "@/lib/shipping/parcels-repository";
import {
  ensureShippingRecord,
  getShippingRecord,
  saveShippingQuotes,
} from "@/lib/shipping/store";
import { generateShippingLabelForOrder } from "@/lib/shipping/label-generation.server";
import { isSendcloudConfigured } from "@/lib/shipping/env";
import type { UkCarrier } from "@/lib/shipping/carriers";
import type { ShippingAddress, ShippingPricing, ShippingQuote } from "@/lib/shipping/types";
import { markProductSold } from "@/lib/inventory/service";
import {
  isShippingSetupReady,
  type ShippingSetupStatus,
} from "@/lib/shipping/shipping-setup-status-v1";
import { resolveListingParcelTier } from "@/lib/shipping/parcels";

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

export type PaidOrderShippingRow = {
  id: string;
  order_number: string;
  status: string;
  buyer_id: string;
  seller_id: string;
  item_price: number;
  delivery_fee: number | null;
  delivery_carrier: string;
  shipping_address_id: string | null;
  selected_shipping_quote_id?: string | null;
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
  preferredQuoteId?: string | null,
): string | null {
  if (preferredQuoteId) {
    const exactId = quotes.find((quote) => quote.id === preferredQuoteId);
    if (exactId) return exactId.id;
  }

  if (quotes.length === 0) return preferredQuoteId ?? null;

  const carrierQuotes = quotes.filter((quote) => String(quote.carrier) === carrier);
  const pool = carrierQuotes.length > 0 ? carrierQuotes : quotes;
  const targetPence = Math.round(Math.max(0, deliveryFee) * 100);

  const exact = pool.find((quote) => quote.pricePence === targetPence);
  if (exact) return exact.id;

  const supported = pool.find((quote) =>
    CHECKOUT_CARRIERS.includes(String(quote.carrier) as UkCarrier),
  );
  return (supported ?? pool[0])?.id ?? preferredQuoteId ?? null;
}

function buildPersistedCheckoutQuote(order: PaidOrderShippingRow): ShippingQuote | null {
  const quoteId = order.selected_shipping_quote_id?.trim() || null;
  if (!quoteId) return null;

  const v2MethodId = isSendcloudQuoteId(quoteId) ? parseSendcloudQuoteId(quoteId) : null;

  return {
    id: quoteId,
    providerId: isSendcloudQuoteId(quoteId) ? "sendcloud" : "checkout",
    carrier: order.delivery_carrier || "Royal Mail",
    serviceName: order.delivery_carrier || "Selected delivery",
    pricePence: Math.round(Math.max(0, Number(order.delivery_fee ?? 0)) * 100),
    currency: "GBP",
    estimatedDays: { min: 1, max: 5 },
    // Legacy bridge only — never invent shippingOptionCode for sendcloud:N.
    ...(v2MethodId != null ? { v2MethodId, quoteApiVersion: "v2" as const } : {}),
  };
}

export async function markOrderShippingSetupStatus(
  orderId: string,
  status: ShippingSetupStatus,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({ shipping_setup_status: status })
    .eq("id", orderId);
  if (error) {
    console.error("[orders/post-payment] shipping_setup_status update failed", {
      orderId,
      failureStage: "orders.shipping_setup_status",
      code: error.code,
      message: error.message,
      status,
    });
  }
}

async function resolveOrderParcelSize(order: PaidOrderShippingRow): Promise<string | null> {
  const productId = order.order_items?.[0]?.product_id;
  if (!productId) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("products")
    .select("parcel_size")
    .eq("id", productId)
    .maybeSingle();
  return (data as { parcel_size?: string | null } | null)?.parcel_size ?? null;
}

/**
 * Durable post-payment shipping persistence (internal only).
 * Creates shipping_records + selected quote association + addresses + internal parcel.
 * Never creates a Sendcloud parcel / label.
 */
export async function ensureOrderShippingPersistence(
  order: PaidOrderShippingRow,
  options?: { allowLiveQuoteEnrichment?: boolean },
): Promise<{ recordId: string; selectedQuoteId: string | null }> {
  const allowLiveQuoteEnrichment = options?.allowLiveQuoteEnrichment !== false;
  const preferredQuoteId = order.selected_shipping_quote_id?.trim() || null;
  const parcelSize = await resolveOrderParcelSize(order);
  const parcelTier = resolveListingParcelTier(parcelSize, "small_parcel");

  const record = await ensureShippingRecord({
    orderId: order.id,
    orderNumber: order.order_number,
    legacyParcelSize: null,
    manualTier: parcelTier,
    carrier: order.delivery_carrier || null,
    selectedQuoteId: preferredQuoteId,
  });
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

  if (collectionAddress || deliveryAddress || order.delivery_carrier) {
    const shippingAdmin = createShippingAdminClient();
    await shippingAdmin
      .from("shipping_records")
      .update({
        ...(collectionAddress ? { collection_address: collectionAddress } : {}),
        ...(deliveryAddress ? { delivery_address: deliveryAddress } : {}),
        ...(order.delivery_carrier ? { carrier: order.delivery_carrier } : {}),
        ...(preferredQuoteId ? { selected_quote_id: preferredQuoteId } : {}),
      })
      .eq("order_id", order.id);
  }

  let refreshed = await getShippingRecord(order.id);
  const hasQuotes = (refreshed?.pricing?.quotes.length ?? 0) > 0;
  const hasSelected =
    Boolean(refreshed?.pricing?.selectedQuoteId) || Boolean(preferredQuoteId);

  // Always persist the exact checkout-selected method identity when present.
  // Never reconstruct method id from carrier name / price alone.
  const checkoutQuote = buildPersistedCheckoutQuote(order);
  if (checkoutQuote && (!hasQuotes || refreshed?.pricing?.selectedQuoteId !== checkoutQuote.id)) {
    if (allowLiveQuoteEnrichment && collectionAddress && deliveryAddress) {
      const collectionValidated = ShippingService.validateAddress(collectionAddress);
      const deliveryValidated = ShippingService.validateAddress(deliveryAddress);
      if (collectionValidated.valid && deliveryValidated.valid) {
        try {
          const pricing = await fetchShippingQuotesServer({
            parcelTier: refreshed?.parcelTier ?? parcelTier,
            collectionAddress: collectionValidated.normalized,
            deliveryAddress: deliveryValidated.normalized,
            preferredCarriers: CHECKOUT_CARRIERS,
          });
          if (pricing.quotes.length > 0) {
            const selected =
              pickSelectedQuoteId(
                pricing.quotes,
                order.delivery_carrier,
                Number(order.delivery_fee ?? 0),
                preferredQuoteId,
              ) ?? checkoutQuote.id;
            const quotes = pricing.quotes.some((q) => q.id === selected)
              ? pricing.quotes
              : [...pricing.quotes, checkoutQuote];
            const merged: ShippingPricing = {
              quotes,
              selectedQuoteId: selected,
              currency: "GBP",
              providerAvailable: pricing.providerAvailable,
            };
            await saveShippingQuotes({ orderId: order.id, pricing: merged });
            refreshed = await getShippingRecord(order.id);
          }
        } catch (error) {
          console.warn("[orders/post-payment] live quote enrichment skipped", {
            orderId: order.id,
            orderNumber: order.order_number,
            failureStage: "live_quote_enrichment",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    refreshed = await getShippingRecord(order.id);
    if ((refreshed?.pricing?.quotes.length ?? 0) === 0 || refreshed?.pricing?.selectedQuoteId !== checkoutQuote.id) {
      const pricing: ShippingPricing = {
        quotes: [checkoutQuote],
        selectedQuoteId: checkoutQuote.id,
        currency: "GBP",
        providerAvailable: true,
      };
      await saveShippingQuotes({ orderId: order.id, pricing });
      refreshed = await getShippingRecord(order.id);
    }
  } else if (!hasQuotes && allowLiveQuoteEnrichment && collectionAddress && deliveryAddress) {
    // Legacy orders without selected_shipping_quote_id — best-effort live quotes.
    const collectionValidated = ShippingService.validateAddress(collectionAddress);
    const deliveryValidated = ShippingService.validateAddress(deliveryAddress);

    if (collectionValidated.valid && deliveryValidated.valid) {
      const pricing = await fetchShippingQuotesServer({
        parcelTier: refreshed?.parcelTier ?? parcelTier,
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
            preferredQuoteId,
          ) ?? pricing.selectedQuoteId;
        await saveShippingQuotes({ orderId: order.id, pricing });
      }
    }
  }

  // Full Demo / Sendcloud sandbox: materialize demo quotes when still empty.
  const afterAddressQuotes = await getShippingRecord(order.id);
  if ((afterAddressQuotes?.pricing?.quotes.length ?? 0) === 0 && mustUseDemoShipping()) {
    const demoCollection: ShippingAddress = collectionAddress ?? {
      role: "collection",
      fullName: "ROVEXO Demo Seller",
      line1: "1 Demo Street",
      city: "London",
      postcode: "E1 6AN",
      country: "GB",
      validated: true,
    };
    const demoDelivery: ShippingAddress = deliveryAddress ?? {
      role: "delivery",
      fullName: "ROVEXO Demo Buyer",
      line1: "2 Demo Road",
      city: "Manchester",
      postcode: "M1 1AE",
      country: "GB",
      validated: true,
    };
    const demoPricing = await fetchShippingQuotesServer({
      parcelTier: afterAddressQuotes?.parcelTier ?? refreshed?.parcelTier ?? parcelTier,
      collectionAddress: demoCollection,
      deliveryAddress: demoDelivery,
      preferredCarriers: CHECKOUT_CARRIERS,
    });
    if (demoPricing.quotes.length > 0) {
      demoPricing.selectedQuoteId =
        pickSelectedQuoteId(
          demoPricing.quotes,
          order.delivery_carrier,
          Number(order.delivery_fee ?? 0),
          preferredQuoteId,
        ) ?? demoPricing.selectedQuoteId;
      await saveShippingQuotes({ orderId: order.id, pricing: demoPricing });
    }
  }

  // Internal shipment parcel row only — never a Sendcloud parcel.
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

  const finalRecord = await getShippingRecord(order.id);
  if (!finalRecord) {
    throw new Error(`Failed to create shipping record for order ${order.id}.`);
  }

  void hasSelected;
  return {
    recordId: finalRecord.id,
    selectedQuoteId:
      finalRecord.pricing?.selectedQuoteId ?? preferredQuoteId ?? null,
  };
}

/** @deprecated Prefer ensureOrderShippingPersistence — kept for call-site clarity. */
async function ensureOrderShippingPipeline(order: PaidOrderShippingRow): Promise<void> {
  await ensureOrderShippingPersistence(order, { allowLiveQuoteEnrichment: true });
}

/**
 * Idempotent post-payment pipeline for marketplace orders.
 * Safe to call from Stripe webhooks, checkout confirmation, and retries.
 *
 * Payment success semantics are preserved even when shipping persistence fails:
 * order stays paid / awaiting_shipment, buyer is not re-charged, and
 * shipping_setup_status becomes repair_required for observable repair.
 */
export async function completePaidOrderFulfillment(input: {
  orderId: string;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  /** When true, inventory was claimed in createOrderFromPaidCheckoutSession. */
  inventoryAlreadyClaimed?: boolean;
}): Promise<{
  success: boolean;
  error?: string;
  conversationId?: string;
  shippingSetupStatus?: ShippingSetupStatus;
}> {
  try {
    return await runCompletePaidOrderFulfillment(input);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error && "message" in error
          ? String((error as { message: unknown }).message)
          : String(error);
    console.error("[orders/post-payment] fulfillment failed:", message);
    return { success: false, error: message };
  }
}

async function runCompletePaidOrderFulfillment(input: {
  orderId: string;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  inventoryAlreadyClaimed?: boolean;
}): Promise<{
  success: boolean;
  error?: string;
  conversationId?: string;
  shippingSetupStatus?: ShippingSetupStatus;
}> {
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
      selected_shipping_quote_id,
      shipping_setup_status,
      order_items ( product_id, title, image_url, quantity, slug )
    `,
    )
    .eq("id", input.orderId)
    .maybeSingle();

  if (!order) {
    return { success: false, error: "Order not found." };
  }

  const row = order as PaidOrderShippingRow & { shipping_setup_status?: string | null };
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

  let shippingSetupStatus: ShippingSetupStatus =
    (row.shipping_setup_status as ShippingSetupStatus | undefined) ?? "pending";

  try {
    await ensureOrderShippingPipeline(row);
    await markOrderShippingSetupStatus(input.orderId, "ready");
    shippingSetupStatus = "ready";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await markOrderShippingSetupStatus(input.orderId, "repair_required");
    shippingSetupStatus = "repair_required";
    console.error("[orders/post-payment] shipping persistence failed", {
      orderId: input.orderId,
      orderNumber: row.order_number,
      failureStage: "ensureOrderShippingPersistence",
      message,
    });
    // Fail-closed for shipping, but do not unwind payment / escrow / order.
  }

  // Inventory claim: createOrderFromPaidCheckoutSession claims first (race winner).
  // Legacy awaiting_payment orders still claim here.
  if (!input.inventoryAlreadyClaimed) {
    const soldLines = (row.order_items ?? []).filter((line) => line.product_id);
    if (soldLines.length === 0) {
      return { success: false, error: "Order item missing.", shippingSetupStatus };
    }
    for (const line of soldLines) {
      const qty = Math.max(1, Number(line.quantity) || 1);
      const sold = await markProductSold(line.product_id!, qty);
      if (!sold.success) {
        console.error("[orders/post-payment] mark_product_sold failed:", sold.error);
        throw new Error(sold.error ?? "Failed to mark listing sold after payment.");
      }
    }
  }

  const itemRow = item;
  const conversation = await ensureOrderConversation({
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    productId: itemRow.product_id ?? "",
    productSlug: itemRow.slug,
    orderNumber: row.order_number,
  });
  if ("error" in conversation) {
    console.warn("[orders/post-payment] conversation:", conversation.error);
  }

  if (isSendcloudConfigured() && isShippingSetupReady(shippingSetupStatus)) {
    try {
      await generateShippingLabelForOrder(input.orderId, row.seller_id);
    } catch (error) {
      console.warn(
        "[orders/post-payment] Sendcloud label deferred:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  const [{ data: buyerProfile }, { data: sellerProfile }] = await Promise.all([
    admin.from("profiles").select("email").eq("id", row.buyer_id).maybeSingle(),
    admin.from("profiles").select("email").eq("id", row.seller_id).maybeSingle(),
  ]);

  await notifyOrderPaid({
    buyerId: row.buyer_id,
    buyerEmail: buyerProfile?.email ?? "",
    sellerId: row.seller_id,
    sellerEmail: sellerProfile?.email ?? "",
    orderId: input.orderId,
    orderNumber: row.order_number,
    productTitle: item.title,
    productImageUrl: item.image_url ?? undefined,
    itemPrice: Number(row.item_price),
  });

  return {
    success: true,
    conversationId: "conversationId" in conversation ? conversation.conversationId : undefined,
    shippingSetupStatus,
  };
}
