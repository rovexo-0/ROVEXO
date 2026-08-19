/**
 * Pure V3 catalog parsers + quote identity helpers.
 * No Super Admin / order coupling. Safe for checkout quote enrichment.
 */

import type {
  ShippingQuote,
  ShippingQuoteApiVersion,
  ShippingQuotePayload,
} from "@/lib/shipping/types";
import type {
  SendcloudV3MethodMapping,
  SendcloudV3RouteAwareOptionIdentity,
  SendcloudV3RouteAwareSelection,
} from "@/lib/shipping/sendcloud/v3-catalog-types-v1";
import type { SendcloudV3QuoteMetadata } from "@/lib/shipping/sendcloud/types";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function str(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    if (!t || t.toLowerCase() === "null") return null;
    return t;
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

/**
 * Coerce shipping_quotes.quote_payload (object or JSON string) for hydrate.
 * Never invents fields — only unwraps storage shapes + snake_case aliases.
 * V3 identity validation remains in shippingQuoteFromPayloadRow.
 */
export function coerceShippingQuotePayload(
  raw: unknown,
): ShippingQuotePayload | null {
  if (raw == null) return null;
  let value: unknown = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  const row = asRecord(value);
  if (!row) return null;

  const externalQuoteId =
    str(row.externalQuoteId) ?? str(row.external_quote_id) ?? "";

  const v2Raw = row.v2MethodId ?? row.v2_method_id;
  const v2MethodId =
    typeof v2Raw === "number" && Number.isFinite(v2Raw) && v2Raw > 0
      ? v2Raw
      : undefined;

  const shippingOptionCode =
    str(row.shippingOptionCode) ?? str(row.shipping_option_code) ?? undefined;
  // str() converts numeric JSON contract ids (e.g. 40353) → "40353"
  const contractId = str(row.contractId) ?? str(row.contract_id) ?? undefined;

  const quoteApiVersionRaw = row.quoteApiVersion ?? row.quote_api_version;
  const quoteApiVersion =
    quoteApiVersionRaw === "v2" ||
    quoteApiVersionRaw === "v3" ||
    quoteApiVersionRaw === "v2+v3"
      ? quoteApiVersionRaw
      : undefined;

  return {
    externalQuoteId,
    ...(v2MethodId != null ? { v2MethodId } : {}),
    ...(shippingOptionCode ? { shippingOptionCode } : {}),
    ...(contractId ? { contractId } : {}),
    ...(quoteApiVersion ? { quoteApiVersion } : {}),
  };
}

/**
 * Reject values that are clearly V2 method identities — never treat as V3 codes.
 * Does NOT invent substitutes; only validates confirmed Sendcloud strings.
 */
export function isConfirmedSendcloudV3ShippingOptionCode(
  code: string | null | undefined,
  v2MethodId?: number | null,
): code is string {
  if (code == null) return false;
  const trimmed = code.trim();
  if (!trimmed) return false;
  if (/^\d+$/.test(trimmed)) return false;
  if (/^sendcloud:/i.test(trimmed)) return false;
  if (v2MethodId != null && trimmed === String(v2MethodId)) return false;
  return true;
}

/**
 * Parse official POST /compat/shipping-options response:
 * { data: { "29631": "royal_mail:..." | null } }
 * Never invents codes when null/missing.
 */
export function parseSendcloudV3CompatMappings(
  body: unknown,
  requestedMethodIds: number[],
): Map<number, SendcloudV3MethodMapping> {
  const root = asRecord(body);
  const data = asRecord(root?.data) ?? {};
  const out = new Map<number, SendcloudV3MethodMapping>();

  for (const methodId of requestedMethodIds) {
    const raw = data[String(methodId)];
    const codeRaw = str(raw);
    const confirmed = isConfirmedSendcloudV3ShippingOptionCode(codeRaw, methodId)
      ? codeRaw
      : null;
    out.set(methodId, {
      v2MethodId: methodId,
      shippingOptionCode: confirmed,
      contractId: null,
      result: confirmed ? "MAPPING_CONFIRMED" : "NO_V3_COUNTERPART",
    });
  }

  return out;
}

export function resolveShippingQuoteApiVersion(input: {
  shippingOptionCode?: string | null;
  v2MethodId?: number | null;
}): ShippingQuoteApiVersion {
  const hasV3 = isConfirmedSendcloudV3ShippingOptionCode(
    input.shippingOptionCode,
    input.v2MethodId,
  );
  const hasV2 = input.v2MethodId != null && Number.isFinite(input.v2MethodId) && input.v2MethodId > 0;
  if (hasV3 && hasV2) return "v2+v3";
  if (hasV3) return "v3";
  return "v2";
}

export function buildShippingQuotePayload(quote: ShippingQuote): ShippingQuotePayload {
  const externalQuoteId = String(quote.id);
  const v2MethodId =
    quote.v2MethodId != null && Number.isFinite(quote.v2MethodId) && quote.v2MethodId > 0
      ? quote.v2MethodId
      : undefined;
  const shippingOptionCode = isConfirmedSendcloudV3ShippingOptionCode(
    quote.shippingOptionCode,
    v2MethodId,
  )
    ? quote.shippingOptionCode.trim()
    : undefined;
  const contractId =
    typeof quote.contractId === "string" && quote.contractId.trim()
      ? quote.contractId.trim()
      : undefined;
  const quoteApiVersion =
    quote.quoteApiVersion ??
    resolveShippingQuoteApiVersion({ shippingOptionCode, v2MethodId });

  return {
    externalQuoteId,
    ...(v2MethodId != null ? { v2MethodId } : {}),
    ...(shippingOptionCode ? { shippingOptionCode } : {}),
    ...(contractId ? { contractId } : {}),
    quoteApiVersion,
  };
}

export function shippingQuoteFromPayloadRow(input: {
  id: string;
  providerId: string;
  carrier: string;
  serviceName: string;
  pricePence: number;
  currency: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  recommended: string | null;
  expiresAt: string | null;
  quotePayload?: ShippingQuotePayload | { externalQuoteId?: string } | null | unknown;
}): ShippingQuote {
  const payload = coerceShippingQuotePayload(input.quotePayload ?? null);
  const externalId =
    (payload?.externalQuoteId && payload.externalQuoteId.trim()) || input.id;
  const v2MethodId =
    typeof payload?.v2MethodId === "number" && payload.v2MethodId > 0
      ? payload.v2MethodId
      : undefined;
  const shippingOptionCode = isConfirmedSendcloudV3ShippingOptionCode(
    payload?.shippingOptionCode,
    v2MethodId,
  )
    ? payload!.shippingOptionCode!.trim()
    : undefined;
  // Accept string or numeric JSON contract ids (P7.35 — number was previously dropped).
  const contractId =
    typeof payload?.contractId === "string" && payload.contractId.trim()
      ? payload.contractId.trim()
      : undefined;
  const quoteApiVersion =
    payload?.quoteApiVersion ??
    resolveShippingQuoteApiVersion({ shippingOptionCode, v2MethodId });

  // Preserve DB row UUID when hydrate remaps id → externalQuoteId (P8.5).
  const quoteRowId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.id,
    ) && input.id !== externalId
      ? input.id
      : undefined;

  return {
    id: externalId,
    ...(quoteRowId ? { quoteRowId } : {}),
    providerId: input.providerId,
    carrier: input.carrier,
    serviceName: input.serviceName,
    pricePence: input.pricePence,
    currency: "GBP",
    estimatedDays: { min: input.estimatedDaysMin, max: input.estimatedDaysMax },
    recommended:
      input.recommended === "cheapest" || input.recommended === "fastest"
        ? input.recommended
        : undefined,
    expiresAt: input.expiresAt ?? undefined,
    ...(v2MethodId != null ? { v2MethodId } : {}),
    ...(shippingOptionCode ? { shippingOptionCode } : {}),
    ...(contractId ? { contractId } : {}),
    quoteApiVersion,
  };
}

