/**
 * Master Checkout Architecture v1.0 — create durable Order ONLY after payment success.
 * Uses locked Checkout Session amounts. Never creates awaiting_payment orders.
 */

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  CHECKOUT_SESSION_ENGINE_getByPublicId,
  CHECKOUT_SESSION_ENGINE_markPaid,
  type CheckoutSessionRow,
} from "@/lib/checkout/engines/checkout-session-engine-v1";
import { getDeliveryCarrierFromQuote } from "@/lib/checkout/delivery";
import { generateInvoiceNumber } from "@/lib/invoices/receipt";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";
import { completePaidOrderFulfillment } from "@/lib/orders/post-payment.server";
import type { ShippingQuotePayload } from "@/lib/shipping/types";
import { calculateSellerNetAmount } from "@/lib/wallet/sales";
import {
  isBundleCheckoutSnapshot,
  type BundleCheckoutSnapshotV1,
} from "@/lib/bundle/bundle-snapshot-v1";
import { markBundlePaidAfterOrder } from "@/lib/bundle/bundle-lifecycle-v1";
import { notifyBundlePurchased } from "@/lib/bundle/bundle-notification-matrix-v1";
import {
  claimProductsForPaidSale,
  restoreProductInventoryClaim,
} from "@/lib/inventory/service";
import { CHECKOUT_RACE_CONDITION_V1 } from "@/lib/checkout/checkout-race-condition-v1";

