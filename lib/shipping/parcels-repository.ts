import "server-only";

import { nextAppendParcelNumber } from "@/lib/shipping/append-shipment-parcel-without-renumber-v1";
import { createShippingAdminClient } from "@/lib/shipping/db-client";
import {
  decideLabelGenerationClaim,
  isRecoveryParcelAttemptAuthorized,
  type LabelGenerationClaimOutcome,
} from "@/lib/shipping/label-generation-idempotency-v1";
// decideLabelGenerationClaim + claimLabelGenerationAttempt enforce MEDIUM #7
import { ensureShippingRecord } from "@/lib/shipping/store";
import type { ShipmentParcel, ShipmentParcelLabel, ShippingStatus, ParcelOperation } from "@/lib/shipping/types";

function isUniqueViolation(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "23505") return true;
  return /duplicate key|unique constraint/i.test(error.message ?? "");
}

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
  provider_parcel_id?: string | null;
};

function parseProviderParcelId(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const parsed = Number.parseInt(String(raw).trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

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
    providerParcelId: parseProviderParcelId(label?.provider_parcel_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchLabelsByParcelIds(parcelIds: string[]): Promise<Map<string, LabelRow>> {
  if (parcelIds.length === 0) return new Map();

  const admin = createShippingAdminClient();
  const { data } = await admin
    .from("shipping_labels_v1")
    .select("id, shipment_parcel_id, label_storage_path, label_url, pdf_storage_path, label_status, provider_parcel_id")
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

export async function findOrderIdByParcelTrackingNumber(
  trackingNumber: string,
): Promise<string | null> {
  const trimmed = trackingNumber.trim();
  if (!trimmed) return null;

  const admin = createShippingAdminClient();
  const { data } = await admin
    .from("shipment_parcels")
    .select("shipping_record_id")
    .eq("tracking_number", trimmed)
    .order("parcel_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const recordId = (data as { shipping_record_id?: string } | null)?.shipping_record_id;
  if (!recordId) return null;

  const { data: record } = await admin
    .from("shipping_records")
    .select("order_id")
    .eq("id", recordId)
    .maybeSingle();

  return (record as { order_id?: string } | null)?.order_id ?? null;
}

export async function getShipmentParcelById(parcelId: string): Promise<ShipmentParcel | null> {
  const admin = createShippingAdminClient();
  const { data: row } = await admin.from("shipment_parcels").select("*").eq("id", parcelId).maybeSingle();
  if (!row) return null;

  const parcelRow = row as ParcelRow;
  const labels = await fetchLabelsByParcelIds([parcelRow.id]);
  return mapParcelRow(parcelRow, labels.get(parcelRow.id) ?? null);
}

/** Read persisted Sendcloud/provider parcel id for idempotent label retries. */
export async function getProviderParcelIdForShipmentParcel(
  parcelId: string,
): Promise<number | null> {
  const admin = createShippingAdminClient();
  const { data } = await admin
    .from("shipping_labels_v1")
    .select("provider_parcel_id")
    .eq("shipment_parcel_id", parcelId)
    .maybeSingle();
  const raw = (data as { provider_parcel_id?: string | null } | null)?.provider_parcel_id;
  if (!raw) return null;
  const parsed = Number.parseInt(String(raw).trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

type LabelClaimRow = {
  id: string;
  label_status: string | null;
  tracking_number: string | null;
  pdf_storage_path: string | null;
  label_storage_path: string | null;
  label_url: string | null;
  provider_parcel_id: string | null;
};

function mapClaimRowToOutcome(
  row: LabelClaimRow,
  claimedByThisRequest: boolean,
): LabelGenerationClaimOutcome {
  const pdfUrl =
    row.pdf_storage_path?.trim() ||
    row.label_storage_path?.trim() ||
    row.label_url?.trim() ||
    null;
  const providerParcelId = parseProviderParcelId(row.provider_parcel_id);
  const decision = decideLabelGenerationClaim({
    labelStatus: row.label_status,
    trackingNumber: row.tracking_number,
    pdfUrl,
    providerParcelId,
    claimedByThisRequest,
  });

  if (decision.action === "return_ready" && row.tracking_number && pdfUrl) {
    return {
      outcome: "reuse_ready",
      trackingNumber: row.tracking_number,
      pdfUrl,
      labelStatus: "ready",
      providerParcelId,
    };
  }
  if (decision.action === "reuse_provider") {
    return {
      outcome: "reuse_provider",
      providerParcelId: decision.providerParcelId,
    };
  }
  if (decision.action === "wait_in_flight") {
    return { outcome: "in_flight" };
  }
  return { outcome: "claimed" };
}

/**
 * MEDIUM #7 — server-side claim before Sendcloud announce.
 * Uses unique(shipping_labels_v1.shipment_parcel_id) so concurrent POSTs
 * cannot both open a new provider label for the same parcel.
 */
export async function claimLabelGenerationAttempt(input: {
  shippingRecordId: string;
  parcelId: string;
  parcelNumber: number;
  totalParcels: number;
  carrier?: string | null;
}): Promise<LabelGenerationClaimOutcome> {
  const admin = createShippingAdminClient();

  const { data: existing } = await admin
    .from("shipping_labels_v1")
    .select(
      "id, label_status, tracking_number, pdf_storage_path, label_storage_path, label_url, provider_parcel_id",
    )
    .eq("shipment_parcel_id", input.parcelId)
    .maybeSingle();

  if (existing) {
    const mapped = mapClaimRowToOutcome(existing as LabelClaimRow, false);
    if (mapped.outcome !== "claimed") {
      return mapped;
    }
    // void / reclaimable → flip to pending for this attempt
    const { error: reclaimError } = await admin
      .from("shipping_labels_v1")
      .update({
        label_status: "pending",
        carrier: input.carrier?.trim() || "pending",
        parcel_number: input.parcelNumber,
        total_parcels: input.totalParcels,
        updated_at: new Date().toISOString(),
      })
      .eq("id", (existing as LabelClaimRow).id)
      .eq("shipment_parcel_id", input.parcelId);
    if (reclaimError) {
      const { data: raced } = await admin
        .from("shipping_labels_v1")
        .select(
          "id, label_status, tracking_number, pdf_storage_path, label_storage_path, label_url, provider_parcel_id",
        )
        .eq("shipment_parcel_id", input.parcelId)
        .maybeSingle();
      if (raced) return mapClaimRowToOutcome(raced as LabelClaimRow, false);
      return { outcome: "in_flight" };
    }
    return { outcome: "claimed" };
  }

  const { error: insertError } = await admin.from("shipping_labels_v1").insert({
    shipping_record_id: input.shippingRecordId,
    shipment_parcel_id: input.parcelId,
    provider: "sendcloud",
    parcel_number: input.parcelNumber,
    total_parcels: input.totalParcels,
    carrier: input.carrier?.trim() || "pending",
    label_status: "pending",
    updated_at: new Date().toISOString(),
  });

  if (!insertError) {
    return { outcome: "claimed" };
  }

  // Unique race — peer won the claim; interpret their row.
  const { data: raced } = await admin
    .from("shipping_labels_v1")
    .select(
      "id, label_status, tracking_number, pdf_storage_path, label_storage_path, label_url, provider_parcel_id",
    )
    .eq("shipment_parcel_id", input.parcelId)
    .maybeSingle();

  if (!raced) {
    return { outcome: "in_flight" };
  }
  return mapClaimRowToOutcome(raced as LabelClaimRow, false);
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

  if (error || !data) {
    // MEDIUM #7 — concurrent first-create: unique(shipping_record_id, parcel_number)
    // → re-read the winner instead of returning null (no duplicate parcel).
    if (isUniqueViolation(error)) {
      const raced = await listShipmentParcelsForOrder(input.orderId);
      const exact = raced.find((parcel) => parcel.parcelNumber === nextNumber);
      if (exact) return exact;
      if (raced.length === 1) return raced[0]!;
      const preparing = raced.find((parcel) => parcel.status === "preparing");
      return preparing ?? raced[0] ?? null;
    }
    return null;
  }

  await renumberParcels(record.id);
  return getShipmentParcelById((data as ParcelRow).id);
}

/**
 * Append one parcel. next = max(parcel_number)+1.
 * Never calls renumberParcels. Never updates existing parcel rows.
 *
 * MEDIUM #7 — recovery / multi-carrier only. Requires explicit authorization.
 * Simple label retries must never call this.
 */
export async function appendShipmentParcelWithoutRenumbering(input: {
  orderId: string;
  /** Must be true — recovery / multi-carrier only. Retries must not set this. */
  authorizeRecoveryParcelAttempt: true;
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
  if (!isRecoveryParcelAttemptAuthorized(input.authorizeRecoveryParcelAttempt)) {
    return null;
  }

  const record = await ensureShippingRecord({ orderId: input.orderId });
  if (!record) return null;

  const admin = createShippingAdminClient();
  const { data: existing } = await admin
    .from("shipment_parcels")
    .select("id, parcel_number")
    .eq("shipping_record_id", record.id)
    .order("parcel_number", { ascending: true });

  const existingRows =
    (existing as Array<{ id: string; parcel_number: number }> | null) ?? [];
  const nextNumber = nextAppendParcelNumber(
    existingRows.map((row) => row.parcel_number),
  );

  const { data, error } = await admin
    .from("shipment_parcels")
    .insert({
      shipping_record_id: record.id,
      parcel_number: nextNumber,
      total_parcels: nextNumber,
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
  providerParcelId?: number | null;
  label: {
    trackingNumber: string | null;
    carrier: string;
    pdfUrl: string | null;
    labelUrl: string | null;
    status: ShipmentParcelLabel["status"];
  };
  /** Ignored — column retained for history; new writes must not stamp a label fee. */
  internalPlatformFeePence?: number;
}): Promise<ShipmentParcel | null> {
  void input.internalPlatformFeePence;
  const parcel = await getShipmentParcelById(input.parcelId);
  if (!parcel) return null;

  const admin = createShippingAdminClient();
  const labelPayload = {
    shipping_record_id: input.shippingRecordId,
    shipment_parcel_id: input.parcelId,
    provider: input.providerId ?? "sendcloud",
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
    provider_parcel_id:
      input.providerParcelId != null && input.providerParcelId > 0
        ? String(input.providerParcelId)
        : null,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await admin
    .from("shipping_labels_v1")
    .select("id")
    .eq("shipment_parcel_id", input.parcelId)
    .maybeSingle();

  if ((existing as { id?: string } | null)?.id) {
    const { error } = await admin
      .from("shipping_labels_v1")
      .update(labelPayload)
      .eq("shipment_parcel_id", input.parcelId);
    if (error) {
      console.error("[shipping] attachLabelToParcel update failed:", error.message);
      throw new Error(`Failed to update shipping label: ${error.message}`);
    }
  } else {
    const { error } = await admin.from("shipping_labels_v1").insert(labelPayload);
    if (error) {
      console.error("[shipping] attachLabelToParcel insert failed:", error.message);
      throw new Error(`Failed to save shipping label: ${error.message}`);
    }
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
