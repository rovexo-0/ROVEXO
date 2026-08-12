/**
 * Structured shipping-label provider failure — preserves status/message/attempt flags.
 * P7.1: never collapse SendcloudError into a silent empty label.
 * P7.2.1: extract + sanitize original provider body/details for Owner forensics.
 */

import { isSendcloudError, type SendcloudError } from "@/lib/shipping/sendcloud/errors";

export type ShippingLabelFailureKind =
  | "provider_http"
  | "provider_transport"
  | "provider_validation"
  | "provider_empty_result"
  | "provider_not_configured"
  | "rovexo_validation";

export type ShippingLabelProviderFailure = {
  kind: ShippingLabelFailureKind;
  message: string;
  /** Real provider HTTP status when one exists — never invented. */
  statusCode: number | null;
  providerId: string;
  /** True only when the provider operation (SendcloudService.generateLabel) was invoked. */
  providerRequestAttempted: boolean;
  code?: string;
  /** Sanitized original provider response body (no secrets). */
  providerDetails?: unknown;
};

const MAX_MESSAGE_LEN = 500;
const MAX_DETAILS_JSON_LEN = 4000;
const MAX_DEPTH = 6;
const MAX_ARRAY_ITEMS = 40;
const MAX_OBJECT_KEYS = 40;

const SECRET_KEY_RE =
  /^(authorization|cookie|set-cookie|api[_-]?key|secret|password|token|access[_-]?token|refresh[_-]?token|client[_-]?secret|x-api-key)$/i;

/** Strip credential-looking tokens from messages returned to API clients. */
export function sanitizeProviderFailureMessage(message: string): string {
  return message
    .replace(/Bearer\s+\S+/gi, "[redacted]")
    .replace(/Basic\s+\S+/gi, "[redacted]")
    .replace(/\bsk_[a-zA-Z0-9_]+\b/g, "[redacted]")
    .replace(/\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g, "[redacted]")
    .slice(0, MAX_MESSAGE_LEN);
}

function formatErrorEntry(entry: unknown): string | null {
  if (typeof entry === "string" && entry.trim()) return entry.trim();
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
  const rec = entry as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof rec.field === "string" && rec.field.trim()) parts.push(rec.field.trim());
  if (typeof rec.code === "string" && rec.code.trim()) parts.push(rec.code.trim());
  if (typeof rec.message === "string" && rec.message.trim()) parts.push(rec.message.trim());
  if (typeof rec.title === "string" && rec.title.trim()) parts.push(rec.title.trim());
  if (typeof rec.detail === "string" && rec.detail.trim()) parts.push(rec.detail.trim());
  if (parts.length === 0) return null;
  return parts.join(": ");
}

/**
 * Extract a human provider message from common Sendcloud V2/V3 error shapes.
 * Returns null when no provider message exists — never invents text.
 */
export function extractSendcloudProviderErrorMessage(body: unknown): string | null {
  if (body == null) return null;
  if (typeof body === "string") {
    const trimmed = body.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof body !== "object") return null;

  const rec = body as Record<string, unknown>;

  // body.error.message (V2-style)
  if (rec.error && typeof rec.error === "object" && !Array.isArray(rec.error)) {
    const nested = rec.error as Record<string, unknown>;
    if (typeof nested.message === "string" && nested.message.trim()) {
      return nested.message.trim();
    }
    if (typeof nested.code === "string" && nested.code.trim()) {
      return nested.code.trim();
    }
  }

  // body.message
  if (typeof rec.message === "string" && rec.message.trim()) {
    return rec.message.trim();
  }

  // body.detail (string or array)
  if (typeof rec.detail === "string" && rec.detail.trim()) {
    return rec.detail.trim();
  }
  if (Array.isArray(rec.detail)) {
    const parts = rec.detail
      .map((item) => formatErrorEntry(item) ?? (typeof item === "string" ? item.trim() : null))
      .filter((v): v is string => Boolean(v));
    if (parts.length > 0) return parts.join("; ");
  }

  // body.errors — array or field-map
  if (Array.isArray(rec.errors)) {
    const parts = rec.errors
      .map((item) => formatErrorEntry(item) ?? (typeof item === "string" ? item.trim() : null))
      .filter((v): v is string => Boolean(v));
    if (parts.length > 0) return parts.join("; ");
  }
  if (rec.errors && typeof rec.errors === "object" && !Array.isArray(rec.errors)) {
    const parts: string[] = [];
    for (const [field, value] of Object.entries(rec.errors as Record<string, unknown>)) {
      if (typeof value === "string" && value.trim()) {
        parts.push(`${field}: ${value.trim()}`);
      } else if (Array.isArray(value)) {
        const msgs = value
          .map((v) => (typeof v === "string" ? v.trim() : formatErrorEntry(v)))
          .filter((v): v is string => Boolean(v));
        if (msgs.length > 0) parts.push(`${field}: ${msgs.join(", ")}`);
      } else {
        const formatted = formatErrorEntry(value);
        if (formatted) parts.push(`${field}: ${formatted}`);
      }
    }
    if (parts.length > 0) return parts.join("; ");
  }

  // body.error as string
  if (typeof rec.error === "string" && rec.error.trim()) {
    return rec.error.trim();
  }

  return null;
}

