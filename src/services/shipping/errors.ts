export type ShippingErrorCode =
  | "authentication"
  | "quote"
  | "shipment"
  | "tracking"
  | "webhook"
  | "network"
  | "rate_limit"
  | "validation"
  | "not_configured"
  | "not_implemented";

type ShippingErrorOptions = {
  statusCode?: number;
  retryable?: boolean;
  details?: unknown;
  cause?: unknown;
};

abstract class ShippingBaseError extends Error {
  abstract readonly code: ShippingErrorCode;
  readonly statusCode?: number;
  readonly retryable: boolean;
  readonly details?: unknown;

  constructor(message: string, options?: ShippingErrorOptions) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = new.target.name;
    this.statusCode = options?.statusCode;
    this.retryable = options?.retryable ?? false;
    this.details = options?.details;
  }
}

export class AuthenticationError extends ShippingBaseError {
  readonly code = "authentication" as const;
}

export class QuoteError extends ShippingBaseError {
  readonly code = "quote" as const;
}

export class ShipmentError extends ShippingBaseError {
  readonly code = "shipment" as const;
}

export class TrackingError extends ShippingBaseError {
  readonly code = "tracking" as const;
}

export class WebhookError extends ShippingBaseError {
  readonly code = "webhook" as const;
}

export class NetworkError extends ShippingBaseError {
  readonly code = "network" as const;

  constructor(message: string, options?: ShippingErrorOptions) {
    super(message, { ...options, retryable: options?.retryable ?? true });
  }
}

export class RateLimitError extends ShippingBaseError {
  readonly code = "rate_limit" as const;

  constructor(message: string, options?: ShippingErrorOptions) {
    super(message, { ...options, retryable: options?.retryable ?? true });
  }
}

export class ValidationError extends ShippingBaseError {
  readonly code = "validation" as const;
}

export class NotConfiguredError extends AuthenticationError {
  constructor(message: string, options?: ShippingErrorOptions) {
    super(message, options);
    this.name = "NotConfiguredError";
  }
}

export class NotImplementedError extends ShippingBaseError {
  readonly code = "not_implemented" as const;
}

export type ShippingError =
  | AuthenticationError
  | QuoteError
  | ShipmentError
  | TrackingError
  | WebhookError
  | NetworkError
  | RateLimitError
  | ValidationError
  | NotImplementedError;

export function isShippingError(error: unknown): error is ShippingError {
  return error instanceof ShippingBaseError;
}

export function toShippingError(error: unknown, fallback: ShippingErrorCode = "network"): ShippingError {
  if (isShippingError(error)) return error;
  const message = error instanceof Error ? error.message : "Shipping request failed";
  switch (fallback) {
    case "authentication":
      return new AuthenticationError(message, { cause: error });
    case "quote":
      return new QuoteError(message, { cause: error });
    case "shipment":
      return new ShipmentError(message, { cause: error });
    case "tracking":
      return new TrackingError(message, { cause: error });
    case "webhook":
      return new WebhookError(message, { cause: error });
    case "rate_limit":
      return new RateLimitError(message, { cause: error });
    case "validation":
      return new ValidationError(message, { cause: error });
  }
  return new NetworkError(message, { cause: error });
}