function extractAnnouncePdfUrl(...documentLists: unknown[]): string | null {
  for (const list of documentLists) {
    if (!Array.isArray(list)) continue;
    let fallback: string | null = null;
    for (const doc of list) {
      const d = asRecord(doc);
      const link = str(d?.link) ?? str(d?.url);
      if (!link) continue;
      const type = str(d?.type)?.toLowerCase();
      if (type === "label") return link;
      if (!fallback) fallback = link;
    }
    if (fallback) return fallback;
  }
  return null;
}

function extractAnnounceTrackingNumber(parcel: Record<string, unknown> | null): string | null {
  if (!parcel) return null;
  const direct =
    str(parcel.tracking_number) ??
    str(parcel.trackingNumber) ??
    str(parcel.tracking_code) ??
    str(parcel.trackingCode);
  if (direct) return direct;
  const nested = asRecord(parcel.tracking);
  return str(nested?.number) ?? str(nested?.code) ?? str(nested?.tracking_number) ?? null;
}

function extractAnnounceParcelId(parcel: Record<string, unknown> | null): number | null {
  if (!parcel) return null;
  const parcelIdRaw = parcel.id ?? parcel.parcel_id ?? parcel.parcelId;
  if (typeof parcelIdRaw === "number" && Number.isFinite(parcelIdRaw) && parcelIdRaw > 0) {
    return parcelIdRaw;
  }
  if (typeof parcelIdRaw === "string" && /^\d+$/.test(parcelIdRaw.trim())) {
    const parsed = Number.parseInt(parcelIdRaw.trim(), 10);
    return parsed > 0 ? parsed : null;
  }
  return null;
}

