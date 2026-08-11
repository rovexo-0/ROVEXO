/**
 * P6.2 — Persist Owner-confirmed V3 shipping_option_code onto RVX8343A7C7
 * shipping_quotes.quote_payload only.
 *
 * Fail closed unless order + selected quote + quote row match sendcloud:27227.
 * Never: Sendcloud shipment/announce/label · payment · order amount · other orders.
 */

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createShippingAdminClient } from "@/lib/shipping/db-client";
import { RVX8343A7C7_V3_QUOTE_PERSIST_V1 } from "@/lib/orders/rvx8343a7c7-v3-quote-persist-v1";
import {
  isConfirmedSendcloudV3ShippingOptionCode,
  resolveShippingQuoteApiVersion,
} from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import type { ShippingQuotePayload } from "@/lib/shipping/types";
import type { ShippingSetupStatus } from "@/lib/shipping/shipping-setup-status-v1";

const LOCK = RVX8343A7C7_V3_QUOTE_PERSIST_V1;

export type PersistRvx8343a7c7V3QuoteResult =
  | {
      ok: true;
      orderId: string;
      orderNumber: string;
      legacyQuoteId: typeof LOCK.legacyQuoteId;
      shippingOptionCode: typeof LOCK.confirmedShippingOptionCode;
      quotePayloadPersisted: true;
      shippingQuoteRowId: string;
      shippingRecordId: string;
      shippingSetupStatus: ShippingSetupStatus | null;
      idempotent: boolean;
      sendcloudCalled: false;
      shipmentCreated: false;
      labelCreated: false;
      paymentMutated: false;
      orderAmountMutated: false;
      otherOrdersMutated: false;
      mutations: string[];
    }
  | {
      ok: false;
      orderId: string;
      orderNumber?: string;
      error: string;
      sendcloudCalled: false;
      shipmentCreated: false;
      labelCreated: false;
      paymentMutated: false;
      orderAmountMutated: false;
      otherOrdersMutated: false;
    };

function asPayload(raw: unknown): ShippingQuotePayload | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as ShippingQuotePayload;
}

function quoteMatchesLegacy(row: {
  quote_payload?: unknown;
  id?: string;
}): boolean {
  const payload = asPayload(row.quote_payload);
  if (payload?.externalQuoteId === LOCK.legacyQuoteId) return true;
  if (row.id === LOCK.legacyQuoteId) return true;
  return false;
}

/**
 * Surgical persist: UPDATE shipping_quotes.quote_payload.shippingOptionCode only
 * for the locked RVX8343A7C7 / sendcloud:27227 quote row.
 */
