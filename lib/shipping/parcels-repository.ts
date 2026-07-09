import "server-only";

import { createShippingAdminClient } from "@/lib/shipping/db-client";
import { ensureShippingRecord } from "@/lib/shipping/store";
import type { ShipmentParcel, ShipmentParcelLabel, ShippingStatus, ParcelOperation } from "@/lib/shipping/types";

type ParcelRow = {
  id: string;
  shipping_record_id: string;
  parcel_number: number;
  total_parcels: number;
  weight_kg: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  carrier: string | null;
  shipping_service: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  status: ShippingStatus;
  product_item_ids: string[] | null;
  insurance_enabled: boolean | null;
  insurance_value_gbp: number | null;
  parcel_operation: ParcelOperation | null;
  estimated_delivery_at: string | null;
  created_at: string;
  updated_at: string;
};

type LabelRow = {
  id: string;
  shipment_parcel_id: string | null;
  label_storage_path: string | null;
  label_url: string | null;
  pdf_storage_path: string | null;
  label_status: string;
};

function mapParcelRow(row: ParcelRow, label: LabelRow | null): ShipmentParcel {
  const pdfPath = label?.label_storage_path ?? label?.pdf_storage_path ?? null;
  const labelUrl = label?.label_url ?? null;

  return {
    id: row.id,
    shippingRecordId: row.shipping_record_id,
    parcelNumber: row.parcel_number,
    totalParcels: row.total_parcels,
    weightKg: row.weight_kg,
    dimensions:
      row.length_cm || row.width_cm || row.height_cm
        ? {
            lengthCm: row.length_cm,
            widthCm: row.width_cm,
            heightCm: row.height_cm,
          }
        : null,
    carrier: row.carrier,
    shippingService: row.shipping_service,
    trackingNumber: row.tracking_number,
    trackingUrl: row.tracking_url,
    status: row.status,
    productItemIds: row.product_item_ids ?? [],
    insuranceEnabled: row.insurance_enabled ?? false,
    insuranceValueGbp: row.insurance_value_gbp,
    operation: row.parcel_operation,
    estimatedDeliveryAt: row.estimated_delivery_at,
    label: label
      ? {
          id: label.id,
          pdfUrl: pdfPath,
          labelUrl,
          status:
            label.label_status === "ready"
              ? "ready"
              : label.label_status === "void"
                ? "void"
                : "pending",
        }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchLabelsByParcelIds(parcelIds: string[]): Promise<Map<string, LabelRow>> {
  if (parcelIds.length === 0) return new Map();

  const admin = createShippingAdminClient();
  const { data } = await admin
    .from("shipping_labels_v1")
    .select("id, shipment_parcel_id, label_storage_path, label_url, pdf_storage_path, label_status")
    .in("shipment_parcel_id", parcelIds);

  const map = new Map<string, LabelRow>();
  for (const row of (data as LabelRow[] | null) ?? []) {
    if (row.shipment_parcel_id) map.set(row.shipment_parcel_id, row);
  }
  return map;
}

export async function listShipmentParcelsForOrder(orderId: string): Promise<ShipmentParcel[]> {
  const admin = createShippingAdminClient();
  const { data: record } = await admin
    .from("shipping_records")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  const recordId = (record as { id?: string } | null)?.id;
  if (!recordId) return [];

  const { data: rows } = await admin
    .from("shipment_parcels")
    .select("*")
    .eq("shipping_record_id", recordId)
    .order("parcel_number", { ascending: true });

  const parcelRows = (rows as ParcelRow[] | null) ?? [];
  const labels = await fetchLabelsByParcelIds(parcelRows.map((row) => row.id));

  return parcelRows.map((row) => mapParcelRow(row, labels.get(row.id) ?? null));
}

export async function getShipmentParcelById(parcelId: string): Promise<ShipmentParcel | null> {
  const admin = createShippingAdminClient();
  const { data: row } = await admin.from("shipment_parcels").select("*").eq("id", parcelId).maybeSingle();
  if (!row) return null;

  const parcelRow = row as ParcelRow;
  const labels = await fetchLabelsByParcelIds([parcelRow.id]);
  return mapParcelRow(parcelRow, labels.get(parcelRow.id) ?? null);
}

async function renumberParcels(shippingRecordId: string): Promise<void> {
  const admin = createShippingAdminClient();
  const { data: rows } = await admin
    .from("shipment_parcels")
    .select("id, parcel_number")
    .eq("shipping_record_id", shippingRecordId)
    .order("parcel_number", { ascending: true });

  const parcelRows = (rows as Array<{ id: string; parcel_number: number }> | null) ?? [];
  const total = parcelRows.length;

  for (let index = 0; index < parcelRows.length; index += 1) {
    const parcel = parcelRows[index]!;
    const parcelNumber = index + 1;
    await admin
      .from("shipment_parcels")
      .update({ parcel_number: parcelNumber, total_parcels: total })
      .eq("id", parcel.id);

    await admin
      .from("shipping_labels_v1")
      .update({ parcel_number: parcelNumber, total_parcels: total })
      .eq("shipment_parcel_id", parcel.id);
  }
}

export async function createShipmentParcel(input: {
  orderId: string;
  productItemIds?: string[];
  weightKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  carrier?: string | null;
  shippingService?: string | null;
  insuranceEnabled?: boolean;
  insuranceValueGbp?: number | null;
}): Promise<ShipmentParcel | null> {
  const record = await ensureShippingRecord({ orderId: input.orderId });
  if (!record) return null;

  const admin = createShippingAdminClient();
  const { data: existing } = await admin
    .from("shipment_parcels")
    .select("parcel_number")
    .eq("shipping_record_id", record.id)
    .order("parcel_number", { ascending: false })
    .limit(1);

  const nextNumber =
    ((existing as Array<{ parcel_number: number }> | null)?.[0]?.parcel_number ?? 0) + 1;
  const totalParcels = nextNumber;

  const { data, error } = await admin
    .from("shipment_parcels")
    .insert({
      shipping_record_id: record.id,
      parcel_number: nextNumber,
      total_parcels: totalParcels,
      weight_kg: input.weightKg ?? null,
      length_cm: input.lengthCm ?? null,
      width_cm: input.widthCm ?? null,
      height_cm: input.heightCm ?? null,
      carrier: input.carrier ?? null,
      shipping_service: input.shippingService ?? null,
      product_item_ids: input.productItemIds ?? [],
      insurance_enabled: input.insuranceEnabled ?? false,
      insurance_value_gbp: input.insuranceValueGbp ?? null,
      status: "preparing",
    })
    .select("*")
    .single();

  if (error || !data) return null;

  await renumberParcels(record.id);
  return getShipmentParcelById((data as ParcelRow).id);
}

export async function updateShipmentParcel(
  parcelId: string,
  patch: Partial<{
    weightKg: number | null;
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
    carrier: string | null;
    shippingService: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    status: ShippingStatus;
    productItemIds: string[];
    insuranceEnabled: boolean;
    insuranceValueGbp: number | null;
    operation: ParcelOperation | null;
  }>,
): Promise<ShipmentParcel | null> {
  const admin = createShippingAdminClient();
  const payload: Record<string, unknown> = {};

  if (patch.weightKg !== undefined) payload.weight_kg = patch.weightKg;
  if (patch.lengthCm !== undefined) payload.length_cm = patch.lengthCm;
  if (patch.widthCm !== undefined) payload.width_cm = patch.widthCm;
  if (patch.heightCm !== undefined) payload.height_cm = patch.heightCm;
  if (patch.carrier !== undefined) payload.carrier = patch.carrier;
  if (patch.shippingService !== undefined) payload.shipping_service = patch.shippingService;
  if (patch.trackingNumber !== undefined) payload.tracking_number = patch.trackingNumber;
  if (patch.trackingUrl !== undefined) payload.tracking_url = patch.trackingUrl;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.productItemIds !== undefined) payload.product_item_ids = patch.productItemIds;
  if (patch.insuranceEnabled !== undefined) payload.insurance_enabled = patch.insuranceEnabled;
  if (patch.insuranceValueGbp !== undefined) payload.insurance_value_gbp = patch.insuranceValueGbp;
  if (patch.operation !== undefined) payload.parcel_operation = patch.operation;

  if (Object.keys(payload).length === 0) return getShipmentParcelById(parcelId);

  const { error } = await admin.from("shipment_parcels").update(payload).eq("id", parcelId);
  if (error) return null;

  return getShipmentParcelById(parcelId);
}

export async function deleteShipmentParcel(parcelId: string): Promise<boolean> {
  const parcel = await getShipmentParcelById(parcelId);
  if (!parcel) return false;
  if (parcel.label?.status === "ready") return false;

  const admin = createShippingAdminClient();
  const { error } = await admin.from("shipment_parcels").delete().eq("id", parcelId);
  if (error) return false;

  await renumberParcels(parcel.shippingRecordId);
  return true;
}

export async function attachLabelToParcel(input: {
  parcelId: string;
  shippingRecordId: string;
  providerId?: string;
  label: {
    trackingNumber: string | null;
    carrier: string;
    pdfUrl: string | null;
    labelUrl: string | null;
    status: ShipmentParcelLabel["status"];
  };
  internalPlatformFeePence?: number;
}): Promise<ShipmentParcel | null> {
  const parcel = await getShipmentParcelById(input.parcelId);
  if (!parcel) return null;

  const admin = createShippingAdminClient();
  const labelPayload = {
    shipping_record_id: input.shippingRecordId,
    shipment_parcel_id: input.parcelId,
    provider: input.providerId ?? "parcel2go",
    parcel_number: parcel.parcelNumber,
    total_parcels: parcel.totalParcels,
    tracking_number: input.label.trackingNumber,
    barcode: input.label.trackingNumber,
    qr_payload: input.label.trackingNumber,
    pdf_storage_path: input.label.pdfUrl,
    label_url: input.label.labelUrl,
    label_storage_path: input.label.pdfUrl,
    carrier: input.label.carrier,
    label_status: input.label.status,
    internal_platform_fee_pence: input.internalPlatformFeePence ?? 0,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await admin
    .from("shipping_labels_v1")
    .select("id")
    .eq("shipment_parcel_id", input.parcelId)
    .maybeSingle();

  if ((existing as { id?: string } | null)?.id) {
    await admin.from("shipping_labels_v1").update(labelPayload).eq("shipment_parcel_id", input.parcelId);
  } else {
    await admin.from("shipping_labels_v1").insert(labelPayload);
  }

  await admin
    .from("shipment_parcels")
    .update({
      tracking_number: input.label.trackingNumber,
      carrier: input.label.carrier,
      status: "collected",
    })
    .eq("id", input.parcelId);

  return getShipmentParcelById(input.parcelId);
}

const OPERATION_STATUS: Record<ParcelOperation, ShippingStatus> = {
  return: "returned",
  lost: "lost",
  damaged: "failed",
  claim: "preparing",
};

export async function applyParcelOperation(
  parcelId: string,
  operation: ParcelOperation,
): Promise<ShipmentParcel | null> {
  const status = OPERATION_STATUS[operation];
  return updateShipmentParcel(parcelId, {
    operation,
    status,
  });
}