/**
 * Official V3 sync announce may return HTTP 2xx with carrier announcement failure.
 * Detect errors[] / Announcement Failed / status id 1002 — never treat as label success.
 */
export function extractSendcloudV3AnnounceFailure(body: unknown): {
  message: string;
  details: Record<string, unknown>;
} | null {
  const root = asRecord(body);
  const data = asRecord(root?.data) ?? root;
  const parcels = Array.isArray(data?.parcels) ? (data!.parcels as unknown[]) : [];
  const first = asRecord(parcels[0]);

  const errorList = Array.isArray(data?.errors)
    ? (data!.errors as unknown[])
    : Array.isArray(root?.errors)
      ? (root!.errors as unknown[])
      : [];

  const errorDetails: string[] = [];
  for (const item of errorList) {
    const rec = asRecord(item);
    if (!rec) continue;
    const detail =
      str(rec.detail) ?? str(rec.message) ?? str(rec.title) ?? str(rec.code);
    if (detail) errorDetails.push(detail);
  }

  const statusRec =
    asRecord(first?.status) ?? asRecord(data?.status) ?? asRecord(root?.status);
  const statusIdRaw = statusRec?.id ?? statusRec?.code;
  const statusId =
    typeof statusIdRaw === "number"
      ? statusIdRaw
      : typeof statusIdRaw === "string" && /^\d+$/.test(statusIdRaw.trim())
        ? Number.parseInt(statusIdRaw.trim(), 10)
        : null;
  const statusMessage =
    str(statusRec?.message) ?? str(statusRec?.code) ?? str(statusRec?.name);
  const statusFailed =
    statusId === 1002 ||
    (statusMessage != null &&
      /announcement\s*failed/i.test(statusMessage)) ||
    (typeof statusIdRaw === "string" &&
      /announcement_failed/i.test(statusIdRaw));

  if (!statusFailed && errorDetails.length === 0) return null;

  const message =
    errorDetails[0] ??
    statusMessage ??
    "Sendcloud carrier announcement failed";

  return {
    message,
    details: {
      reason: "ANNOUNCEMENT_FAILED",
      statusId,
      statusMessage,
      errors: errorDetails,
      shipmentId: str(data?.id) ?? str(data?.shipment_id) ?? null,
      parcelId: extractAnnounceParcelId(first),
    },
  };
}

/**
 * Extract tracking + label from V3 announce response (201 or 409 body).
 * Never fabricates URLs or tracking numbers.
 * Tracking / label documents may be absent at announce time (async assignment).
 * Caller must reject extractSendcloudV3AnnounceFailure(...) before treating as success.
 */
export function parseSendcloudV3AnnounceShipmentResult(
  body: unknown,
  options?: { reusedExisting?: boolean },
): {
  shipmentId: string | null;
  parcelId: number | null;
  trackingNumber: string | null;
  pdfUrl: string | null;
  carrierCode: string | null;
  serviceName: string | null;
  reusedExisting: boolean;
} {
  const root = asRecord(body);
  const data = asRecord(root?.data) ?? root;
  const parcels = Array.isArray(data?.parcels) ? (data!.parcels as unknown[]) : [];
  const first = asRecord(parcels[0]);
  const labelObj = asRecord(first?.label);
  const normalPrinter = Array.isArray(labelObj?.normal_printer)
    ? str(labelObj.normal_printer[0])
    : null;
  const labelPrinter = str(labelObj?.label_printer);
  const pdfUrl =
    extractAnnouncePdfUrl(first?.documents, data?.documents, root?.documents) ??
    normalPrinter ??
    labelPrinter ??
    null;

  const trackingNumber = extractAnnounceTrackingNumber(first);
  const parcelId = extractAnnounceParcelId(first);
  const shipmentId = str(data?.id) ?? str(data?.shipment_id) ?? str(data?.shipmentId);
  const shipWith = asRecord(data?.ship_with);
  const props = asRecord(shipWith?.properties);
  const carrier = asRecord(first?.carrier) ?? asRecord(data?.carrier);

  return {
    shipmentId,
    parcelId,
    trackingNumber,
    pdfUrl,
    carrierCode: str(carrier?.code),
    serviceName: str(props?.shipping_option_code) ?? str(data?.shipping_option_code),
    reusedExisting: Boolean(options?.reusedExisting),
  };
}

