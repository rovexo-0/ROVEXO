import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { BUY_NOW_ENGINE } from "@/lib/checkout/engines/buy-now-engine-v1";
import { BUNDLE_BUY_NOW_ENGINE } from "@/lib/bundle/bundle-buy-now-engine-v1";
import { formatBuyNowUserError, RVX_UNCLASSIFIED } from "@/lib/checkout/buy-now-guard-v1";
import { FINANCIAL_LOGGER } from "@/lib/checkout/engines/idempotency-engine-v1";

/**
 * POST /api/checkout/buy-now
 * Blood XXIV — BUY_NOW_ENGINE / BUNDLE_BUY_NOW_ENGINE (Phase 1).
 * Single listing: productSlug. Bundle: bundleId (server revalidates + reserves all).
 */
export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "checkout-buy-now", 20, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    FINANCIAL_LOGGER("BUYER FAILED");
    return NextResponse.json(
      {
        success: false,
        code: "RVX-2002",
        error: formatBuyNowUserError("RVX-2002"),
      },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as {
      productSlug?: string;
      bundleId?: string | null;
      offerId?: string | null;
      idempotencyKey?: string | null;
      conversationId?: string | null;
    };

    const bundleId = body.bundleId?.trim() || null;

    if (bundleId) {
      const result = await BUNDLE_BUY_NOW_ENGINE({
        buyerId: auth.user.id,
        bundleId,
        clientIdempotencyKey: body.idempotencyKey ?? null,
        conversationId: body.conversationId ?? null,
        offerId: body.offerId ?? null,
      });

      if (!result.ok) {
        return NextResponse.json(
          {
            success: false,
            code: result.code,
            error: result.userFacing,
          },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        checkoutPath: result.checkoutPath,
        productSlug: body.productSlug?.trim() || result.listingId,
        bundleId,
        idempotencyKey: result.idempotencyKey,
        lockToken: result.lockToken,
        orderId: result.orderId,
        transactionId: result.transactionId,
        checkoutSessionId: result.checkoutSessionId,
        paymentIntentId: result.paymentIntentId,
        listingId: result.listingId,
        price: result.price,
        platformFee: result.platformFee,
        shipping: result.shipping,
        currency: result.currency,
        reservedUntil: result.reservedUntil,
      });
    }

    if (!body.productSlug?.trim()) {
      return NextResponse.json(
        {
          success: false,
          code: "RVX-2001",
          error: formatBuyNowUserError("RVX-2001"),
        },
        { status: 400 },
      );
    }

    const result = await BUY_NOW_ENGINE({
      buyerId: auth.user.id,
      productSlug: body.productSlug,
      offerId: body.offerId ?? null,
      clientIdempotencyKey: body.idempotencyKey ?? null,
      conversationId: body.conversationId ?? null,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          code: result.code,
          error: result.userFacing,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      checkoutPath: result.checkoutPath,
      productSlug: body.productSlug.trim(),
      idempotencyKey: result.idempotencyKey,
      lockToken: result.lockToken,
      orderId: result.orderId,
      transactionId: result.transactionId,
      checkoutSessionId: result.checkoutSessionId,
      paymentIntentId: result.paymentIntentId,
      listingId: result.listingId,
      price: result.price,
      platformFee: result.platformFee,
      shipping: result.shipping,
      currency: result.currency,
      reservedUntil: result.reservedUntil,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    FINANCIAL_LOGGER("STOP", message);
    console.error("[buy-now] unclassified throw:", message);
    return NextResponse.json(
      {
        success: false,
        code: RVX_UNCLASSIFIED,
        error: formatBuyNowUserError(RVX_UNCLASSIFIED),
      },
      { status: 500 },
    );
  }
}
