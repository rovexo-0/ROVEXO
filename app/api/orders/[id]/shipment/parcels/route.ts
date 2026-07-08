import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { getSellerShipmentView } from "@/lib/commerce/read-model";
import { createShipmentParcel } from "@/lib/shipping/parcels-repository";
import { fetchOrderForUser, getOrderViewRole } from "@/lib/orders/queries";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  productItemIds: z.array(z.string()).optional(),
  weightKg: z.number().positive().optional().nullable(),
  lengthCm: z.number().positive().optional().nullable(),
  widthCm: z.number().positive().optional().nullable(),
  heightCm: z.number().positive().optional().nullable(),
  carrier: z.string().trim().optional().nullable(),
  shippingService: z.string().trim().optional().nullable(),
});

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
  return NextResponse.json({ ok: true, parcels: shipment.parcels });
}

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const order = await fetchOrderForUser(id, auth.user.id);
  if (!order || getOrderViewRole(order, auth.user.id) !== "seller") {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.status !== "awaiting_shipment" && order.status !== "shipped") {
    return NextResponse.json({ error: "Order is not ready for shipment preparation." }, { status: 400 });
  }

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid parcel payload." }, { status: 400 });
  }

  const parcel = await createShipmentParcel({
    orderId: id,
    productItemIds: body.productItemIds ?? [order.product.id],
    weightKg: body.weightKg ?? null,
    lengthCm: body.lengthCm ?? null,
    widthCm: body.widthCm ?? null,
    heightCm: body.heightCm ?? null,
    carrier: body.carrier ?? String(order.deliveryCarrier),
    shippingService: body.shippingService ?? null,
  });

  if (!parcel) {
    return NextResponse.json({ error: "Unable to create parcel." }, { status: 500 });
  }

  const shipment = await getSellerShipmentView(order);
  return NextResponse.json({ ok: true, parcel, parcels: shipment.parcels });
}
