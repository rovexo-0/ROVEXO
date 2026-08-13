import { NextResponse } from "next/server";
import { z } from "zod";

import { requireApiAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { assertOrderShippingSeller } from "@/lib/shipping/assert-order-shipping-access.server";
import { generateShippingLabelForOrder } from "@/lib/shipping/label-generation.server";
import {
  isSendcloudPanelDocumentUrl,
  resolveBrowserShippingLabelPdfUrl,
} from "@/lib/shipping/label-storage.server";
import { createShippingAdminClient } from "@/lib/shipping/db-client";
import {
  buildDemoShippingLabelPresentationUrl,
  isDemoShippingTrackingNumber,
} from "@/lib/shipping/pricing/demo-adapter";
import { activeProviders } from "@/lib/shipping/pricing/service.server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  orderId: z.string().uuid(),
  parcelId: z.string().uuid().optional(),
});

/**
 * Canonical shipping label API — provider-agnostic.
 * Routes through ShippingEngine (Sendcloud).
 * GET label documents are SELLER-ONLY (fail closed 404).
 */
export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const limited = await enforceRateLimit(request, "shipping-labels", 30, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const parcelId = searchParams.get("parcelId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  const access = await assertOrderShippingSeller(orderId, auth.user.id);
  if (!access.ok) {
    return NextResponse.json({ error: "Shipping record not found." }, { status: 404 });
  }

  const admin = createShippingAdminClient();
  const { data: record } = await admin
    .from("shipping_records")
    .select("id")
    .eq("order_id", access.orderId)
    .maybeSingle();

  const recordId = (record as { id?: string } | null)?.id;
  if (!recordId) {
    return NextResponse.json({ error: "Shipping record not found." }, { status: 404 });
  }

  let labelQuery = admin
    .from("shipping_labels_v1")
    .select(
      "id, label_storage_path, label_url, tracking_number, carrier, provider, shipment_parcel_id, parcel_number",
    )
    .eq("shipping_record_id", recordId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (parcelId) {
    labelQuery = labelQuery.eq("shipment_parcel_id", parcelId);
  }

  const { data: labelRows } = await labelQuery;
  const label = (Array.isArray(labelRows) ? labelRows[0] : labelRows) as {
    id?: string;
    label_storage_path?: string | null;
    label_url?: string | null;
    tracking_number?: string | null;
    carrier?: string | null;
    provider?: string | null;
    shipment_parcel_id?: string | null;
    parcel_number?: number | null;
  } | null;

  // Demo / virtual labels may only persist a tracking number (relative demo PDF URL).
  if (!label?.tracking_number && !label?.label_storage_path && !label?.label_url) {
    return NextResponse.json({ error: "Label not found." }, { status: 404 });
  }

  // Demo: always serve the live high-fidelity presentation (ignore stale storage snapshots).
  if (isDemoShippingTrackingNumber(label.tracking_number)) {
    return NextResponse.json({
      ok: true,
      pdfUrl: buildDemoShippingLabelPresentationUrl({
        tracking: label.tracking_number!,
        carrier: label.carrier,
        service: null,
      }),
      trackingNumber: label.tracking_number,
      carrier: label.carrier,
      provider: label.provider ?? "sendcloud",
    });
  }

  // P7.26: browser-facing pdfUrl must be ROVEXO-controlled (signed storage / same-origin).
  // Never return authenticated Sendcloud panel document URLs.
  const resolved = await resolveBrowserShippingLabelPdfUrl({
    orderId: access.orderId,
    labelRowId: label.id ?? null,
    parcelNumber: label.parcel_number ?? 1,
    trackingNumber: label.tracking_number,
    labelStoragePath: label.label_storage_path,
    labelUrl: label.label_url,
  });

  if (!resolved?.pdfUrl) {
    return NextResponse.json(
      {
        error:
          "Shipping label document is temporarily unavailable. Please try again shortly.",
      },
      { status: 503 },
    );
  }

  if (isSendcloudPanelDocumentUrl(resolved.pdfUrl)) {
    return NextResponse.json(
      { error: "Shipping label document is temporarily unavailable." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    pdfUrl: resolved.pdfUrl,
    trackingNumber: label.tracking_number,
    carrier: label.carrier,
    provider: label.provider ?? "sendcloud",
  });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const limited = await enforceRateLimit(request, "shipping-labels", 10, 60_000);
  if (limited) return limited;

  if (activeProviders().length === 0) {
    return NextResponse.json({ error: "No shipping provider is configured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid label request." }, { status: 400 });
  }

  const result = await generateShippingLabelForOrder(
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