function primaryImage(
  images: Array<{ url: string; is_primary: boolean; sort_order: number }> | null | undefined,
): string {
  const sorted = [...(images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  return sorted[0]?.url ?? PRODUCT_IMAGE_FALLBACK;
}

export async function createOrderFromPaidCheckoutSession(input: {
  checkoutSessionPublicId: string;
  shippingAddressId?: string | null;
  deliveryCarrier?: string | null;
  selectedShippingQuoteId?: string | null;
  selectedShippingQuotePayload?: ShippingQuotePayload | null;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  /** When false, only creates order + marks session paid (caller runs fulfillment). */
  fulfill?: boolean;
}): Promise<{ success: true; orderId: string } | { success: false; error: string }> {
  const shouldFulfill = input.fulfill !== false;
  const session = await CHECKOUT_SESSION_ENGINE_getByPublicId(input.checkoutSessionPublicId);
  if (!session) {
    return { success: false, error: "Checkout session not found." };
  }

  if (session.status === "paid" && session.order_id) {
    if (shouldFulfill) {
      const fulfilled = await completePaidOrderFulfillment({
        orderId: session.order_id,
        stripeSessionId: input.stripeSessionId ?? session.stripe_checkout_session_id,
        stripePaymentIntentId:
          input.stripePaymentIntentId ?? session.stripe_payment_intent_id,
        inventoryAlreadyClaimed: true,
        selectedShippingQuotePayload: input.selectedShippingQuotePayload ?? null,
      });
      if (!fulfilled.success) {
        return { success: false, error: fulfilled.error ?? "Unable to fulfill paid order." };
      }
    }
    return { success: true, orderId: session.order_id };
  }

  if (session.status !== "open" && session.status !== "paid") {
    return { success: false, error: "Checkout session is not payable." };
  }

  const admin = createAdminClient();
  const bundleSnapshot: BundleCheckoutSnapshotV1 | null = isBundleCheckoutSnapshot(
    (session as CheckoutSessionRow).bundle_lines,
  )
    ? ((session as CheckoutSessionRow).bundle_lines as BundleCheckoutSnapshotV1)
    : null;

  const { data: product } = await admin
    .from("products")
    .select(
      "id, slug, title, condition, seller_id, product_images(url, is_primary, sort_order)",
    )
    .eq("id", session.listing_id)
    .maybeSingle();

  if (!product && !bundleSnapshot) {
    return { success: false, error: "Product not found." };
  }

  const itemPrice = Number(session.item_price);
  const platformFee = Number(session.platform_fee);
  const deliveryFee = Number(session.shipping);
  const total = Number(session.total);
  const { platformFee: feeCalc, sellerAmount } = calculateSellerNetAmount(itemPrice);
  const resolvedPlatformFee = Number.isFinite(platformFee) ? platformFee : feeCalc;
  const deliveryCarrier =
    input.deliveryCarrier?.trim() || getDeliveryCarrierFromQuote(null);
  const selectedShippingQuoteId =
    input.selectedShippingQuoteId?.trim() ||
    session.selected_shipping_quote_id?.trim() ||
    null;

  const { data: orderNumber } = await admin.rpc("generate_order_number");
  const resolvedOrderNumber = orderNumber ?? `RVX${Date.now().toString(36).toUpperCase()}`;
  const invoiceNumber = generateInvoiceNumber(resolvedOrderNumber);

  // Checkout Race Condition v1.0 — claim inventory BEFORE order insert.
  // Second concurrent payer loses here → ITEM_JUST_SOLD (no order / no duplicate).
  const claimLines = bundleSnapshot
    ? bundleSnapshot.lines.map((line) => ({
        productId: line.productId,
        quantity: Math.max(1, Number(line.quantity) || 1),
      }))
    : [{ productId: product!.id, quantity: 1 }];

  const claimed = await claimProductsForPaidSale(claimLines);
  if (!claimed.ok) {
    return {
      success: false,
      error: CHECKOUT_RACE_CONDITION_V1.conflictCode,
    };
  }

  const paidAt = new Date().toISOString();
  const { data: orderRow, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: resolvedOrderNumber,
      buyer_id: session.buyer_id,
      seller_id: session.seller_id,
      // Created only after payment verification — never Buy Now awaiting_payment.
      status: "awaiting_shipment",
      paid_at: paidAt,
      delivery_carrier: deliveryCarrier,
      item_price: itemPrice,
      protected_fee: resolvedPlatformFee,
      delivery_fee: deliveryFee,
      total,
      platform_fee: resolvedPlatformFee,
      seller_payout: sellerAmount,
      invoice_number: invoiceNumber,
      reserved_until: null,
      shipping_address_id: input.shippingAddressId ?? null,
      selected_shipping_quote_id: selectedShippingQuoteId,
      shipping_setup_status: "pending",
      stripe_session_id: input.stripeSessionId ?? null,
      stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
    })
    .select("id")
    .single();

  if (orderError || !orderRow) {
    await Promise.all(
      claimLines.map((line) =>
        restoreProductInventoryClaim(line.productId, line.quantity),
      ),
    );
    return { success: false, error: "Unable to create order after payment." };
  }

  if (bundleSnapshot) {
    const orderItems = bundleSnapshot.lines.map((line) => ({
      order_id: orderRow.id,
      product_id: line.productId,
      title: line.title,
      slug: line.slug,
      price: line.unitPrice,
      image_url: line.imageUrl || PRODUCT_IMAGE_FALLBACK,
      condition: line.condition || "good",
      quantity: line.quantity,
    }));
    const { error: itemsError } = await admin.from("order_items").insert(orderItems);
    if (itemsError) {
      await admin.from("orders").delete().eq("id", orderRow.id);
      await Promise.all(
        claimLines.map((line) =>
          restoreProductInventoryClaim(line.productId, line.quantity),
        ),
      );
      return { success: false, error: "Unable to create bundle order items." };
    }

    await admin
      .from("cart_items")
      .delete()
      .eq("user_id", session.buyer_id)
      .in(
        "product_id",
        bundleSnapshot.lines.map((line) => line.productId),
      );

    await markBundlePaidAfterOrder({
      bundleId: bundleSnapshot.bundleId,
      orderId: orderRow.id,
    });
  } else {
    const imageUrl = primaryImage(product!.product_images);
    await admin.from("order_items").insert({
      order_id: orderRow.id,
      product_id: product!.id,
      title: product!.title,
      slug: product!.slug,
      price: itemPrice,
      image_url: imageUrl,
      condition: product!.condition,
      quantity: 1,
    });

    await admin
      .from("cart_items")
      .delete()
      .eq("user_id", session.buyer_id)
      .eq("product_id", product!.id);
  }

  if (shouldFulfill) {
    await CHECKOUT_SESSION_ENGINE_markPaid({
      sessionId: session.id,
      orderId: orderRow.id,
      stripeSessionId: input.stripeSessionId,
      stripePaymentIntentId: input.stripePaymentIntentId,
    });

    const fulfilled = await completePaidOrderFulfillment({
      orderId: orderRow.id,
      stripeSessionId: input.stripeSessionId ?? null,
      stripePaymentIntentId: input.stripePaymentIntentId ?? null,
      inventoryAlreadyClaimed: true,
      selectedShippingQuotePayload: input.selectedShippingQuotePayload ?? null,
    });

    if (!fulfilled.success) {
      return { success: false, error: fulfilled.error ?? "Unable to fulfill paid order." };
    }
  } else {
    // Order created; session stays open until caller marks paid after money moves.
    await admin
      .from("checkout_sessions")
      .update({
        order_id: orderRow.id,
        stripe_checkout_session_id: input.stripeSessionId ?? null,
        stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id)
      .eq("status", "open");
  }

  if (bundleSnapshot) {
    void notifyBundlePurchased({
      buyerId: session.buyer_id,
      sellerId: session.seller_id,
      snapshot: bundleSnapshot,
      orderId: orderRow.id,
      href: `/orders/${orderRow.id}`,
    });
  }

  return { success: true, orderId: orderRow.id };
}

/** Idempotent lookup: paid session → order id. */
export async function resolveOrderIdFromCheckoutSession(
  publicId: string,
): Promise<string | null> {
  const session = await CHECKOUT_SESSION_ENGINE_getByPublicId(publicId);
  if (!session || session.status !== "paid" || !session.order_id) return null;
  return session.order_id;
}

export type { CheckoutSessionRow };
