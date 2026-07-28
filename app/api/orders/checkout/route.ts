import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { createOrderCheckoutSession } from "@/lib/orders/checkout";
import { getOrderById } from "@/lib/orders/store";
import { mapOrderCheckoutErrorToRvx } from "@/lib/checkout/map-order-checkout-error-v1";
import { formatBuyNowUserError, RVX_UNCLASSIFIED } from "@/lib/checkout/buy-now-guard-v1";
import { RVX_LOG } from "@/lib/checkout/rvx-logger-v1";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "orders-checkout", 10, 60_000);
  if (limited) return limited;

  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = (await request.json()) as {
      productSlug?: string;
      deliveryOption?: string;
      shippingAddressId?: string;
      shippingQuoteId?: string | null;
      hubConversationId?: string;
      paymentMethodId?: string | null;
      paymentMethod?: string | null;
      offerId?: string | null;
      idempotencyKey?: string | null;
      orderId?: string | null;
      checkoutSessionId?: string | null;
    };

    const headerIdempotency = request.headers.get("idempotency-key");

    if (!body.productSlug) {
      const mapped = mapOrderCheckoutErrorToRvx("Product is required.");
      return NextResponse.json(
        { success: false, code: mapped.code, error: mapped.userFacing },
        { status: 400 },
      );
    }

    const result = await createOrderCheckoutSession({
      buyerId: auth.user.id,
      productSlug: body.productSlug,
      deliveryOption: body.deliveryOption ?? "",
      shippingAddressId: body.shippingAddressId,
      shippingQuoteId: body.shippingQuoteId ?? null,
      hubConversationId: body.hubConversationId,
      paymentMethodId: body.paymentMethodId ?? null,
      paymentMethod:
        body.paymentMethod === "rovexo_balance" || body.paymentMethod === "card"
          ? body.paymentMethod
          : null,
      offerId: body.offerId ?? null,
      idempotencyKey: body.idempotencyKey ?? headerIdempotency,
      orderId: body.orderId ?? null,
      checkoutSessionId: body.checkoutSessionId ?? null,
    });

    if ("error" in result) {
      const mapped = mapOrderCheckoutErrorToRvx(result.error);
      RVX_LOG("STOP", mapped.code);
      return NextResponse.json(
        { success: false, code: mapped.code, error: mapped.userFacing },
        { status: 400 },
      );
    }

    const order =
      result.order ?? (result.orderId ? await getOrderById(result.orderId) : null);

    return NextResponse.json({
      success: true,
      url: result.url,
      orderId: result.orderId,
      checkoutSessionId: result.checkoutSessionId ?? body.checkoutSessionId ?? null,
      order,
    });
  } catch {
    RVX_LOG("STOP", RVX_UNCLASSIFIED);
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
