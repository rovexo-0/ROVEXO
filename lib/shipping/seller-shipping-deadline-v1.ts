/**
 * MEDIUM #6 extension — ROVEXO seller shipping deadline (3 calendar days).
 *
 * Independent from Sendcloud quote expires_at:
 * 1) ROVEXO seller deadline = 3 calendar days from payment confirmation (paid_at)
 * 2) Sendcloud quote expires_at = technical quote validity
 *
 * Both must PASS before a new provider label call.
 * Never invents paid_at. Never auto-replaces quote/carrier/buyer price.
 * Never cancels the order. Existing in-term labels remain reusable.
 */

export const SELLER_SHIPPING_DEADLINE_V1 = {
  version: "v1.0",
  rule: "SELLER_SHIPPING_DEADLINE_3_CALENDAR_DAYS",
  calendarDays: 3 as const,
  /** Exact duration: 3 × 24h from canonical paid_at instant (UTC ms). */
  durationMs: 3 * 24 * 60 * 60 * 1000,
  startField: "orders.paid_at",
  boundary: "deadline_ms_lte_now_is_expired",
  missingPaidAt: "fail_closed_do_not_invent",
  recoveryStatus: "repair_required" as const,
  forbidden: [
    "auto_cancel_order",
    "auto_replace_selected_quote",
    "auto_replace_carrier",
    "auto_replace_buyer_shipping_price",
    "auto_generate_new_quote",
    "provider_call_when_deadline_expired",
    "start_from_listing_created_at",
    "start_from_quote_created_at",
  ] as const,
} as const;

export const SELLER_SHIPPING_DEADLINE_EXPIRED_LABEL_MESSAGE =
  "Seller shipping deadline has expired (3 calendar days from payment confirmation). Label generation is blocked — the order is routed to shipping recovery/review. The paid quote, carrier, and buyer shipping price are not changed automatically.";

export type SellerShippingDeadlineInput = {
  /** Canonical payment confirmation instant (orders.paid_at). */
  paidAt?: string | null;
  /** Canonical "now" for tests; defaults to Date.now(). */
  nowMs?: number;
};

export type SellerShippingDeadlineResult =
  | {
      status: "within_deadline";
      paidAtMs: number;
      deadlineMs: number;
      nowMs: number;
    }
  | {
      status: "expired";
      paidAtMs: number;
      deadlineMs: number;
      nowMs: number;
    }
  | {
      status: "missing_paid_at";
      paidAtMs: null;
      deadlineMs: null;
      nowMs: number;
    }
  | {
      status: "invalid_paid_at";
      paidAtRaw: string;
      paidAtMs: null;
      deadlineMs: null;
      nowMs: number;
    };

/** Parse paid_at as a canonical UTC millisecond instant. */
export function parsePaymentConfirmedAtMs(
  paidAt: string | null | undefined,
): number | null {
  if (paidAt == null) return null;
  const raw = String(paidAt).trim();
  if (!raw) return null;
  const ms = Date.parse(raw);
  if (!Number.isFinite(ms)) return null;
  return ms;
}

/** Deadline instant = paid_at + 3 calendar days (exact 72h UTC duration). */
export function computeSellerShippingDeadlineMs(paidAtMs: number): number {
  return paidAtMs + SELLER_SHIPPING_DEADLINE_V1.durationMs;
}

/**
 * Evaluate ROVEXO seller shipping deadline.
 *
 * - Missing / blank paidAt → missing_paid_at (fail closed; do not invent).
 * - Unparseable paidAt → invalid_paid_at (fail closed).
 * - nowMs >= deadlineMs → expired (exact boundary rejected).
 * - otherwise → within_deadline.
 */
export function evaluateSellerShippingDeadline(
  input: SellerShippingDeadlineInput,
): SellerShippingDeadlineResult {
  const nowMs =
    typeof input.nowMs === "number" && Number.isFinite(input.nowMs)
      ? input.nowMs
      : Date.now();

  if (input.paidAt == null || String(input.paidAt).trim() === "") {
    return { status: "missing_paid_at", paidAtMs: null, deadlineMs: null, nowMs };
  }

  const paidAtMs = parsePaymentConfirmedAtMs(input.paidAt);
  if (paidAtMs == null) {
    return {
      status: "invalid_paid_at",
      paidAtRaw: String(input.paidAt),
      paidAtMs: null,
      deadlineMs: null,
      nowMs,
    };
  }

  const deadlineMs = computeSellerShippingDeadlineMs(paidAtMs);
  if (deadlineMs <= nowMs) {
    return { status: "expired", paidAtMs, deadlineMs, nowMs };
  }

  return { status: "within_deadline", paidAtMs, deadlineMs, nowMs };
}

/** True when a new provider label call must fail closed for seller deadline. */
export function isSellerShippingDeadlineExpiredForLabel(
  input: SellerShippingDeadlineInput,
): boolean {
  const result = evaluateSellerShippingDeadline(input);
  return (
    result.status === "expired" ||
    result.status === "missing_paid_at" ||
    result.status === "invalid_paid_at"
  );
}
