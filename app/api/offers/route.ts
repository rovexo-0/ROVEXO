import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { detectSelfOffer } from "@/lib/trust/anti-fraud";
import { emitSmartNotification } from "@/lib/notifications/events";
import { transactionHubInboxHref } from "@/lib/transaction-hub/inbox-routes";

const createOfferSchema = z.object({
  productSlug: z.string().min(1),
  amount: z.number().positive(),
  message: z.string().max(500).optional(),
  conversationId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const { user } = await requireAuthContext();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = createOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid offer." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, slug, title, price, status, accept_offers, seller_id")
    .eq("slug", parsed.data.productSlug)
    .maybeSingle();

  if (!product || product.status !== "published") {
    return NextResponse.json({ success: false, error: "Listing is not available." }, { status: 404 });
  }

  if (!product.accept_offers) {
    return NextResponse.json({ success: false, error: "This listing does not accept offers." }, { status: 400 });
  }

  if (product.seller_id === user.id) {
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

  void emitSmartNotification({
    userId: product.seller_id,
    eventType: "new_offer",
    idempotencyKey: `offer:${offer.id}`,
    notificationType: "offer",
    title: "New offer received",
    subtitle: `You received an offer on ${product.title}.`,
    href: transactionHubInboxHref(parsed.data.conversationId),
    payload: {
      offerId: offer.id,
      productSlug: product.slug,
      conversationId: parsed.data.conversationId,
    },
  });

  return NextResponse.json({ success: true, offerId: offer.id });
}
