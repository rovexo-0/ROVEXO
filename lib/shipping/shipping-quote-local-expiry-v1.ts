/**
 * MEDIUM #6 — Local shipping quote expiry (fail-closed before provider label).
 *
 * Canonical timestamp comparison only. Never invents expiresAt.
 * Never mutates a persisted quote's expires_at.
 * Never auto-replaces the selected quote.
 */

export const SHIPPING_QUOTE_LOCAL_EXPIRY_V1 = {
  version: "v1.0",
  rule: "LOCAL_EXPIRES_AT_BEFORE_LABEL",
  boundary: "expires_at_lte_now_is_expired",
  missingExpiresAt: "do_not_invent_allow_existing_fail_safe",
  forbidden: [
    "auto_replace_selected_quote",
    "quotes_zero_fallback",
    "price_fallback",
    "mutate_persisted_expires_at",
    "provider_call_when_locally_expired",
  ] as const,
} as const;

export const LOCAL_QUOTE_EXPIRED_LABEL_MESSAGE =
  "Selected shipping quote has expired (local expires_at). Label generation is blocked until a new checkout quote is selected — the paid selection is not replaced automatically.";

export type ShippingQuoteLocalExpiryInput = {
  /** ISO-8601 / Date-parseable expires_at from shipping_quotes. Absent = do not invent. */
  expiresAt?: string | null;
  /** Canonical "now" for tests; defaults to Date.now(). */
  nowMs?: number;
};

export type ShippingQuoteLocalExpiryResult =
  | { status: "not_expired"; expiresAtMs: number | null; nowMs: number }
  | { status: "expired"; expiresAtMs: number; nowMs: number }
  | { status: "invalid_expires_at"; expiresAtRaw: string; nowMs: number };

/**
 * Parse expires_at as a canonical UTC millisecond instant.
 * Accepts ISO-8601 with Z / offset. Rejects empty / NaN / non-finite.
 */
export function parseShippingQuoteExpiresAtMs(
  expiresAt: string | null | undefined,
): number | null {
  if (expiresAt == null) return null;
  const raw = String(expiresAt).trim();
  if (!raw) return null;
  const ms = Date.parse(raw);
  if (!Number.isFinite(ms)) return null;
  return ms;
}

/**
 * Local expiry gate for label generation.
 *
 * - Missing expiresAt → not_expired (existing fail-safe; do not invent).
 * - Present + unparseable → invalid_expires_at (fail closed).
 * - Present + expiresAtMs <= nowMs → expired (exact boundary rejected).
 */
export function evaluateShippingQuoteLocalExpiry(
  input: ShippingQuoteLocalExpiryInput,
): ShippingQuoteLocalExpiryResult {
  const nowMs =
    typeof input.nowMs === "number" && Number.isFinite(input.nowMs)
      ? input.nowMs
      : Date.now();

  if (input.expiresAt == null || String(input.expiresAt).trim() === "") {
    return { status: "not_expired", expiresAtMs: null, nowMs };
  }

  const expiresAtMs = parseShippingQuoteExpiresAtMs(input.expiresAt);
  if (expiresAtMs == null) {
    return {
      status: "invalid_expires_at",
      expiresAtRaw: String(input.expiresAt),
      nowMs,
    };
  }

  if (expiresAtMs <= nowMs) {
    return { status: "expired", expiresAtMs, nowMs };
  }

  return { status: "not_expired", expiresAtMs, nowMs };
}

/** True when label generation must fail closed without calling the provider. */
export function isShippingQuoteLocallyExpiredForLabel(
  input: ShippingQuoteLocalExpiryInput,
): boolean {
  const result = evaluateShippingQuoteLocalExpiry(input);
  return result.status === "expired" || result.status === "invalid_expires_at";
}
