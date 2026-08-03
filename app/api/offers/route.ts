import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { detectSelfOffer } from "@/lib/trust/anti-fraud";
import { isSelfPurchaseBlocked } from "@/lib/checkout/self-purchase-absolute-law-v1";
import { emitSmartNotification } from "@/lib/notifications/events";
import { transactionHubInboxHref } from "@/lib/transaction-hub/inbox-routes";
import {
  parseCounterOfferMessageMeta,
  resolveOfferFromRole,
} from "@/lib/offers/counter-offer-engine-v1";
import { createBundleOffer } from "@/lib/bundle/bundle-offer-engine-v1";
import { parseBundleMessageMeta } from "@/lib/bundle/bundle-payload-v1";

const createOfferSchema = z.object({
  productSlug: z.string().min(1),
  amount: z.number().positive(),
  message: z.string().max(500).optional(),
  conversationId: z.string().uuid().optional(),
});

const bundleOfferSchema = z.object({
  amount: z.number().positive(),
  message: z.string().max(500).optional(),
  bundle: z.object({
    bundleId: z.string().uuid().optional(),
    sellerId: z.string().uuid(),
    sellerName: z.string().max(120).optional(),
    currency: z.string().length(3).optional(),
    lines: z
      .array(
        z.object({
          productId: z.string().uuid(),
          slug: z.string().min(1),
          title: z.string().min(1),
          imageUrl: z.string(),
          unitPrice: z.number().nonnegative(),
          quantity: z.number().int().positive(),
          maxStock: z.number().int().positive(),
        }),
      )
      .min(1),
  }),
});

export async function GET(request: Request) {
  const { user } = await requireAuthContext();
  const url = new URL(request.url);
  const productSlug = url.searchParams.get("productSlug");
  const role = url.searchParams.get("role");
  const supabase = await createClient();

  if (!productSlug && (role === "buyer" || role === "seller" || role === null)) {
    const column = role === "seller" ? "seller_id" : role === "buyer" ? "buyer_id" : null;
    let query = supabase
      .from("offers")
      .select("id, amount, status, created_at, buyer_id, seller_id, message, product_id, products(title)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (column) {
      query = query.eq(column, user.id);
    } else {
      query = query.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
    }

    const { data: offers } = await query;
    return NextResponse.json({
      offers: (offers ?? []).map((offer) => {
        const product = offer.products as { title?: string } | { title?: string }[] | null;
        const productTitle = Array.isArray(product) ? product[0]?.title : product?.title;
        const meta = parseCounterOfferMessageMeta(offer.message);
        const { bundle } = parseBundleMessageMeta(offer.message);
        return {
          id: offer.id,
          amount: Number(offer.amount),
          status: offer.status,
          createdAt: offer.created_at,
          buyerId: offer.buyer_id,
          sellerId: offer.seller_id,
          message: offer.message,
          productTitle: productTitle ?? "Offer",
          fromRole: resolveOfferFromRole({
            buyerId: offer.buyer_id,
            message: offer.message,
          }),
          parentOfferId: meta.parentOfferId,
          bundle: bundle
            ? {
                bundleId: bundle.bundleId ?? null,
                itemCount: bundle.itemCount,
                quantitySum: bundle.quantitySum,
                listSubtotal: bundle.listSubtotal,
                currency: bundle.currency ?? "GBP",
                sellerId: bundle.sellerId,
                buyerId: bundle.buyerId ?? null,
                lines: bundle.lines,
              }
            : null,
        };
      }),
    });
  }

  if (!productSlug) {
    return NextResponse.json({ success: false, error: "productSlug required." }, { status: 400 });
  }

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("slug", productSlug)
    .maybeSingle();

  if (!product) {
    return NextResponse.json({ offers: [] });
  }

  const { data: offers } = await supabase
    .from("offers")
    .select("id, amount, status, created_at, buyer_id, seller_id, message")
    .eq("product_id", product.id)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    offers: (offers ?? []).map((offer) => {
      const meta = parseCounterOfferMessageMeta(offer.message);
      const { bundle } = parseBundleMessageMeta(offer.message);
      return {
        id: offer.id,
        amount: Number(offer.amount),
        status: offer.status,
        createdAt: offer.created_at,
        buyerId: offer.buyer_id,
        sellerId: offer.seller_id,
        message: offer.message,
        fromRole: resolveOfferFromRole({
          buyerId: offer.buyer_id,
          message: offer.message,
        }),
        parentOfferId: meta.parentOfferId,
        bundle: bundle
          ? {
              bundleId: bundle.bundleId ?? null,
              itemCount: bundle.itemCount,
              quantitySum: bundle.quantitySum,
              listSubtotal: bundle.listSubtotal,
              currency: bundle.currency ?? "GBP",
              sellerId: bundle.sellerId,
              buyerId: bundle.buyerId ?? null,
              lines: bundle.lines,
            }
          : null,
      };
    }),
  });
}