/**
 * Deep-sanitize provider details for Owner-facing responses.
 * Strips secret-looking keys/values; never invents content.
 */
export function sanitizeProviderDetails(body: unknown): unknown | null {
  if (body == null) return null;
  if (typeof body === "string") {
    const sanitized = sanitizeProviderFailureMessage(body);
    return sanitized.length > 0 ? sanitized : null;
  }
  if (typeof body === "number" || typeof body === "boolean") return body;

  const seen = new WeakSet<object>();

  const walk = (value: unknown, depth: number): unknown => {
    if (value == null) return value;
    if (typeof value === "string") return sanitizeProviderFailureMessage(value);
    if (typeof value === "number" || typeof value === "boolean") return value;
    if (depth >= MAX_DEPTH) return "[truncated]";
    if (typeof value !== "object") return String(value);

    if (seen.has(value as object)) return "[circular]";
    seen.add(value as object);

    if (Array.isArray(value)) {
      return value.slice(0, MAX_ARRAY_ITEMS).map((item) => walk(item, depth + 1));
    }

    const out: Record<string, unknown> = {};
    const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_OBJECT_KEYS);
    for (const [key, child] of entries) {
      if (SECRET_KEY_RE.test(key)) {
        out[key] = "[redacted]";
        continue;
      }
      out[key] = walk(child, depth + 1);
    }
    return out;
  };

  const sanitized = walk(body, 0);
  try {
    const json = JSON.stringify(sanitized);
    if (!json || json === "null" || json === '""') return null;
    if (json.length > MAX_DETAILS_JSON_LEN) {
      return { truncated: true, preview: json.slice(0, MAX_DETAILS_JSON_LEN) };
    }
  } catch {
    return null;
  }
  return sanitized;
}

/**
 * Build message + sanitized details from a raw provider HTTP body.
 * Empty body → empty message + null details (no invented provider error text).
 */
export function buildSendcloudHttpFailureFromBody(body: unknown): {
  message: string;
  providerDetails: unknown | null;
} {
  const providerDetails = sanitizeProviderDetails(body);
  const extracted = extractSendcloudProviderErrorMessage(body);
  return {
    message: extracted ? sanitizeProviderFailureMessage(extracted) : "",
    providerDetails,
  };
}

export function shippingLabelProviderFailure(input: {
  kind: ShippingLabelFailureKind;
  message: string;
  statusCode?: number | null;
  providerId?: string;
  providerRequestAttempted: boolean;
  code?: string;
  providerDetails?: unknown;
}): ShippingLabelProviderFailure {
  const details =
    input.providerDetails === undefined
      ? undefined
      : sanitizeProviderDetails(input.providerDetails);
  return {
    kind: input.kind,
    message: sanitizeProviderFailureMessage(input.message),
    statusCode: typeof input.statusCode === "number" ? input.statusCode : null,
    providerId: input.providerId ?? "sendcloud",
    providerRequestAttempted: input.providerRequestAttempted,
    ...(input.code ? { code: input.code } : {}),
    ...(details !== undefined && details !== null ? { providerDetails: details } : {}),
  };
}

export function classifySendcloudErrorKind(
  error: SendcloudError,
): Exclude<ShippingLabelFailureKind, "rovexo_validation" | "provider_not_configured"> {
  if (error.code === "timeout" || error.code === "network_error") {
    return "provider_transport";
  }
  if (
    error.message.includes("tracking number") ||
    error.message.includes("label URL") ||
    error.message.includes("usable label")
  ) {
    return "provider_empty_result";
  }
  if (
    error.code === "invalid_address" ||
    error.message.includes("shipping_option_code") ||
    error.message.includes("Invalid or expired Sendcloud quote")
  ) {
    return "provider_validation";
  }
  if (typeof error.statusCode === "number" && error.statusCode >= 400) {
    return "provider_http";
  }
  // Attempted provider op with no HTTP status — transport-class unless clearly validation.
  if (error.code === "label_failed" || error.code === "api_error") {
    return "provider_transport";
  }
  return "provider_transport";
}

export function providerFailureFromUnknownError(
  error: unknown,
  providerRequestAttempted: boolean,
  providerId = "sendcloud",
): ShippingLabelProviderFailure {
  if (isSendcloudError(error)) {
    const kind =
      error.code === "not_configured"
        ? ("provider_not_configured" as const)
        : classifySendcloudErrorKind(error);
    const fromBody =
      error.details !== undefined
        ? buildSendcloudHttpFailureFromBody(error.details)
        : { message: "", providerDetails: null as unknown | null };
    const message =
      (error.message && error.message.trim()) ||
      fromBody.message ||
      "";
    return shippingLabelProviderFailure({
      kind,
      message,
      statusCode: error.statusCode ?? null,
      providerId,
      providerRequestAttempted,
      code: error.code,
      providerDetails: fromBody.providerDetails ?? error.details,
    });
  }

  const message = error instanceof Error ? error.message : String(error);
  const timedOut = /timed out|timeout/i.test(message);
  return shippingLabelProviderFailure({
    kind: timedOut ? "provider_transport" : "provider_transport",
    message: message || "Shipping provider request failed.",
    statusCode: null,
    providerId,
    providerRequestAttempted,
    code: timedOut ? "timeout" : "network_error",
  });
}
