import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { createOrderCheckoutSession } from "@/lib/orders/checkout";
import { getOrderById } from "@/lib/orders/store";
import type { DeliveryOptionId } from "@/lib/checkout/delivery";

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
      deliveryOption?: DeliveryOptionId;
      shippingAddressId?: string;
    };

    if (!body.productSlug) {
      return NextResponse.json({ success: false, error: "Product is required." }, { status: 400 });
    }

    const result = await createOrderCheckoutSession({
      buyerId: auth.user.id,
      productSlug: body.productSlug,
      deliveryOption: body.deliveryOption ?? "standard",
      shippingAddressId: body.shippingAddressId,
    });

    if ("error" in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    const order = result.order ?? (await getOrderById(result.orderId));

    return NextResponse.json({
      success: true,
      url: result.url,
      orderId: result.orderId,
      order,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to start checkout." }, { status: 500 });
  }
}
