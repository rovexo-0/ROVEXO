import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { assertOrderShippingParticipant } from "@/lib/shipping/assert-order-shipping-access.server";
import { getPublicShippingEngineConfig, getShippingOrderContext, listUserShippingOrders } from "@/lib/shipping-engine/reader";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");

  if (orderId) {
    const access = await assertOrderShippingParticipant(orderId, auth.user.id);
    if (!access.ok) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    const context = await getShippingOrderContext(access.orderId, auth.user.id);
    if (!context) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ context });
  }

  const [config, orders] = await Promise.all([
    getPublicShippingEngineConfig(),
    listUserShippingOrders(auth.user.id),
  ]);

  return NextResponse.json({ config, orders });
}
