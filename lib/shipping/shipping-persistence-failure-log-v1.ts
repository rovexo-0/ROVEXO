/**
 * P5.5 — Safe structured logging for post-payment shipping persistence failures.
 * Console-only: never inserts into platform_error_logs / never mutates production DB for logging.
 * Never logs tokens, cookies, API keys, card data, Stripe/Sendcloud secrets, or headers.
 */

export const SHIPPING_PERSISTENCE_FAILURE_EVENT = "shipping_persistence_failure" as const;

export type ShippingPersistenceFailureStage =
  | "shipping_records.insert"
  | "ensureOrderShippingPersistence"
  | "orders.shipping_setup_status"
  | "orders.shipping_setup_status.repair_required"
  | "orders.shipping_setup_status.ready"
  | (string & {});

export type ShippingRecordOperation =
  | "insert"
  | "status_update"
  | "persist_pipeline"
  | "fulfillment_catch"
  | (string & {});

export type ShippingPersistenceFailureLog = {
  event: typeof SHIPPING_PERSISTENCE_FAILURE_EVENT;
  failureStage: ShippingPersistenceFailureStage;
  orderId: string;
  orderNumber: string | null;
  selectedShippingQuoteId: string | null;
  shippingRecordOperation: ShippingRecordOperation;
  errorCode: string | null;
  errorMessage: string | null;
  errorDetails: string | null;
  errorConstraint: string | null;
  timestamp: string;
};

const SAFE_STRING_MAX = 500;

function truncateSafe(value: unknown): string | null {
  if (value == null) return null;
  const text = typeof value === "string" ? value : String(value);
  if (!text) return null;
  // Reject obvious secret-bearing payloads (never log them).
  if (
    /Bearer\s+[A-Za-z0-9._\-]+/i.test(text) ||
    /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\./.test(text) ||
    /service[_-]?role/i.test(text) ||
    /sk_(live|test)_/i.test(text) ||
    /whsec_/i.test(text) ||
    /Authorization\s*:/i.test(text)
  ) {
    return "[redacted]";
  }
  return text.length > SAFE_STRING_MAX ? `${text.slice(0, SAFE_STRING_MAX)}…` : text;
}

/** Extract only PostgREST / Error diagnostic fields — never dump raw objects. */
export function extractSafeDbErrorFields(error: unknown): {
  errorCode: string | null;
  errorMessage: string | null;
  errorDetails: string | null;
  errorConstraint: string | null;
} {
  if (error == null) {
    return {
      errorCode: null,
      errorMessage: null,
      errorDetails: null,
      errorConstraint: null,
    };
  }

  if (typeof error === "object") {
    const row = error as {
      code?: unknown;
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      constraint?: unknown;
    };
    const message = truncateSafe(row.message);
    const details = truncateSafe(row.details);
    const hint = truncateSafe(row.hint);
    const constraint =
      truncateSafe(row.constraint) ??
      extractConstraintFromText(details) ??
      extractConstraintFromText(message);
    const code =
      typeof row.code === "string" || typeof row.code === "number"
        ? String(row.code)
        : extractCodeFromMessage(message);

    return {
      errorCode: code,
      errorMessage: message,
      errorDetails: details ?? hint,
      errorConstraint: constraint,
    };
  }

  if (error instanceof Error) {
    const message = truncateSafe(error.message);
    return {
      errorCode: extractCodeFromMessage(message),
      errorMessage: message,
      errorDetails: null,
      errorConstraint: extractConstraintFromText(message),
    };
  }

  return {
    errorCode: null,
    errorMessage: truncateSafe(error),
    errorDetails: null,
    errorConstraint: null,
  };
}

function extractCodeFromMessage(message: string | null): string | null {
  if (!message) return null;
  const match = /(?:code=|\(code=)([A-Za-z0-9_]+)/i.exec(message);
  return match?.[1] ?? null;
}

function extractConstraintFromText(text: string | null): string | null {
  if (!text) return null;
  const match =
    /constraint\s+"?([a-zA-Z0-9_]+)"?/i.exec(text) ??
    /violates unique constraint "([^"]+)"/i.exec(text) ??
    /violates foreign key constraint "([^"]+)"/i.exec(text) ??
    /violates check constraint "([^"]+)"/i.exec(text);
  return match?.[1] ?? null;
}

export function buildShippingPersistenceFailureLog(input: {
  failureStage: ShippingPersistenceFailureStage;
  orderId: string;
  orderNumber?: string | null;
  selectedShippingQuoteId?: string | null;
  shippingRecordOperation: ShippingRecordOperation;
  error?: unknown;
  errorCode?: string | null;
  errorMessage?: string | null;
  errorDetails?: string | null;
  errorConstraint?: string | null;
  timestamp?: string;
}): ShippingPersistenceFailureLog {
  const extracted = extractSafeDbErrorFields(input.error);
  return {
    event: SHIPPING_PERSISTENCE_FAILURE_EVENT,
    failureStage: input.failureStage,
    orderId: input.orderId,
    orderNumber: input.orderNumber?.trim() || null,
    selectedShippingQuoteId: input.selectedShippingQuoteId?.trim() || null,
    shippingRecordOperation: input.shippingRecordOperation,
    errorCode: input.errorCode ?? extracted.errorCode,
    errorMessage: input.errorMessage ?? extracted.errorMessage,
    errorDetails: input.errorDetails ?? extracted.errorDetails,
    errorConstraint: input.errorConstraint ?? extracted.errorConstraint,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };
}

/**
 * Emit structured failure diagnostics to runtime logs only (no DB write).
 */
export function logShippingPersistenceFailure(
  input: Parameters<typeof buildShippingPersistenceFailureLog>[0],
): ShippingPersistenceFailureLog {
  const payload = buildShippingPersistenceFailureLog(input);
  console.error(`[${SHIPPING_PERSISTENCE_FAILURE_EVENT}]`, payload);
  return payload;
}
