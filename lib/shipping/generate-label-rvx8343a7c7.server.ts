/**
 * P7 — Controlled label generation for RVX8343A7C7 only.
 * Preflight fail-closed, then ONE call to canonical generateShippingLabelForOrder.
 * Never: compat rediscovery · persist endpoint · other orders · payment mutation.
 * P7.1: truthful sendcloudCalled / sendcloudHttpStatus — never invent status codes.
 */

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createShippingAdminClient } from "@/lib/shipping/db-client";
import { getShippingRecord } from "@/lib/shipping/store";
import { listShipmentParcelsForOrder } from "@/lib/shipping/parcels-repository";
import { generateShippingLabelForOrder } from "@/lib/shipping/label-generation.server";
import { RVX8343A7C7_CONTROLLED_LABEL_V1 } from "@/lib/orders/rvx8343a7c7-controlled-label-v1";
import { isShippingSetupReady } from "@/lib/shipping/shipping-setup-status-v1";
import type { ShippingLabelFailureKind } from "@/lib/shipping/pricing/provider";
import type { ShippingQuotePayload } from "@/lib/shipping/types";
import {
  providerFailureFromUnknownError,
  sanitizeProviderFailureMessage,
} from "@/lib/shipping/pricing/label-provider-failure-v1";

const LOCK = RVX8343A7C7_CONTROLLED_LABEL_V1;

export type ControlledLabelRvx8343a7c7Result = {
  ok: boolean;
  status:
    | "label_ready"
    | "idempotent_existing"
    | "preflight_blocked"
    | "label_failed"
    | "sendcloud_rejected";
  orderId: string;
  orderNumber: string;
  shippingSetupStatus: string | null;
  shippingOptionCode: string | null;
  shippingRecordId: string | null;
  shippingQuoteRowId: string | null;
  sendcloudCalled: boolean;
  sendcloudHttpStatus: number | null;
  failureKind: ShippingLabelFailureKind | null;
  /** Sanitized original Sendcloud response body when present (P7.2.1). */
  providerDetails: unknown | null;
  shipmentCreated: boolean;
  parcelCreatedExternally: boolean;
  labelCreated: boolean;
  shipmentId: string | number | null;
  parcelId: string | null;
  labelId: string | null;
  trackingNumber: string | null;
  idempotent: boolean;
  duplicateShipmentPrevented: boolean;
  orderAmountMutated: false;
  paymentMutated: false;
  otherOrdersMutated: false;
  error?: string;
  preflightFailures?: string[];
};

function asPayload(raw: unknown): ShippingQuotePayload | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as ShippingQuotePayload;
}