/**
 * Extract shipping_option_code (+ optional contract.id) from POST /shipping-options.
 * Never invents codes. Never picks substitutes.
 */
export function extractSendcloudV3RouteAwareOptionIdentities(
  body: unknown,
): SendcloudV3RouteAwareOptionIdentity[] {
  const root = asRecord(body);
  const data = Array.isArray(root?.data)
    ? (root!.data as unknown[])
    : Array.isArray(body)
      ? body
      : [];

  const out: SendcloudV3RouteAwareOptionIdentity[] = [];
  const seen = new Set<string>();

  for (const item of data) {
    const o = asRecord(item);
    if (!o) continue;
    const code = str(o.code);
    if (!code || !isConfirmedSendcloudV3ShippingOptionCode(code)) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    const contract = asRecord(o.contract);
    out.push({
      shippingOptionCode: code,
      contractId: str(contract?.id),
    });
  }

  return out;
}

/**
 * Gate one V2→compat identity against route-aware available options.
 * Exact code match only — never substitutes EVRi/DPD/Royal Mail/etc.
 */
export function selectRouteAwareV3OptionForCompatMapping(input: {
  v2MethodId: number;
  compatShippingOptionCode: string | null | undefined;
  availableOptions: SendcloudV3RouteAwareOptionIdentity[];
  /** When true, catalog could not be loaded — strip all V3 codes (fail closed). */
  catalogUnavailable?: boolean;
}): SendcloudV3RouteAwareSelection {
  const compat = isConfirmedSendcloudV3ShippingOptionCode(
    input.compatShippingOptionCode,
    input.v2MethodId,
  )
    ? input.compatShippingOptionCode!.trim()
    : null;

  if (input.catalogUnavailable) {
    return {
      v2MethodId: input.v2MethodId,
      compatShippingOptionCode: compat,
      shippingOptionCode: null,
      contractId: null,
      status: "ROUTE_CATALOG_UNAVAILABLE",
    };
  }

  if (!compat) {
    return {
      v2MethodId: input.v2MethodId,
      compatShippingOptionCode: null,
      shippingOptionCode: null,
      contractId: null,
      status: "NO_V3_COUNTERPART",
    };
  }

  const hit = input.availableOptions.find(
    (opt) => opt.shippingOptionCode === compat,
  );

  if (!hit) {
    return {
      v2MethodId: input.v2MethodId,
      compatShippingOptionCode: compat,
      shippingOptionCode: null,
      contractId: null,
      status: "COMPAT_IDENTITY_FOUND_BUT_ROUTE_UNAVAILABLE",
    };
  }

  return {
    v2MethodId: input.v2MethodId,
    compatShippingOptionCode: compat,
    shippingOptionCode: hit.shippingOptionCode,
    contractId: hit.contractId,
    status: "ROUTE_AWARE_SELECTED",
  };
}

/**
 * Apply route-aware selections onto quote metadata used by mapSendcloudMethodToQuote.
 * Unavailable compat codes are stripped. Callers must not offer those methods
 * as selectable checkout quotes (see isRouteProvenSendcloudQuote).
 */
export function applyRouteAwareSelectionsToQuoteMetadata(
  metadata: Map<number, SendcloudV3QuoteMetadata>,
  selections: Map<number, SendcloudV3RouteAwareSelection>,
): Map<number, SendcloudV3QuoteMetadata> {
  const out = new Map<number, SendcloudV3QuoteMetadata>();

  for (const [methodId] of metadata) {
    const selection = selections.get(methodId);
    if (!selection) {
      out.set(methodId, { v2MethodId: methodId });
      continue;
    }

    const next: SendcloudV3QuoteMetadata = { v2MethodId: methodId };
    if (
      selection.status === "ROUTE_AWARE_SELECTED" &&
      isConfirmedSendcloudV3ShippingOptionCode(selection.shippingOptionCode, methodId)
    ) {
      next.shippingOptionCode = selection.shippingOptionCode;
      if (selection.contractId) {
        next.contractId = selection.contractId;
      }
    }
    out.set(methodId, next);
  }

  return out;
}
