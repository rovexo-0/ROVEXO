import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { generateParcel2GoLabelForOrder } from "@/lib/shipping/parcel2go-label.server";
import { getParcel2GoLabelSignedUrl } from "@/lib/shipping/parcel2go-label-storage.server";
import { createShippingAdminClient } from "@/lib/shipping/db-client";
import { isParcel2GoConfigured } from "@/src/services/shipping/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  orderId: z.string().uuid(),
  parcelId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const limited = await enforceRateLimit(request, "parcel2go-labels", 30, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  const admin = createShippingAdminClient();
  const { data: shippingRecord } = await admin
    .from("shipping_records")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();
  const recordRow = shippingRecord as { id?: string } | null;
  if (!recordRow?.id) {
    return NextResponse.json({ error: "Shipping record not found." }, { status: 404 });
  }

  const { data: labelRow } = await admin
    .from("shipping_labels_v1")
    .select("label_storage_path, label_url, tracking_number, carrier")
    .eq("shipping_record_id", recordRow.id)
    .maybeSingle();

  const label = labelRow as {
    label_storage_path?: string | null;
    label_url?: string | null;
    tracking_number?: string | null;
    carrier?: string | null;
  } | null;

  if (!label?.label_storage_path && !label?.label_url) {
    return NextResponse.json({ error: "Label not found." }, { status: 404 });
  }

  const signedUrl = label.label_storage_path
    ? await getParcel2GoLabelSignedUrl(label.label_storage_path)
    : label.label_url;

  return NextResponse.json({
    ok: true,
    pdfUrl: signedUrl,
    trackingNumber: label.tracking_number,
    carrier: label.carrier,
  });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const limited = await enforceRateLimit(request, "parcel2go-labels", 10, 60_000);
  if (limited) return limited;
  if (!isParcel2GoConfigured()) {
    return NextResponse.json({ error: "Parcel2Go is not configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid label request." }, { status: 400 });
  }

  const result = await generateParcel2GoLabelForOrder(
    parsed.data.orderId,
    auth.user.id,
    parsed.data.parcelId,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    label: result.label,
    record: result.record,
    parcel: result.parcel,
  });
}
