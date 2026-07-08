import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { getSellerShipmentView } from "@/lib/commerce/read-model";
import { fetchOrderForUser, getOrderViewRole } from "@/lib/orders/queries";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const order = await fetchOrderForUser(id, auth.user.id);
  if (!order || getOrderViewRole(order, auth.user.id) !== "seller") {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const shipment = await getSellerShipmentView(order);
  return NextResponse.json({ ok: true, shipment });
}
