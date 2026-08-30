import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCookieOrBearerApiAuth } from "@/lib/auth/require-cookie-or-bearer-api-auth-v1";
import { validateMutationOrigin } from "@/lib/api/csrf-guard";
import { enforceRateLimitForUser } from "@/lib/api/rate-limit";
import { emitSmartNotification } from "@/lib/notifications/events";
import { transactionHubInboxHref } from "@/lib/transaction-hub/inbox-routes";
import {
  executeCounterOffer,
  mapOfferStatusToCounterError,
  resolveOfferFromRole,
  COUNTER_OFFER_ENGINE_V1,
  COUNTER_OFFER_ERROR_COPY,
} from "@/lib/offers/counter-offer-engine-v1";
import { parseBundleMessageMeta } from "@/lib/bundle/bundle-payload-v1";
import { BUNDLE_BUY_NOW_ENGINE } from "@/lib/bundle/bundle-buy-now-engine-v1";
import {
  restoreBundleToActive,
} from "@/lib/bundle/bundle-lifecycle-v1";
import { appendBundleEvent } from "@/lib/bundle/bundle-events-v1";
import { expireStaleBundleOffers } from "@/lib/bundle/bundle-lifecycle-v1";

const patchSchema = z.object({
  action: z.enum(["accept", "decline", "counter", "cancel"]),
  amount: z.number().positive().optional(),
  message: z.string().max(500).optional(),
  conversationId: z.string().uuid().optional(),
  /** Optional optimistic lock — must match current DB status when provided. */
  expectedStatus: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  void COUNTER_OFFER_ENGINE_V1.bloodLaw;
  const csrf = await validateMutationOrigin(request);
  if (csrf) return csrf;

  // Same cookie + Native Bearer auth as POST /api/offers (cookie-only session auth is insufficient for Native).
  const auth = await requireCookieOrBearerApiAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { user, supabase } = auth;
  const limited = await enforceRateLimitForUser(user.id, "offers-mutate", 60, 60_000);
  if (limited) return limited;
  const { id } = await context.params;
  void expireStaleBundleOffers().catch(() => undefined);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request.", code: "INVALID_REQUEST" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid offer action.", code: "INVALID_OFFER_ACTION" },
      { status: 400 },
    );
  }

  const { data: offer } = await supabase
    .from("offers")
    .select("id, product_id, buyer_id, seller_id, amount, status, message")
    .eq("id", id)
    .maybeSingle();

  if (!offer) {
    return NextResponse.json(
      { success: false, error: "Offer not found.", code: "OFFER_NOT_FOUND" },
      { status: 404 },
    );
  }

  const href = transactionHubInboxHref(parsed.data.conversationId);

  if (parsed.data.action === "counter") {
    if (!parsed.data.amount) {
      return NextResponse.json(
        { success: false, error: "Offer amount invalid.", code: "OFFER_AMOUNT_INVALID" },
        { status: 400 },
      );
    }

    const result = await executeCounterOffer({
      offerId: id,
      actorUserId: user.id,
      amount: parsed.data.amount,
      message: parsed.data.message ?? null,
      expectedStatus: parsed.data.expectedStatus ?? "pending",
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.message, code: result.code },
        { status: result.httpStatus },
      );
    }

    const notifyUser =
      result.offer.fromRole === "seller" ? offer.buyer_id : offer.seller_id;
    const counterHref = parsed.data.conversationId
      ? `${href}?offerId=${encodeURIComponent(result.offer.id)}&focus=counter`
      : href;
    void emitSmartNotification({
      userId: notifyUser,
      eventType: "new_offer",
      idempotencyKey: `offer-counter:${result.offer.id}`,
      notificationType: "offer",
      title: "Counter offer",
      subtitle: `Counter offer £${result.offer.amount.toFixed(2)}`,
      href: counterHref,
      payload: {
        offerId: result.offer.id,
        parentOfferId: result.parentOfferId,
        conversationId: parsed.data.conversationId,
        focus: "counter",
      },
    });

    return NextResponse.json({
      success: true,
      status: "countered",
      code: "COUNTER_SENT",
      parentOfferId: result.parentOfferId,
      offer: result.offer,
    });
  }

  if (offer.status !== "pending") {
    const code = mapOfferStatusToCounterError(offer.status);
    const copy = COUNTER_OFFER_ERROR_COPY[code];
    return NextResponse.json(
      { success: false, error: copy.message, code },
      { status: copy.httpStatus },
    );
  }

  if (parsed.data.action === "accept") {
    // Recipient of the current pending offer may accept (seller for buyer offers,
    // buyer for seller counters) — Blood XLIII state machine.
    const fromRole = resolveOfferFromRole({
      buyerId: offer.buyer_id,
      message: offer.message,
    });
    const canAccept =
      (fromRole === "buyer" && offer.seller_id === user.id) ||
      (fromRole === "seller" && offer.buyer_id === user.id);
    if (!canAccept) {
      return NextResponse.json(
        { success: false, error: "Permission denied.", code: "PERMISSION_DENIED" },
        { status: 403 },
      );
    }
    const { data: product } = await supabase
      .from("products")
      .select("slug, title, product_images ( url, is_primary, sort_order )")
      .eq("id", offer.product_id)
      .maybeSingle();

    const { bundle } = parseBundleMessageMeta(offer.message);
    let checkoutHref = product?.slug
      ? `/checkout/${encodeURIComponent(product.slug)}?offerId=${encodeURIComponent(id)}`
      : href;

    // Bundle: reserve + checkout session FIRST, then accept — never leave orphan accepted offers.
    if (bundle?.bundleId) {
      const buyNow = await BUNDLE_BUY_NOW_ENGINE({
        buyerId: offer.buyer_id,
        bundleId: bundle.bundleId,
        offerId: id,
        lockedItemPrice: Number(offer.amount),
        conversationId: parsed.data.conversationId ?? null,
      });
      if (!buyNow.ok) {
        return NextResponse.json(
          {
            success: false,
            error: buyNow.error,
            code: buyNow.code,
            accepted: false,
          },
          { status: 409 },
        );
      }
      checkoutHref = buyNow.checkoutPath;
    }

    const { data: acceptedRows, error } = await supabase
      .from("offers")
      .update({ status: "accepted" })
      .eq("id", id)
      .eq("status", "pending")
      .select("id");
    if (error) {
      if (bundle?.bundleId) {
        // Rollback checkout session created above (releases reserve + restores bundle).
        const { CHECKOUT_SESSION_ENGINE_getByPublicId, CHECKOUT_SESSION_ENGINE_destroy } =
          await import("@/lib/checkout/engines/checkout-session-engine-v1");
        const csMatch = checkoutHref.match(/[?&]cs=([^&]+)/);
        if (csMatch?.[1]) {
          const session = await CHECKOUT_SESSION_ENGINE_getByPublicId(
            decodeURIComponent(csMatch[1]),
          );
          if (session) {
            await CHECKOUT_SESSION_ENGINE_destroy({ session, status: "cancelled" });
          }
        }
      }
      return NextResponse.json(
        { success: false, error: "Database update failed.", code: "DATABASE_UPDATE_FAILED" },
        { status: 500 },
      );
    }
    if (!acceptedRows?.length) {
      if (bundle?.bundleId) {
        const { CHECKOUT_SESSION_ENGINE_getByPublicId, CHECKOUT_SESSION_ENGINE_destroy } =
          await import("@/lib/checkout/engines/checkout-session-engine-v1");
        const csMatch = checkoutHref.match(/[?&]cs=([^&]+)/);
        if (csMatch?.[1]) {
          const session = await CHECKOUT_SESSION_ENGINE_getByPublicId(
            decodeURIComponent(csMatch[1]),
          );
          if (session) {
            await CHECKOUT_SESSION_ENGINE_destroy({ session, status: "cancelled" });
          }
        }
      }
      return NextResponse.json(
        { success: false, error: "Offer version mismatch.", code: "OFFER_VERSION_MISMATCH" },
        { status: 409 },
      );
    }

    if (bundle?.bundleId) {
      await appendBundleEvent({
        bundleId: bundle.bundleId,
        actorId: user.id,
        eventType: "bundle.offer_accepted",
        payload: { offerId: id, amount: Number(offer.amount) },
      });
    }

    const productTitle = product?.title?.trim() || undefined;
    const images = (
      product as {
        product_images?: Array<{ url: string; is_primary: boolean | null; sort_order: number | null }>;
      } | null
    )?.product_images;
    const productImageUrl = [...(images ?? [])].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0),
    )[0]?.url;

    void emitSmartNotification({
      userId: fromRole === "seller" ? offer.seller_id : offer.buyer_id,
      eventType: "offer_accepted",
      idempotencyKey: `offer-accept:${id}`,
      notificationType: "offer",
      title: bundle?.bundleId ? "Bundle offer accepted" : "Offer accepted",
      subtitle: `Accepted £${Number(offer.amount).toFixed(2)}`,
      detail: productTitle,
      href: checkoutHref,
      avatarUrl: productImageUrl,
      avatarName: productTitle,
      payload: {
        offerId: id,
        productId: offer.product_id,
        productSlug: product?.slug,
        acceptedOfferPrice: Number(offer.amount),
        bundleId: bundle?.bundleId ?? null,
      },
    });
    return NextResponse.json({
      success: true,
      status: "accepted",
      acceptedOfferPrice: Number(offer.amount),
      offerId: id,
      checkoutHref,
      bundleId: bundle?.bundleId ?? null,
    });
  }

  if (parsed.data.action === "cancel") {
    if (offer.seller_id !== user.id && offer.buyer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Permission denied.", code: "PERMISSION_DENIED" },
        { status: 403 },
      );
    }
    const { data: cancelledRows, error } = await supabase
      .from("offers")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("status", "pending")
      .select("id");
    if (error) {
      return NextResponse.json(
        { success: false, error: "Database update failed.", code: "DATABASE_UPDATE_FAILED" },
        { status: 500 },
      );
    }
    if (!cancelledRows?.length) {
      return NextResponse.json(
        { success: false, error: "Offer version mismatch.", code: "OFFER_VERSION_MISMATCH" },
        { status: 409 },
      );
    }
    const { bundle } = parseBundleMessageMeta(offer.message);
    if (bundle?.bundleId) {
      await appendBundleEvent({
        bundleId: bundle.bundleId,
        actorId: user.id,
        eventType: "bundle.offer_cancelled",
        payload: { offerId: id },
      });
      await restoreBundleToActive({
        bundleId: bundle.bundleId,
        actorId: user.id,
        fromStatuses: ["offer_pending", "checkout"],
        reason: "offer_cancelled",
      });
    }
    const cancelNotifyUser = offer.seller_id === user.id ? offer.buyer_id : offer.seller_id;
    void emitSmartNotification({
      userId: cancelNotifyUser,
      eventType: "offer_cancelled",
      idempotencyKey: `offer-cancel:${id}:${user.id}`,
      notificationType: "offer",
      title: "Offer cancelled",
      subtitle: `Offer £${Number(offer.amount).toFixed(2)} was cancelled`,
      href,
      payload: { offerId: id, bundleId: bundle?.bundleId ?? null },
    });
    return NextResponse.json({ success: true, status: "cancelled", offerId: id });
  }

  if (parsed.data.action === "decline") {
    if (offer.seller_id !== user.id && offer.buyer_id !== user.id) {
      return NextResponse.json(
        { success: false, error: "Permission denied.", code: "PERMISSION_DENIED" },
        { status: 403 },
      );
    }
    const { data: declinedRows, error } = await supabase
      .from("offers")
      .update({ status: "rejected" })
      .eq("id", id)
      .eq("status", "pending")
      .select("id");
    if (error) {
      return NextResponse.json(
        { success: false, error: "Database update failed.", code: "DATABASE_UPDATE_FAILED" },
        { status: 500 },
      );
    }
    if (!declinedRows?.length) {
      return NextResponse.json(
        { success: false, error: "Offer version mismatch.", code: "OFFER_VERSION_MISMATCH" },
        { status: 409 },
      );
    }
    const { bundle } = parseBundleMessageMeta(offer.message);
    if (bundle?.bundleId) {
      await appendBundleEvent({
        bundleId: bundle.bundleId,
        actorId: user.id,
        eventType: "bundle.offer_declined",
        payload: { offerId: id },
      });
      await restoreBundleToActive({
        bundleId: bundle.bundleId,
        actorId: user.id,
        fromStatuses: ["offer_pending", "checkout"],
        reason: "offer_declined",
      });
    }
    const notifyUser = offer.seller_id === user.id ? offer.buyer_id : offer.seller_id;
    const { data: declineProduct } = await supabase
      .from("products")
      .select("title, product_images ( url, is_primary, sort_order )")
      .eq("id", offer.product_id)
      .maybeSingle();
    const declineImages = (
      declineProduct as {
        product_images?: Array<{ url: string; is_primary: boolean | null; sort_order: number | null }>;
      } | null
    )?.product_images;
    const declineImageUrl = [...(declineImages ?? [])].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || (a.sort_order ?? 0) - (b.sort_order ?? 0),
    )[0]?.url;
    void emitSmartNotification({
      userId: notifyUser,
      eventType: "offer_declined",
      idempotencyKey: `offer-decline:${id}:${user.id}`,
      notificationType: "offer",
      title: "Offer declined",
      subtitle: `Buyer offered £${Number(offer.amount).toFixed(2)}`,
      href,
      avatarUrl: declineImageUrl,
      avatarName: declineProduct?.title ?? undefined,
      payload: { offerId: id, bundleId: bundle?.bundleId ?? null },
    });
    return NextResponse.json({ success: true, status: "declined", offerId: id });
  }

  return NextResponse.json(
    { success: false, error: "Invalid offer action.", code: "INVALID_OFFER_ACTION" },
    { status: 400 },
  );
}
