export type ShippoErrorCode =
  | "not_configured"
  | "invalid_address"
  | "api_error"
  | "no_rates"
  | "label_failed"
  | "tracking_not_found"
  | "webhook_invalid";

export class ShippoError extends Error {
  readonly code: ShippoErrorCode;
  readonly statusCode?: number;
  readonly details?: unknown;

  constructor(code: ShippoErrorCode, message: string, options?: { statusCode?: number; details?: unknown }) {
    super(message);
    this.name = "ShippoError";
    this.code = code;
    this.statusCode = options?.statusCode;
    this.details = options?.details;
  }
}

export function isShippoError(error: unknown): error is ShippoError {
  return error instanceof ShippoError;
}

export function toShippoError(error: unknown, fallbackCode: ShippoErrorCode = "api_error"): ShippoError {
  if (isShippoError(error)) return error;
  const message = error instanceof Error ? error.message : "Shippo request failed";
  return new ShippoError(fallbackCode, message);
}