export async function generateControlledLabelForRvx8343a7c7(): Promise<ControlledLabelRvx8343a7c7Result> {
  const base = {
    orderId: LOCK.orderId,
    orderNumber: LOCK.orderNumber,
    orderAmountMutated: false as const,
    paymentMutated: false as const,
    otherOrdersMutated: false as const,
  };

  const admin = createAdminClient();
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, order_number, seller_id, selected_shipping_quote_id, shipping_setup_status, status")
    .eq("id", LOCK.orderId)
    .maybeSingle();

  const failures: string[] = [];

  if (orderError) failures.push(`order_lookup: ${orderError.message}`);
  if (!order) failures.push("order_missing");
  if (order && order.id !== LOCK.orderId) failures.push("order_id_mismatch");
  if (order && order.order_number !== LOCK.orderNumber) {
    failures.push(`order_number_mismatch:${String(order.order_number)}`);
  }
  if (order && order.selected_shipping_quote_id !== LOCK.legacyQuoteId) {
    failures.push(
      `selected_quote_mismatch:${String(order.selected_shipping_quote_id)}`,
    );
  }
  if (order && !isShippingSetupReady(order.shipping_setup_status)) {
    failures.push(`shipping_setup_status:${String(order.shipping_setup_status)}`);
  }
  if (order && (order.status === "cancelled" || order.status === "awaiting_payment")) {
    failures.push(`order_status:${String(order.status)}`);
  }
  if (order && !order.seller_id) failures.push("seller_id_missing");

  const record = await getShippingRecord(LOCK.orderId);
  if (!record) failures.push("shipping_record_missing");
  if (record && record.id !== LOCK.expectedShippingRecordId) {
    // Soft mismatch still blocks — Owner verified exact id.
    failures.push(`shipping_record_id_mismatch:${record.id}`);
  }

  const shipping = createShippingAdminClient();
  let quoteRowId: string | null = null;
  let persistedCode: string | null = null;

  if (record) {
    const { data: quotesRaw } = await shipping
      .from("shipping_quotes")
      .select("id, quote_payload")
      .eq("shipping_record_id", record.id);

    const quotes = Array.isArray(quotesRaw) ? quotesRaw : [];
    const match = quotes.find((q) => {
      const row = q as { id?: string; quote_payload?: unknown };
      const payload = asPayload(row.quote_payload);
      return (
        row.id === LOCK.expectedShippingQuoteRowId ||
        payload?.externalQuoteId === LOCK.legacyQuoteId
      );
    }) as { id?: string; quote_payload?: unknown } | undefined;

    if (!match?.id) {
      failures.push("shipping_quote_missing");
    } else {
      quoteRowId = match.id;
      if (match.id !== LOCK.expectedShippingQuoteRowId) {
        failures.push(`shipping_quote_row_id_mismatch:${match.id}`);
      }
      const payload = asPayload(match.quote_payload);
      persistedCode =
        typeof payload?.shippingOptionCode === "string"
          ? payload.shippingOptionCode.trim()
          : null;
      if (persistedCode !== LOCK.confirmedShippingOptionCode) {
        failures.push(
          `shipping_option_code_mismatch:${persistedCode ?? "null"}`,
        );
      }
      if (!payload) failures.push("quote_payload_missing");
    }

    const selectedFromRecord = record.pricing?.quotes?.find(
      (q) => q.id === LOCK.legacyQuoteId || q.id === record.pricing?.selectedQuoteId,
    );
    const codeFromRecord = selectedFromRecord?.shippingOptionCode?.trim() ?? null;
    if (
      codeFromRecord &&
      codeFromRecord !== LOCK.confirmedShippingOptionCode
    ) {
      failures.push(`record_quote_code_mismatch:${codeFromRecord}`);
    }
  }

  // Idempotency: existing ready label → return without Sendcloud.
  const parcels = await listShipmentParcelsForOrder(LOCK.orderId);
  const readyParcel = parcels.find(
    (p) =>
      p.label?.status === "ready" &&
      Boolean(p.trackingNumber) &&
      Boolean(p.label?.pdfUrl),
  );

  if (readyParcel && failures.length === 0) {
    return {
      ...base,
      ok: true,
      status: "idempotent_existing",
      shippingSetupStatus: String(order?.shipping_setup_status ?? "ready"),
      shippingOptionCode: LOCK.confirmedShippingOptionCode,
      shippingRecordId: record?.id ?? null,
      shippingQuoteRowId: quoteRowId,
      sendcloudCalled: false,
      sendcloudHttpStatus: null,
      failureKind: null,
      providerDetails: null,
      shipmentCreated: false,
      parcelCreatedExternally: false,
      labelCreated: false,
      shipmentId: null,
      parcelId: readyParcel.id,
      labelId: null,
      trackingNumber: readyParcel.trackingNumber,
      idempotent: true,
      duplicateShipmentPrevented: true,
    };
  }

  if (failures.length > 0) {
    return {
      ...base,
      ok: false,
      status: "preflight_blocked",
      shippingSetupStatus: order?.shipping_setup_status
        ? String(order.shipping_setup_status)
        : null,
      shippingOptionCode: persistedCode,
      shippingRecordId: record?.id ?? null,
      shippingQuoteRowId: quoteRowId,
      sendcloudCalled: false,
      sendcloudHttpStatus: null,
      failureKind: "rovexo_validation",
      providerDetails: null,
      shipmentCreated: false,
      parcelCreatedExternally: false,
      labelCreated: false,
      shipmentId: null,
      parcelId: null,
      labelId: null,
      trackingNumber: null,
      idempotent: false,
      duplicateShipmentPrevented: false,
      error: "P7_PREFLIGHT_BLOCKED",
      preflightFailures: failures,
    };
  }

  // ONE canonical label attempt — seller_id from order (not Super Admin actor).
  try {
    const result = await generateShippingLabelForOrder(
      LOCK.orderId,
      order!.seller_id as string,
    );

    if (!result.ok) {
      const failure = result.providerFailure;
      const sendcloudCalled = Boolean(failure.providerRequestAttempted);
      const sendcloudHttpStatus =
        typeof failure.statusCode === "number" ? failure.statusCode : null;
      const isHttpReject =
        failure.kind === "provider_http" ||
        (sendcloudHttpStatus != null && sendcloudHttpStatus >= 400);

      return {
        ...base,
        ok: false,
        status: isHttpReject ? "sendcloud_rejected" : "label_failed",
        shippingSetupStatus: String(order!.shipping_setup_status),
        shippingOptionCode: LOCK.confirmedShippingOptionCode,
        shippingRecordId: record!.id,
        shippingQuoteRowId: quoteRowId,
        sendcloudCalled,
        sendcloudHttpStatus,
        failureKind: failure.kind,
        providerDetails: failure.providerDetails ?? null,
        shipmentCreated: false,
        parcelCreatedExternally: false,
        labelCreated: false,
        shipmentId: null,
        parcelId: null,
        labelId: null,
        trackingNumber: null,
        idempotent: false,
        duplicateShipmentPrevented: false,
        error: sanitizeProviderFailureMessage(result.error || failure.message),
      };
    }

    const idempotent = Boolean(result.idempotent);
    return {
      ...base,
      ok: true,
      status: idempotent ? "idempotent_existing" : "label_ready",
      shippingSetupStatus: String(order!.shipping_setup_status),
      shippingOptionCode: LOCK.confirmedShippingOptionCode,
      shippingRecordId: record!.id,
      shippingQuoteRowId: quoteRowId,
      // Do not invent provider HTTP status on success — announce status is not captured here.
      sendcloudCalled: !idempotent,
      sendcloudHttpStatus: null,
      failureKind: null,
      providerDetails: null,
      shipmentCreated: !idempotent,
      parcelCreatedExternally: !idempotent,
      labelCreated: !idempotent,
      shipmentId: null,
      parcelId: result.parcel?.id ?? null,
      labelId: null,
      trackingNumber: result.parcel?.trackingNumber ?? null,
      idempotent,
      duplicateShipmentPrevented: idempotent,
    };
  } catch (error) {
    const failure = providerFailureFromUnknownError(error, true, "sendcloud");
    const sendcloudHttpStatus =
      typeof failure.statusCode === "number" ? failure.statusCode : null;
    const isHttpReject =
      failure.kind === "provider_http" ||
      (sendcloudHttpStatus != null && sendcloudHttpStatus >= 400);

    return {
      ...base,
      ok: false,
      status: isHttpReject ? "sendcloud_rejected" : "label_failed",
      shippingSetupStatus: String(order!.shipping_setup_status),
      shippingOptionCode: LOCK.confirmedShippingOptionCode,
      shippingRecordId: record!.id,
      shippingQuoteRowId: quoteRowId,
      sendcloudCalled: failure.providerRequestAttempted,
      sendcloudHttpStatus,
      failureKind: failure.kind,
      providerDetails: failure.providerDetails ?? null,
      shipmentCreated: false,
      parcelCreatedExternally: false,
      labelCreated: false,
      shipmentId: null,
      parcelId: null,
      labelId: null,
      trackingNumber: null,
      idempotent: false,
      duplicateShipmentPrevented: false,
      error: failure.message,
    };
  }
}
