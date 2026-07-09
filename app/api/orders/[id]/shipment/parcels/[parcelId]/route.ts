import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth/session";
import { getSellerShipmentView } from "@/lib/commerce/read-model";
import {
  deleteShipmentParcel,
  getShipmentParcelById,
  updateShipmentParcel,
} from "@/lib/shipping/parcels-repository";
import { fetchOrderForUser, getOrderViewRole } from "@/lib/orders/queries";
import { SHIPPING_STATUSES, PARCEL_OPERATIONS } from "@/lib/shipping/types";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  weightKg: z.number().positive().optional().nullable(),
  lengthCm: z.number().positive().optional().nullable(),
  widthCm: z.number().positive().optional().nullable(),
  heightCm: z.number().positive().optional().nullable(),
  carrier: z.string().trim().optional().nullable(),
  shippingService: z.string().trim().optional().nullable(),
  trackingNumber: z.string().trim().optional().nullable(),
  productItemIds: z.array(z.string()).optional(),
  status: z.enum(SHIPPING_STATUSES).optional(),
  insuranceEnabled: z.boolean().optional(),
  insuranceValueGbp: z.number().positive().optional().nullable(),
  operation: z.enum(PARCEL_OPERATIONS).optional().nullable(),
});

type RouteParams = { params: Promise<{ id: string; parcelId: string }> };

async function authorizeSeller(orderId: string, userId: string) {
  const order = await fetchOrderForUser(orderId, userId);
  if (!order || getOrderViewRole(order, userId) !== "seller") return null;
  return order;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const { id, parcelId } = await params;
  const order = await authorizeSeller(id, auth.user.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const existing = await getShipmentParcelById(parcelId);
  if (!existing) {
    return NextResponse.json({ error: "Parcel not found." }, { status: 404 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid parcel update." }, { status: 400 });
  }

  const parcel = await updateShipmentParcel(parcelId, body);
  if (!parcel) {
    return NextResponse.json({ error: "Unable to update parcel." }, { status: 500 });
  }

  const shipment = await getSellerShipmentView(order);
  return NextResponse.json({ ok: true, parcel, parcels: shipment.parcels });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const { id, parcelId } = await params;
  const order = await authorizeSeller(id, auth.user.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const ok = await deleteShipmentParcel(parcelId);
  if (!ok) {
    return NextResponse.json(
      { error: "Parcel cannot be deleted once a label has been generated." },
      { status: 400 },
    );
  }

  const shipment = await getSellerShipmentView(order);
  return NextResponse.json({ ok: true, parcels: shipment.parcels });
}
