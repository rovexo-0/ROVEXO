/**
 * Structured shipping-label provider failure — preserves status/message/attempt flags.
 * P7.1: never collapse SendcloudError into a silent empty label.
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
};

const MAX_MESSAGE_LEN = 500;

/** Strip credential-looking tokens from messages returned to API clients. */
export function sanitizeProviderFailureMessage(message: string): string {
  return message
    .replace(/Bearer\s+\S+/gi, "[redacted]")
    .replace(/Basic\s+\S+/gi, "[redacted]")
    .replace(/\bsk_[a-zA-Z0-9_]+\b/g, "[redacted]")
    .replace(/\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g, "[redacted]")
    .slice(0, MAX_MESSAGE_LEN);
}

export function shippingLabelProviderFailure(input: {
  kind: ShippingLabelFailureKind;
  message: string;
  statusCode?: number | null;
  providerId?: string;
  providerRequestAttempted: boolean;
  code?: string;
}): ShippingLabelProviderFailure {
  return {
    kind: input.kind,
    message: sanitizeProviderFailureMessage(input.message),
    statusCode: typeof input.statusCode === "number" ? input.statusCode : null,
    providerId: input.providerId ?? "sendcloud",
    providerRequestAttempted: input.providerRequestAttempted,
    ...(input.code ? { code: input.code } : {}),
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
    return shippingLabelProviderFailure({
      kind,
      message: error.message,
      statusCode: error.statusCode ?? null,
      providerId,
      providerRequestAttempted,
      code: error.code,
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
