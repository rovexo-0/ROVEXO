import { NextResponse } from "next/server";

import { requireApiSuperAdmin } from "@/lib/auth/session";
import { createShippingAdminClient } from "@/lib/shipping/db-client";
import { getParcel2GoLabelSignedUrl } from "@/lib/shipping/parcel2go-label-storage.server";
import { parcel2GoProvider } from "@/src/services/shipping/parcel2go/provider";
import { isParcel2GoConfigured } from "@/src/services/shipping/env";
import { isShippingError } from "@/src/services/shipping/errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RECORD_STATUSES = new Set([
  "preparing",
  "collected",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "returned",
  "cancelled",
  "lost",
  "failed",
]);

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim().toLowerCase() ?? "";
  const carrier = searchParams.get("carrier")?.trim() ?? "";
  const query = searchParams.get("q")?.trim() ?? "";

  const admin = createShippingAdminClient();

  let shipmentsQuery = admin
    .from("shipping_records")
    .select(
      "id, order_id, status, carrier, tracking_number, parcel2go_order_id, parcel2go_reference, service_code, tracking_url, shipping_price_pence, insurance_price_pence, last_tracking_sync_at, updated_at",
    )
    .eq("provider", "parcel2go");

  if (status && RECORD_STATUSES.has(status)) {
    shipmentsQuery = shipmentsQuery.eq("status", status);
  }
  if (carrier) {
    shipmentsQuery = shipmentsQuery.ilike("carrier", `%${carrier}%`);
  }
  if (query) {
    const pattern = `%${query}%`;
    shipmentsQuery = shipmentsQuery.or(
      `order_id.ilike.${pattern},tracking_number.ilike.${pattern},parcel2go_order_id.ilike.${pattern},parcel2go_reference.ilike.${pattern}`,
    );
  }

  const [health, shipments, labels, webhookEvents] = await Promise.all([
    isParcel2GoConfigured() ? parcel2GoProvider.healthCheck().catch(() => null) : null,
    shipmentsQuery.order("updated_at", { ascending: false }).limit(100),
    admin
      .from("shipping_labels_v1")
      .select(
        "id, shipping_record_id, provider, tracking_number, carrier, label_status, label_url, label_storage_path, label_mime_type, label_size_bytes, parcel2go_reference, updated_at",
      )
      .eq("provider", "parcel2go")
      .order("updated_at", { ascending: false })
      .limit(100),
    admin
      .from("parcel2go_webhook_events")
      .select(
        "id, event_id, event_type, parcel2go_order_id, tracking_number, processed, correlation_id, event_timestamp, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return NextResponse.json({
    configured: isParcel2GoConfigured(),
    health,
    filters: { status, carrier, query },
    shipments: shipments.data ?? [],
    labels: labels.data ?? [],
    webhookEvents: webhookEvents.data ?? [],
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  if (!isParcel2GoConfigured()) {
    return NextResponse.json({ error: "Parcel2Go is not configured." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as {
    action?: string;
    orderId?: string;
    trackingNumber?: string;
    shipmentId?: string;
    storagePath?: string;
  } | null;

  if (body?.action === "retry-tracking" && body.orderId) {
    try {
      const tracking = await parcel2GoProvider.getTracking({
        shipmentId: body.shipmentId ?? body.orderId,
        trackingNumber: body.trackingNumber ?? undefined,
      });
      return NextResponse.json({ ok: true, tracking });
    } catch (error) {
      const message = isShippingError(error) ? error.message : "Tracking retry failed.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (body?.action === "label-url" && body.storagePath) {
    const signedUrl = await getParcel2GoLabelSignedUrl(body.storagePath);
    if (!signedUrl) {
      return NextResponse.json({ error: "Unable to sign label URL." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, signedUrl });
  }

  if (body?.action === "health-check") {
    const health = await parcel2GoProvider.healthCheck();
    return NextResponse.json({ ok: health.status === "healthy", health });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