export async function POST(request: Request) {
  const { user } = await requireAuthContext();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const bundleParsed = bundleOfferSchema.safeParse(body);
  if (bundleParsed.success) {
    const result = await createBundleOffer({
      buyerId: user.id,
      amount: bundleParsed.data.amount,
      message: bundleParsed.data.message,
      sellerId: bundleParsed.data.bundle.sellerId,
      sellerName: bundleParsed.data.bundle.sellerName?.trim() || "Seller",
      bundleId: bundleParsed.data.bundle.bundleId,
      currency: bundleParsed.data.bundle.currency,
      lines: bundleParsed.data.bundle.lines,
    });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.httpStatus });
    }
    return NextResponse.json({
      success: true,
      offerId: result.offerId,
      conversationId: result.conversationId,
      href: result.href,
      productSlug: result.productSlug,
      bundle: true,
    });
  }

  const parsed = createOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid offer." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select(
      "id, slug, title, price, status, accept_offers, seller_id, product_images ( url, is_primary, sort_order )",
    )
    .eq("slug", parsed.data.productSlug)
    .maybeSingle();

  if (!product || product.status !== "published") {
    return NextResponse.json({ success: false, error: "Listing is not available." }, { status: 404 });
  }

  if (!product.accept_offers) {
    return NextResponse.json({ success: false, error: "This listing does not accept offers." }, { status: 400 });
  }

  if (
    isSelfPurchaseBlocked({
      currentUserId: user.id,
      listingOwnerId: product.seller_id,
    })
  ) {
    return NextResponse.json({ success: false, error: "You cannot offer on your own listing." }, { status: 403 });
  }

  const fraud = await detectSelfOffer({ buyerId: user.id, sellerId: product.seller_id });
  if (fraud.blocked) {
    return NextResponse.json({ success: false, error: "Offer not allowed." }, { status: 403 });
  }

  if (parsed.data.amount >= Number(product.price)) {
    return NextResponse.json(
      { success: false, error: "Offer must be below the listing price." },
      { status: 400 },
    );
  }

  const { data: offer, error } = await supabase
    .from("offers")
    .insert({
      product_id: product.id,
      buyer_id: user.id,
      seller_id: product.seller_id,
      amount: parsed.data.amount,
      message: parsed.data.message ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !offer) {
    return NextResponse.json({ success: false, error: "Unable to submit offer." }, { status: 500 });
  }

  const images = (
    product as {
      product_images?: Array<{ url: string; is_primary: boolean | null; sort_order: number | null }>;
    }
  ).product_images;
  const productImageUrl = [...(images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0),
  )[0]?.url;

  void emitSmartNotification({
    userId: product.seller_id,
    eventType: "new_offer",
    idempotencyKey: `offer:${offer.id}`,
    notificationType: "offer",
    title: "Offer received",
    subtitle: `Buyer offered £${parsed.data.amount.toFixed(2)}`,
    detail: product.title,
    href: transactionHubInboxHref(parsed.data.conversationId),
    avatarUrl: productImageUrl,
    avatarName: product.title,
    payload: {
      offerId: offer.id,
      productSlug: product.slug,
      conversationId: parsed.data.conversationId,
    },
  });

  return NextResponse.json({ success: true, offerId: offer.id });
}