export async function persistRvx8343a7c7ConfirmedV3ShippingOption(): Promise<PersistRvx8343a7c7V3QuoteResult> {
  const fail = (error: string, orderNumber?: string): PersistRvx8343a7c7V3QuoteResult => ({
    ok: false,
    orderId: LOCK.orderId,
    ...(orderNumber ? { orderNumber } : {}),
    error,
    sendcloudCalled: false,
    shipmentCreated: false,
    labelCreated: false,
    paymentMutated: false,
    orderAmountMutated: false,
    otherOrdersMutated: false,
  });

  if (
    !isConfirmedSendcloudV3ShippingOptionCode(
      LOCK.confirmedShippingOptionCode,
      LOCK.v2MethodId,
    )
  ) {
    return fail("Locked confirmedShippingOptionCode failed V3 identity validation.");
  }

  const admin = createAdminClient();
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, order_number, selected_shipping_quote_id, shipping_setup_status")
    .eq("id", LOCK.orderId)
    .maybeSingle();

  if (orderError) {
    return fail(`Order lookup failed: ${orderError.message}`);
  }
  if (!order) {
    return fail("Order not found.");
  }
  if (order.id !== LOCK.orderId) {
    return fail("Order ID mismatch.");
  }
  if (order.order_number !== LOCK.orderNumber) {
    return fail(
      `Order number mismatch: expected ${LOCK.orderNumber}, got ${String(order.order_number)}.`,
      String(order.order_number ?? ""),
    );
  }
  if (order.selected_shipping_quote_id !== LOCK.legacyQuoteId) {
    return fail(
      `selected_shipping_quote_id must be ${LOCK.legacyQuoteId}; got ${String(order.selected_shipping_quote_id)}.`,
      LOCK.orderNumber,
    );
  }

  const shipping = createShippingAdminClient();
  const { data: recordRaw, error: recordError } = await shipping
    .from("shipping_records")
    .select("*")
    .eq("order_id", LOCK.orderId)
    .maybeSingle();

  if (recordError) {
    return fail(`shipping_records lookup failed: ${recordError.message}`, LOCK.orderNumber);
  }
  if (!recordRaw || typeof recordRaw !== "object") {
    return fail("shipping_records row missing for RVX8343A7C7.", LOCK.orderNumber);
  }

  const record = recordRaw as {
    id: string;
    order_id: string;
    selected_quote_id: string | null;
  };

  if (record.order_id !== LOCK.orderId) {
    return fail("shipping_records.order_id mismatch.", LOCK.orderNumber);
  }
  if (record.selected_quote_id && record.selected_quote_id !== LOCK.legacyQuoteId) {
    return fail(
      `shipping_records.selected_quote_id must be ${LOCK.legacyQuoteId}; got ${record.selected_quote_id}.`,
      LOCK.orderNumber,
    );
  }

  const { data: quotesRaw, error: quotesError } = await shipping
    .from("shipping_quotes")
    .select("*")
    .eq("shipping_record_id", record.id)
    .order("created_at", { ascending: false });

  if (quotesError) {
    return fail(`shipping_quotes lookup failed: ${quotesError.message}`, LOCK.orderNumber);
  }

  const quotes = Array.isArray(quotesRaw) ? quotesRaw : [];
  const matches = quotes.filter((q) =>
    quoteMatchesLegacy(q as { quote_payload?: unknown; id?: string }),
  );

  if (matches.length === 0) {
    return fail(
      `No shipping_quotes row for ${LOCK.legacyQuoteId} on RVX8343A7C7.`,
      LOCK.orderNumber,
    );
  }
  if (matches.length > 1) {
    return fail(
      `Ambiguous shipping_quotes rows for ${LOCK.legacyQuoteId} (${matches.length}).`,
      LOCK.orderNumber,
    );
  }

  const quoteRow = matches[0] as {
    id: string;
    quote_payload?: unknown;
    price_pence?: number;
  };
  const existingPayload = asPayload(quoteRow.quote_payload) ?? {
    externalQuoteId: LOCK.legacyQuoteId,
  };

  if (
    existingPayload.externalQuoteId &&
    existingPayload.externalQuoteId !== LOCK.legacyQuoteId
  ) {
    return fail(
      `quote_payload.externalQuoteId mismatch: ${existingPayload.externalQuoteId}.`,
      LOCK.orderNumber,
    );
  }

  const existingCode =
    typeof existingPayload.shippingOptionCode === "string"
      ? existingPayload.shippingOptionCode.trim()
      : null;

  if (
    existingCode &&
    existingCode !== LOCK.confirmedShippingOptionCode &&
    isConfirmedSendcloudV3ShippingOptionCode(existingCode, LOCK.v2MethodId)
  ) {
    return fail(
      `Existing shippingOptionCode differs from Owner-confirmed lock (${existingCode}). Fail closed.`,
      LOCK.orderNumber,
    );
  }

  if (existingCode === LOCK.confirmedShippingOptionCode) {
    return {
      ok: true,
      orderId: LOCK.orderId,
      orderNumber: LOCK.orderNumber,
      legacyQuoteId: LOCK.legacyQuoteId,
      shippingOptionCode: LOCK.confirmedShippingOptionCode,
      quotePayloadPersisted: true,
      shippingQuoteRowId: quoteRow.id,
      shippingRecordId: record.id,
      shippingSetupStatus: (order.shipping_setup_status as ShippingSetupStatus | null) ?? null,
      idempotent: true,
      sendcloudCalled: false,
      shipmentCreated: false,
      labelCreated: false,
      paymentMutated: false,
      orderAmountMutated: false,
      otherOrdersMutated: false,
      mutations: [],
    };
  }

  const nextPayload: ShippingQuotePayload = {
    ...existingPayload,
    externalQuoteId: LOCK.legacyQuoteId,
    v2MethodId: LOCK.v2MethodId,
    shippingOptionCode: LOCK.confirmedShippingOptionCode,
    quoteApiVersion: resolveShippingQuoteApiVersion({
      shippingOptionCode: LOCK.confirmedShippingOptionCode,
      v2MethodId: LOCK.v2MethodId,
    }),
  };

  const { error: updateError } = await shipping
    .from("shipping_quotes")
    .update({ quote_payload: nextPayload })
    .eq("id", quoteRow.id)
    .eq("shipping_record_id", record.id);

  if (updateError) {
    return fail(`quote_payload update failed: ${updateError.message}`, LOCK.orderNumber);
  }

  // Re-read to confirm persist (fail closed if mismatch).
  const { data: verifyRaw, error: verifyError } = await shipping
    .from("shipping_quotes")
    .select("id, quote_payload")
    .eq("id", quoteRow.id)
    .maybeSingle();

  if (verifyError || !verifyRaw) {
    return fail("Post-update quote verification failed.", LOCK.orderNumber);
  }

  const verified = asPayload((verifyRaw as { quote_payload?: unknown }).quote_payload);
  if (verified?.shippingOptionCode !== LOCK.confirmedShippingOptionCode) {
    return fail(
      "Post-update shippingOptionCode does not match Owner-confirmed lock.",
      LOCK.orderNumber,
    );
  }
  if (verified.externalQuoteId !== LOCK.legacyQuoteId) {
    return fail("Post-update externalQuoteId corrupted.", LOCK.orderNumber);
  }

  return {
    ok: true,
    orderId: LOCK.orderId,
    orderNumber: LOCK.orderNumber,
    legacyQuoteId: LOCK.legacyQuoteId,
    shippingOptionCode: LOCK.confirmedShippingOptionCode,
    quotePayloadPersisted: true,
    shippingQuoteRowId: quoteRow.id,
    shippingRecordId: record.id,
    shippingSetupStatus: (order.shipping_setup_status as ShippingSetupStatus | null) ?? null,
    idempotent: false,
    sendcloudCalled: false,
    shipmentCreated: false,
    labelCreated: false,
    paymentMutated: false,
    orderAmountMutated: false,
    otherOrdersMutated: false,
    mutations: [
      `shipping_quotes.id=${quoteRow.id}.quote_payload.shippingOptionCode=${LOCK.confirmedShippingOptionCode}`,
    ],
  };
}
