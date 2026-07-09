import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { getBuyerCommerceOrderView } from "@/lib/commerce/read-model";
import { applyParcelOperation, getShipmentParcelById } from "@/lib/shipping/parcels-repository";
import { fetchOrderForUser, getOrderViewRole } from "@/lib/orders/queries";
import { PARCEL_OPERATIONS } from "@/lib/shipping/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  operation: z.enum(PARCEL_OPERATIONS),
});

type RouteParams = { params: Promise<{ id: string; parcelId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const { id, parcelId } = await params;
  const order = await fetchOrderForUser(id, auth.user.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const role = getOrderViewRole(order, auth.user.id);
  if (role !== "buyer" && role !== "seller") {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const existing = await getShipmentParcelById(parcelId);
  if (!existing) {
    return NextResponse.json({ error: "Parcel not found." }, { status: 404 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid parcel operation." }, { status: 400 });
  }

  const parcel = await applyParcelOperation(parcelId, body.operation);
  if (!parcel) {
    return NextResponse.json({ error: "Unable to apply parcel operation." }, { status: 500 });
  }

  const commerce = await getBuyerCommerceOrderView(order);
  return NextResponse.json({
    ok: true,
    parcel,
    parcels: commerce.parcels,
    sellerShipments: commerce.sellerShipments,
  });
}
