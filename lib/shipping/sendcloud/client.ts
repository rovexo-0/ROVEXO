import "server-only";

import {
  getSendcloudBaseUrl,
  getSendcloudPublicKey,
  getSendcloudSecretKey,
  getSendcloudV3BaseUrl,
} from "@/lib/shipping/env";
import {
  normalizeCountryCode,
  parcelSpecFromTier,
} from "@/lib/shipping/pricing/sendcloud-mappers";
import { SendcloudError } from "@/lib/shipping/sendcloud/errors";
import type {
  SendcloudHealthResult,
  SendcloudParcelResponse,
  SendcloudShippingMethod,
} from "@/lib/shipping/sendcloud/types";
import {
  SENDCLOUD_V3_OPTION_DIAGNOSTIC_29631_V1,
  buildV3Option29631ForensicReport,
  matchRoyalMailTracked48LargeLetter,
  type SendcloudV3Option29631ForensicReport,
  type SendcloudV3Tracked48LargeLetterMatch,
} from "@/lib/shipping/sendcloud/v3-compat-option-29631-diagnostic-v1";
import {
  SENDCLOUD_V3_SHIPMENTS_ANNOUNCE_PATH,
  type SendcloudV3AnnounceShipmentRequest,
  type SendcloudV3AnnounceShipmentResult,
} from "@/lib/shipping/sendcloud/v3-catalog-types-v1";
import { parseSendcloudV3AnnounceShipmentResult } from "@/lib/shipping/sendcloud/v3-catalog-parsers-v1";
import { getShippingRecord } from "@/lib/shipping/store";
import type { ParcelTier } from "@/lib/shipping/types";
import { buildSendcloudHttpFailureFromBody } from "@/lib/shipping/pricing/label-provider-failure-v1";

/** Bound below router Promise.race (30s) so the underlying fetch is aborted first. */
export const SENDCLOUD_DEFAULT_TIMEOUT_MS = 25_000;

