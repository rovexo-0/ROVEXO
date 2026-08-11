import "server-only";

import {
  getSendcloudBaseUrl,
  getSendcloudPublicKey,
  getSendcloudSecretKey,
  getSendcloudV3BaseUrl,
} from "@/lib/shipping/env";
import { SendcloudError } from "@/lib/shipping/sendcloud/errors";
import type {
  SendcloudHealthResult,
  SendcloudParcelResponse,
  SendcloudShippingMethod,
} from "@/lib/shipping/sendcloud/types";
import {
  SENDCLOUD_V3_COMPAT_OPTION_29631_DIAGNOSTIC_V1,
  extractV3CompatMappingFor29631,
  type SendcloudV3CompatOption29631Mapping,
} from "@/lib/shipping/sendcloud/v3-compat-option-29631-diagnostic-v1";

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

/**
 * Read-only V3 compat lookup for locked method 29631 only.
 * POST /api/v3/compat/shipping-options — no shipment/parcel/label.
 */
export async function lookupSendcloudV3CompatShippingOption29631(): Promise<{
  raw: unknown;
  mapping: SendcloudV3CompatOption29631Mapping;
  requestUrlPath: string;
  requestBody: { shipping_method_ids: [typeof SENDCLOUD_V3_COMPAT_OPTION_29631_DIAGNOSTIC_V1.methodId] };
}> {
  const methodId = SENDCLOUD_V3_COMPAT_OPTION_29631_DIAGNOSTIC_V1.methodId;
  const path = SENDCLOUD_V3_COMPAT_OPTION_29631_DIAGNOSTIC_V1.path;
  const requestBody = { shipping_method_ids: [methodId] as [typeof methodId] };

  const raw = await sendcloudV3Request<unknown>(path, {
    method: "POST",
    body: JSON.stringify(requestBody),
  });

  return {
    raw,
    mapping: extractV3CompatMappingFor29631(raw),
    requestUrlPath: path,
    requestBody,
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
      const message =
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof (body as { error?: { message?: string } }).error?.message === "string"
          ? (body as { error: { message: string } }).error.message
          : `Sendcloud API error (${response.status})`;

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
