/**
 * Bundle Offer Engine v1.0 — create ONE offer + ONE conversation for a same-seller bundle.
 * O3: `offers` + message meta is the CANONICAL offer SSOT (bundle_offers unused).
 */

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { detectSelfOffer } from "@/lib/trust/anti-fraud";
import { isSelfPurchaseBlocked } from "@/lib/checkout/self-purchase-absolute-law-v1";
import { emitSmartNotification } from "@/lib/notifications/events";
import { findOrCreateConversation } from "@/lib/messages/conversations";
import { transactionHubInboxHref } from "@/lib/transaction-hub/inbox-routes";
import { isPurchasable } from "@/lib/inventory/service";
import {
  buildBundlePayload,
  encodeBundleMessageMeta,
  type BundlePayloadLine,
  type BundlePayloadV1,
} from "@/lib/bundle/bundle-payload-v1";
import { markBundleOfferPending, restoreBundleToActive } from "@/lib/bundle/bundle-lifecycle-v1";
import { getBundleForBuyer } from "@/lib/bundle/bundle-server-engine-v1";

export type CreateBundleOfferInput = {
  buyerId: string;
  amount: number;
  message?: string | null;
  /** Client hints — never trusted for lines/seller; server bundle is SSOT. */
  sellerId?: string;
  sellerName?: string;
  lines?: BundlePayloadLine[];
  bundleId?: string | null;
  currency?: string | null;
};

export type CreateBundleOfferResult =
  | {
      ok: true;
      offerId: string;
      conversationId: string;
      href: string;
      productSlug: string;
      bundle: BundlePayloadV1;
    }
  | { ok: false; error: string; httpStatus: number };

