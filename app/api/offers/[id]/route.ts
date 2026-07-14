import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { emitSmartNotification } from "@/lib/notifications/events";
import { transactionHubInboxHref } from "@/lib/transaction-hub/inbox-routes";

const patchSchema = z.object({
  action: z.enum(["accept", "decline", "counter"]),
  amount: z.number().positive().optional(),
  message: z.string().max(500).optional(),
  conversationId: z.string().uuid().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { user } = await requireAuthContext();
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid offer action." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: offer } = await supabase
    .from("offers")
    .select("id, product_id, buyer_id, seller_id, amount, status, message")
    .eq("id", id)
    .maybeSingle();

  if (!offer) {
    return NextResponse.json({ success: false, error: "Offer not found." }, { status: 404 });
  }

  if (offer.status !== "pending") {
    return NextResponse.json({ success: false, error: "Offer is no longer open." }, { status: 400 });
  }

  const href = transactionHubInboxHref(parsed.data.conversationId);

  if (parsed.data.action === "accept") {
    if (offer.seller_id !== user.id) {
      return NextResponse.json({ success: false, error: "Only the seller can accept." }, { status: 403 });
    }
    const { error } = await supabase.from("offers").update({ status: "accepted" }).eq("id", id);
    if (error) {
      return NextResponse.json({ success: false, error: "Unable to accept offer." }, { status: 500 });
    }

    const { data: product } = await supabase
      .from("products")
      .select("slug")
      .eq("id", offer.product_id)
      .maybeSingle();

    const checkoutHref = product?.slug
      ? `/checkout/${encodeURIComponent(product.slug)}?offerId=${encodeURIComponent(id)}`
      : href;

    void emitSmartNotification({
      userId: offer.buyer_id,
      eventType: "offer_accepted",
      idempotencyKey: `offer-accept:${id}`,
      notificationType: "offer",
      title: "Offer accepted",
      subtitle: "Your offer was accepted. Complete checkout to buy.",
      href: checkoutHref,
      payload: {
        offerId: id,
        productId: offer.product_id,
        productSlug: product?.slug,
        acceptedOfferPrice: Number(offer.amount),
      },
    });
    return NextResponse.json({
      success: true,
      status: "accepted",
      acceptedOfferPrice: Number(offer.amount),
      offerId: id,
    });
  }

  if (parsed.data.action === "decline") {
    if (offer.seller_id !== user.id && offer.buyer_id !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
    }
    const { error } = await supabase.from("offers").update({ status: "rejected" }).eq("id", id);
    if (error) {
      return NextResponse.json({ success: false, error: "Unable to decline offer." }, { status: 500 });
    }
    const notifyUser = offer.seller_id === user.id ? offer.buyer_id : offer.seller_id;
    void emitSmartNotification({
      userId: notifyUser,
      eventType: "new_offer",
      idempotencyKey: `offer-decline:${id}:${user.id}`,
      notificationType: "offer",
      title: "Offer declined",
      subtitle: "An offer was declined.",
      href,
      payload: { offerId: id },
    });
    return NextResponse.json({ success: true, status: "rejected" });
  }

  if (!parsed.data.amount) {
    return NextResponse.json({ success: false, error: "Counter amount required." }, { status: 400 });
  }

  const isSeller = offer.seller_id === user.id;
  const isBuyer = offer.buyer_id === user.id;
  if (!isSeller && !isBuyer) {
    return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  await supabase.from("offers").update({ status: "cancelled" }).eq("id", id);

  const { data: counter, error: counterError } = await supabase
    .from("offers")
    .insert({
      product_id: offer.product_id,
      buyer_id: offer.buyer_id,
      seller_id: offer.seller_id,
      amount: parsed.data.amount,
      message: parsed.data.message ?? null,
      status: "pending",
    })
    .select("id, amount, status, created_at")
    .single();

  if (counterError || !counter) {
    return NextResponse.json({ success: false, error: "Unable to counter offer." }, { status: 500 });
  }

  const notifyUser = isSeller ? offer.buyer_id : offer.seller_id;
  void emitSmartNotification({
    userId: notifyUser,
    eventType: "new_offer",
    idempotencyKey: `offer-counter:${counter.id}`,
    notificationType: "offer",
    title: "Counter offer",
    subtitle: "A counter offer was sent.",
    href,
    payload: { offerId: counter.id },
  });

  return NextResponse.json({
    success: true,
    status: "countered",
    offer: {
      id: counter.id,
      amount: Number(counter.amount),
      status: counter.status,
      createdAt: counter.created_at,
    },
  });
}
