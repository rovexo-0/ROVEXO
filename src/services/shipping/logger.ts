import { randomUUID } from "node:crypto";

const SECRET_PATTERNS = [
  /client_secret/i,
  /access_token/i,
  /authorization/i,
  /bearer\s+/i,
  /password/i,
  /secret/i,
];

export type ShippingLogLevel = "debug" | "info" | "warn" | "error";

export type ShippingLogEntry = {
  level: ShippingLogLevel;
  provider: string;
  correlationId: string;
  event: "request" | "response" | "auth" | "health" | "error";
  method?: string;
  path?: string;
  status?: number;
  durationMs?: number;
  message?: string;
  retryAttempt?: number;
  details?: Record<string, unknown>;
};

function redactValue(key: string, value: unknown): unknown {
  if (SECRET_PATTERNS.some((pattern) => pattern.test(key))) {
    return "[REDACTED]";
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return redactObject(value as Record<string, unknown>);
  }
  return value;
}

function redactObject(input: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    output[key] = redactValue(key, value);
  }
  return output;
}

export function createCorrelationId(): string {
  return randomUUID();
}

export class ShippingLogger {
  readonly provider: string;
  readonly correlationId: string;

  constructor(provider: string, correlationId: string = createCorrelationId()) {
    this.provider = provider;
    this.correlationId = correlationId;
  }

  child(correlationId: string): ShippingLogger {
    return new ShippingLogger(this.provider, correlationId);
  }

  log(entry: ShippingLogEntry): void {
    const payload = {
      ...entry,
      provider: this.provider,
      correlationId: entry.correlationId || this.correlationId,
      timestamp: new Date().toISOString(),
    };

    const line = `[shipping:${payload.provider}] ${JSON.stringify(redactObject(payload as Record<string, unknown>))}`;

    switch (entry.level) {
      case "error":
        console.error(line);
        break;
      case "warn":
        console.warn(line);
        break;
      case "debug":
        if (process.env.NODE_ENV !== "production") {
          console.debug(line);
        }
        break;
      default:
        console.info(line);
    }
  }

  logRequest(method: string, path: string, options?: { retryAttempt?: number }): void {
    this.log({
      level: "info",
      provider: this.provider,
      correlationId: this.correlationId,
      event: "request",
      method,
      path,
      retryAttempt: options?.retryAttempt,
    });
  }

  logResponse(
    method: string,
    path: string,
    status: number,
    durationMs: number,
    options?: { retryAttempt?: number },
  ): void {
    this.log({
      level: status >= 400 ? "warn" : "info",
      provider: this.provider,
      correlationId: this.correlationId,
      event: "response",
      method,
      path,
      status,
      durationMs,
      retryAttempt: options?.retryAttempt,
    });
  }

  logError(message: string, options?: { status?: number; durationMs?: number }): void {
    this.log({
      level: "error",
      provider: this.provider,
      correlationId: this.correlationId,
      event: "error",
      message,
      status: options?.status,
      durationMs: options?.durationMs,
    });
  }

  logAuthFailure(
    message: string,
    options: { status?: number; durationMs?: number; details?: Record<string, unknown> },
  ): void {
    this.log({
      level: "error",
      provider: this.provider,
      correlationId: this.correlationId,
      event: "auth",
      message,
      status: options.status,
      durationMs: options.durationMs,
      details: options.details,
    });
  }
}