export async function createBundleOffer(
  input: CreateBundleOfferInput,
): Promise<CreateBundleOfferResult> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { ok: false, error: "Invalid offer amount.", httpStatus: 400 };
  }
  if (!input.bundleId) {
    return { ok: false, error: "Bundle is not ready. Refresh and try again.", httpStatus: 400 };
  }

  // Server authority — never trust client lines / sellerId.
  const serverBundle = await getBundleForBuyer(input.buyerId, ["active"], input.bundleId);
  if (!serverBundle || serverBundle.items.length === 0) {
    return { ok: false, error: "Bundle is empty or unavailable.", httpStatus: 409 };
  }

  const sellerId = serverBundle.sellerId;
  const sellerName = serverBundle.sellerName || input.sellerName?.trim() || "Seller";

  if (
    isSelfPurchaseBlocked({
      currentUserId: input.buyerId,
      listingOwnerId: sellerId,
    })
  ) {
    return { ok: false, error: "You cannot offer on your own listings.", httpStatus: 403 };
  }

  const fraud = await detectSelfOffer({ buyerId: input.buyerId, sellerId });
  if (fraud.blocked) {
    return { ok: false, error: "Offer not allowed.", httpStatus: 403 };
  }

  const admin = createAdminClient();
  const productIds = serverBundle.items.map((item) => item.productId);

  const { data: products } = await admin
    .from("products")
    .select(
      "id, slug, title, price, stock, status, seller_id, accept_offers, condition, product_images(url, is_primary, sort_order)",
    )
    .in("id", productIds);

  if (!products || products.length !== serverBundle.items.length) {
    return { ok: false, error: "One or more listings are unavailable.", httpStatus: 404 };
  }

  for (const line of serverBundle.items) {
    const product = products.find((row) => row.id === line.productId);
    if (!product || product.status !== "published") {
      return { ok: false, error: "One or more listings are unavailable.", httpStatus: 404 };
    }
    if (product.seller_id !== sellerId) {
      return { ok: false, error: "Bundle must be from one seller.", httpStatus: 400 };
    }
    if (!product.accept_offers) {
      return { ok: false, error: "A listing in this bundle does not accept offers.", httpStatus: 400 };
    }
    if (!isPurchasable(product.stock, product.status) || product.stock < line.quantity) {
      return { ok: false, error: "Insufficient stock for a bundle item.", httpStatus: 400 };
    }
  }

  const refreshedLines: BundlePayloadLine[] = serverBundle.items.map((line) => {
    const product = products.find((row) => row.id === line.productId)!;
    const images = (
      product as {
        product_images?: Array<{ url: string; is_primary: boolean | null; sort_order: number | null }>;
      }
    ).product_images;
    const imageUrl =
      [...(images ?? [])].sort(
        (a, b) => Number(b.is_primary) - Number(a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0),
      )[0]?.url ?? line.imageUrl;
    return {
      productId: product.id,
      slug: product.slug,
      title: product.title,
      imageUrl,
      unitPrice: Number(product.price),
      quantity: line.quantity,
      maxStock: Number(product.stock),
      condition: product.condition ?? "good",
    };
  });

  const refreshed = buildBundlePayload({
    sellerId,
    sellerName,
    lines: refreshedLines,
    bundleId: serverBundle.id,
    buyerId: input.buyerId,
    currency: serverBundle.currency || input.currency || "GBP",
  });
  if (!refreshed) {
    return { ok: false, error: "Invalid bundle.", httpStatus: 400 };
  }
  if (input.amount >= refreshed.listSubtotal) {
    return {
      ok: false,
      error: "Offer must be below the bundle listing total.",
      httpStatus: 400,
    };
  }

  const primary = refreshed.lines[0]!;
  const primaryProduct = products.find((row) => row.id === primary.productId)!;

  const supabase = await createClient();
  const message = encodeBundleMessageMeta(refreshed, input.message ?? null);

  const { data: offer, error } = await supabase
    .from("offers")
    .insert({
      product_id: primaryProduct.id,
      buyer_id: input.buyerId,
      seller_id: sellerId,
      amount: input.amount,
      message,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !offer) {
    return { ok: false, error: "Unable to submit bundle offer.", httpStatus: 500 };
  }

  const marked = await markBundleOfferPending({
    bundleId: refreshed.bundleId!,
    buyerId: input.buyerId,
    offerId: offer.id,
  });
  if (!marked) {
    await supabase.from("offers").update({ status: "cancelled" }).eq("id", offer.id);
    return {
      ok: false,
      error: "Bundle is no longer available for offers.",
      httpStatus: 409,
    };
  }

  const conversation = await findOrCreateConversation({
    buyerId: input.buyerId,
    productSlug: primary.slug,
  });

  if ("error" in conversation) {
    await supabase.from("offers").update({ status: "cancelled" }).eq("id", offer.id);
    await restoreBundleToActive({
      bundleId: refreshed.bundleId!,
      actorId: input.buyerId,
      fromStatuses: ["offer_pending"],
      reason: "offer_conversation_failed",
    });
    return { ok: false, error: conversation.error || "Unable to open conversation.", httpStatus: 500 };
  }

  const href = transactionHubInboxHref(conversation.conversationId);

  void emitSmartNotification({
    userId: sellerId,
    eventType: "new_offer",
    idempotencyKey: `bundle-offer:${offer.id}`,
    notificationType: "offer",
    title: "Bundle Offer received",
    subtitle: `Buyer offered £${input.amount.toFixed(2)} · ${refreshed.itemCount} items`,
    detail: `${refreshed.quantitySum} qty · Bundle`,
    href,
    avatarUrl: refreshed.lines[0]?.imageUrl,
    avatarName: "Bundle Offer",
    payload: {
      offerId: offer.id,
      productSlug: primary.slug,
      conversationId: conversation.conversationId,
      bundle: true,
      bundleId: refreshed.bundleId,
      itemCount: refreshed.itemCount,
    },
  });

  return {
    ok: true,
    offerId: offer.id,
    conversationId: conversation.conversationId,
    href,
    productSlug: primary.slug,
    bundle: refreshed,
  };
}
