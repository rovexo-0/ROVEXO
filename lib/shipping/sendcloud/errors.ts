export type SendcloudErrorCode =
  | "not_configured"
  | "invalid_address"
  | "no_services"
  | "label_failed"
  | "tracking_not_found"
  | "api_error"
  | "webhook_invalid";

export class SendcloudError extends Error {
  readonly code: SendcloudErrorCode;
  readonly statusCode?: number;
  readonly details?: unknown;

  constructor(code: SendcloudErrorCode, message: string, options?: { statusCode?: number; details?: unknown }) {
    super(message);
    this.name = "SendcloudError";
    this.code = code;
    this.statusCode = options?.statusCode;
    this.details = options?.details;
  }
}

export function isSendcloudError(error: unknown): error is SendcloudError {
  return error instanceof SendcloudError;
}

export function toSendcloudError(error: unknown, fallbackCode: SendcloudErrorCode = "api_error"): SendcloudError {
  if (error instanceof SendcloudError) return error;

  const message = error instanceof Error ? error.message : String(error);
  const statusCode =
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : undefined;

  return new SendcloudError(fallbackCode, message, { statusCode });
}