function getAuthHeader(): string {
  const publicKey = getSendcloudPublicKey();
  const secretKey = getSendcloudSecretKey();
  const encoded = Buffer.from(`${publicKey}:${secretKey}`).toString("base64");
  return `Basic ${encoded}`;
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String((error as { name?: unknown }).name) : "";
  return name === "AbortError" || name === "TimeoutError";
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

type SendcloudRequestInit = RequestInit & {
  searchParams?: Record<string, string | number | boolean | undefined>;
  /** Override default request timeout (AbortSignal). */
  timeoutMs?: number;
  /**
   * Conservative GET-only retry. Never enable for POST /parcels or cancel —
   * blind retries can create duplicate parcels.
   */
  retrySafeGet?: boolean;
  /** Override API base URL (defaults to Sendcloud v2). */
  baseUrlOverride?: string;
};

/**
 * Canonical Sendcloud HTTP transport.
 * AbortController timeout aborts the underlying fetch (router Promise.race alone does not).
 */
export async function sendcloudRequest<T>(path: string, init?: SendcloudRequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const maxAttempts = init?.retrySafeGet && method === "GET" ? 2 : 1;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await sendcloudRequestOnce<T>(path, init);
    } catch (error) {
      lastError = error;
      const retryable =
        init?.retrySafeGet &&
        method === "GET" &&
        attempt < maxAttempts &&
        isSendcloudError(error) &&
        (error.code === "timeout" || error.code === "network_error");
      if (!retryable) throw error;
      await sleep(250 * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new SendcloudError("network_error", String(lastError));
}

/** Canonical Sendcloud API v3 HTTP transport (same Basic auth as v2). */
export async function sendcloudV3Request<T>(
  path: string,
  init?: Omit<SendcloudRequestInit, "baseUrlOverride">,
): Promise<T> {
  return sendcloudRequest<T>(path, {
    ...init,
    baseUrlOverride: getSendcloudV3BaseUrl(),
  });
}

export type DiscoverRvxc75ca5bbV3OptionResult = {
  requestUrlPath: string;
  requestBody: Record<string, unknown>;
  orderId: string;
  orderNumber: string;
  methodId: number;
  selectedQuoteId: string | null;
  selectedServiceName: string | null;
  forensic: SendcloudV3Option29631ForensicReport;
  /** @deprecated Prefer forensic — retained for existing callers/tests. */
  match: SendcloudV3Tracked48LargeLetterMatch;
};

/**
 * Read-only V3 shipping-options discovery for locked RVXC75CA5BB / method 29631.
 * Uses shared catalog fetch (cached) — no shipment/parcel/label.
 * Does not return raw Sendcloud payloads to callers (forensic only).
 */
export async function discoverSendcloudV3OptionForRvxc75ca5bbDiagnostic(): Promise<DiscoverRvxc75ca5bbV3OptionResult> {
  const lock = SENDCLOUD_V3_OPTION_DIAGNOSTIC_29631_V1;
  const record = await getShippingRecord(lock.orderId);
  if (!record) {
    throw new SendcloudError(
      "api_error",
      "Shipping record not found for locked diagnostic order RVXC75CA5BB.",
      { statusCode: 404 },
    );
  }

  const collection = record.collectionAddress;
  const delivery = record.deliveryAddress;
  if (
    !collection?.postcode?.trim() ||
    !delivery?.postcode?.trim() ||
    !collection.country?.trim() ||
    !delivery.country?.trim()
  ) {
    throw new SendcloudError(
      "invalid_address",
      "Persisted collection/delivery address is incomplete for V3 shipping-options discovery.",
      { statusCode: 422 },
    );
  }

  const parcel = record.parcels?.[0] ?? null;
  const tier = (record.parcelTier ?? "small_parcel") as ParcelTier;
  const spec = parcelSpecFromTier(tier, parcel?.weightKg ?? undefined);
  const lengthCm = parcel?.dimensions?.lengthCm ?? spec.lengthCm;
  const widthCm = parcel?.dimensions?.widthCm ?? spec.widthCm;
  const heightCm = parcel?.dimensions?.heightCm ?? spec.heightCm;
  const selectedQuote =
    record.pricing?.quotes?.find((q) => q.id === record.pricing?.selectedQuoteId) ??
    record.pricing?.quotes?.find((q) => q.id === lock.quoteId) ??
    null;

  const requestBody = {
    from_country_code: normalizeCountryCode(collection.country),
    to_country_code: normalizeCountryCode(delivery.country),
    from_postal_code: collection.postcode.replace(/\s+/g, "").toUpperCase(),
    to_postal_code: delivery.postcode.replace(/\s+/g, "").toUpperCase(),
    carrier_code: lock.targetCarrierCode,
    calculate_quotes: true,
    parcels: [
      {
        weight: { value: String(spec.weightKg), unit: "kg" },
        dimensions: {
          length: String(lengthCm),
          width: String(widthCm),
          height: String(heightCm),
          unit: "cm",
        },
      },
    ],
  };

  const { fetchSendcloudV3ShippingOptionsCatalog } = await import(
    "@/lib/shipping/sendcloud/v3-catalog-v1"
  );
  const raw = await fetchSendcloudV3ShippingOptionsCatalog({
    fromCountryCode: normalizeCountryCode(collection.country),
    toCountryCode: normalizeCountryCode(delivery.country),
    fromPostalCode: collection.postcode,
    toPostalCode: delivery.postcode,
    parcelTier: tier,
    weightKg: spec.weightKg,
    lengthCm,
    widthCm,
    heightCm,
    carrierCode: lock.targetCarrierCode,
    calculateQuotes: true,
  });

  const forensic = buildV3Option29631ForensicReport(raw);

  return {
    forensic,
    match: matchRoyalMailTracked48LargeLetter(raw),
    requestUrlPath: lock.path,
    requestBody,
    orderId: lock.orderId,
    orderNumber: lock.orderNumber,
    methodId: lock.methodId,
    selectedQuoteId: record.pricing?.selectedQuoteId ?? null,
    selectedServiceName: selectedQuote?.serviceName ?? null,
  };
}

async function sendcloudRequestOnce<T>(path: string, init?: SendcloudRequestInit): Promise<T> {
  const baseUrl = init?.baseUrlOverride ?? getSendcloudBaseUrl();
  const url = new URL(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`);

  if (init?.searchParams) {
    for (const [key, value] of Object.entries(init.searchParams)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const timeoutMs = init?.timeoutMs ?? SENDCLOUD_DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const callerSignal = init?.signal;
  const onCallerAbort = () => controller.abort();
  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort();
    } else {
      callerSignal.addEventListener("abort", onCallerAbort, { once: true });
    }
  }

  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const {
      searchParams: _sp,
      timeoutMs: _t,
      retrySafeGet: _r,
      signal: _s,
      baseUrlOverride: _b,
      ...fetchInit
    } = init ?? {};
    const response = await fetch(url.toString(), {
      ...fetchInit,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: getAuthHeader(),
        ...(init?.headers ?? {}),
      },
    });

    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text) as unknown;
      } catch {
        body = text;
      }
    }

    if (!response.ok) {
      // P7.2.1: preserve original provider body; never invent a fake provider message.
      const { message } = buildSendcloudHttpFailureFromBody(body);
      throw new SendcloudError("api_error", message, {
        statusCode: response.status,
        details: body,
      });
    }

    return body as T;
  } catch (error) {
    if (error instanceof SendcloudError) throw error;

    if (isAbortError(error) || controller.signal.aborted) {
      if (callerSignal?.aborted) {
        throw new SendcloudError("network_error", "Sendcloud request aborted", { statusCode: 499 });
      }
      throw new SendcloudError("timeout", `Sendcloud request timed out after ${timeoutMs}ms`, {
        statusCode: 408,
      });
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new SendcloudError("network_error", `Sendcloud network error: ${message}`);
  } finally {
    clearTimeout(timeoutId);
    callerSignal?.removeEventListener("abort", onCallerAbort);
  }
}

function isSendcloudError(error: unknown): error is SendcloudError {
  return error instanceof SendcloudError;
}

export async function checkSendcloudApiHealth(): Promise<SendcloudHealthResult> {
  const started = Date.now();
  try {
    await listSendcloudShippingMethods({ toCountry: "GB", toPostalCode: "SW1A 1AA", fromPostalCode: "SW1A 2AA" });
    return {
      configured: true,
      status: "healthy",
      latencyMs: Date.now() - started,
      baseUrl: getSendcloudBaseUrl(),
    };
  } catch (error) {
    return {
      configured: true,
      status: "unhealthy",
      latencyMs: Date.now() - started,
      message: error instanceof Error ? error.message : String(error),
      baseUrl: getSendcloudBaseUrl(),
    };
  }
}

/**
 * GET /shipping_methods — supported query params per Sendcloud OpenAPI v2:
 * sender_address, service_point_id, is_return, from_postal_code, to_postal_code, to_country, cursor, limit.
 * Weight/dimensions are NOT request parameters on this endpoint; callers filter locally by min_weight/max_weight.
 */
export async function listSendcloudShippingMethods(input: {
  toCountry: string;
  toPostalCode: string;
  fromPostalCode: string;
  isReturn?: boolean;
}): Promise<SendcloudShippingMethod[]> {
  const response = await sendcloudRequest<{ shipping_methods?: SendcloudShippingMethod[] }>(
    "/shipping_methods",
    {
      method: "GET",
      retrySafeGet: true,
      searchParams: {
        to_country: input.toCountry,
        to_postal_code: input.toPostalCode,
        from_postal_code: input.fromPostalCode,
        is_return: input.isReturn ?? false,
      },
    },
  );

  return response.shipping_methods ?? [];
}

/**
 * Parcel create payload — fields verified against Sendcloud API v2 Create Parcel OpenAPI.
 * Idempotency: `external_reference` (unique) — not an HTTP idempotency header.
 * Sender: `from_*` fields and/or `sender_address` id; omit only when using Sendcloud default sender.
 */
export type SendcloudParcelCreatePayload = {
  name: string;
  company_name?: string;
  address: string;
  house_number: string;
  city: string;
  postal_code: string;
  country: string;
  telephone?: string;
  email?: string;
  request_label: boolean;
  shipment: { id: number };
  weight: string;
  order_number?: string;
  reference?: string;
  /** Official unique idempotence field (Sendcloud FAQ / OpenAPI). */
  external_reference?: string;
  length?: string;
  width?: string;
  height?: string;
  total_order_value?: string;
  total_order_value_currency?: string;
  from_name?: string;
  from_company_name?: string;
  from_address_1?: string;
  from_address_2?: string;
  from_house_number?: string;
  from_city?: string;
  from_postal_code?: string;
  from_country?: string;
  from_telephone?: string;
  from_email?: string;
  sender_address?: number;
};

/** In-process lock: one ROVEXO idempotency key → one in-flight Sendcloud POST /parcels. */
const parcelCreateInflight = new Map<string, Promise<SendcloudParcelResponse>>();

export async function createSendcloudParcel(
  parcel: SendcloudParcelCreatePayload,
): Promise<SendcloudParcelResponse> {
  const lockKey = parcel.external_reference?.trim() || null;

  const run = async (): Promise<SendcloudParcelResponse> => {
    // POST /parcels — no automatic retry (duplicate parcel risk).
    const response = await sendcloudRequest<{
      parcel?: SendcloudParcelResponse;
      failed_parcels?: Array<{ parcel?: SendcloudParcelResponse; errors?: unknown }>;
    }>("/parcels", {
      method: "POST",
      body: JSON.stringify({ parcel }),
    });

    if (response.failed_parcels?.length) {
      const firstError = response.failed_parcels[0]?.errors;
      throw new SendcloudError(
        "label_failed",
        typeof firstError === "string" ? firstError : "Sendcloud failed to create parcel",
        { details: response.failed_parcels },
      );
    }

    if (!response.parcel) {
      throw new SendcloudError("label_failed", "Sendcloud returned no parcel in response");
    }

    return response.parcel;
  };

  if (!lockKey) {
    return run();
  }

  const existing = parcelCreateInflight.get(lockKey);
  if (existing) {
    return existing;
  }

  const promise = run().finally(() => {
    parcelCreateInflight.delete(lockKey);
  });
  parcelCreateInflight.set(lockKey, promise);
  return promise;
}

export async function getSendcloudParcel(parcelId: number): Promise<SendcloudParcelResponse> {
  const response = await sendcloudRequest<{ parcel: SendcloudParcelResponse }>(`/parcels/${parcelId}`, {
    method: "GET",
    retrySafeGet: true,
  });
  return response.parcel;
}

export async function getSendcloudTracking(trackingNumber: string): Promise<SendcloudParcelResponse | null> {
  const response = await sendcloudRequest<{ parcels?: SendcloudParcelResponse[] }>("/parcels", {
    method: "GET",
    retrySafeGet: true,
    searchParams: { tracking_number: trackingNumber },
  });

  return response.parcels?.[0] ?? null;
}

/** POST /parcels/{id}/cancel — no blind automatic retries (not idempotency-guaranteed across all states). */
export async function cancelSendcloudParcel(parcelId: number): Promise<void> {
  await sendcloudRequest<{ status?: string; message?: string }>(`/parcels/${parcelId}/cancel`, {
    method: "POST",
  });
}

/** In-process lock: one ROVEXO external_reference_id → one in-flight V3 announce. */
const v3AnnounceInflight = new Map<string, Promise<SendcloudV3AnnounceShipmentResult>>();

/**
 * POST /shipments/announce — synchronous create+announce.
 * HTTP 409 → safe reuse of existing shipment (never create a second blindly).
 * Never calls V2 /parcels.
 */
export async function announceSendcloudShipmentV3(
  payload: SendcloudV3AnnounceShipmentRequest,
): Promise<SendcloudV3AnnounceShipmentResult> {
  const lockKey = payload.external_reference_id?.trim() || null;

  const run = async (): Promise<SendcloudV3AnnounceShipmentResult> => {
    try {
      const body = await sendcloudV3Request<unknown>(SENDCLOUD_V3_SHIPMENTS_ANNOUNCE_PATH, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return parseSendcloudV3AnnounceShipmentResult(body, { reusedExisting: false });
    } catch (error) {
      if (isSendcloudError(error) && error.statusCode === 409) {
        return parseSendcloudV3AnnounceShipmentResult(error.details, { reusedExisting: true });
      }
      throw error;
    }
  };

  if (!lockKey) {
    return run();
  }

  const existing = v3AnnounceInflight.get(lockKey);
  if (existing) {
    return existing;
  }

  const promise = run().finally(() => {
    v3AnnounceInflight.delete(lockKey);
  });
  v3AnnounceInflight.set(lockKey, promise);
  return promise;
}
