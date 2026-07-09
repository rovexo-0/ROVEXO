import "server-only";

import { getParcel2GoAccessToken, clearParcel2GoTokenCache } from "@/src/services/shipping/parcel2go/auth";
import {
  AuthenticationError,
  NetworkError,
  RateLimitError,
  ShipmentError,
  toShippingError,
} from "@/src/services/shipping/errors";
import { ShippingLogger } from "@/src/services/shipping/logger";
import { getParcel2GoApiUrl } from "@/src/services/shipping/env";

export const PARCEL2GO_PROVIDER_VERSION = "1.0.0";
export const PARCEL2GO_HEALTH_PROBE_PATH = "/api/orders";

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_RETRIES = 3;
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

export type Parcel2GoClientOptions = {
  correlationId?: string;
  timeoutMs?: number;
  retries?: number;
};

export type Parcel2GoRequestOptions = Parcel2GoClientOptions & {
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  /** When false, non-idempotent requests (e.g. payment) are not retried. */
  retryable?: boolean;
};

function parseRetryAfterMs(response: Response): number {
  const header = response.headers.get("retry-after");
  if (!header) return 1_500;
  const seconds = Number.parseInt(header, 10);
  return Number.isFinite(seconds) ? seconds * 1_000 : 1_500;
}

function buildUrl(path: string, query?: Parcel2GoRequestOptions["query"]): string {
  const base = getParcel2GoApiUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      title?: string;
      detail?: string;
      message?: string;
      Message?: string;
      error?: string;
      errors?: Array<{ message?: string; Error?: string }>;
      Errors?: Array<{ Error?: string; message?: string }>;
    };

    const parcel2GoErrors = payload.Errors?.map((item) => item.Error).filter(Boolean).join("; ");
    const nested =
      parcel2GoErrors ||
      payload.errors?.map((item) => item.message ?? item.Error).filter(Boolean).join("; ");
    return (
      nested ||
      payload.detail ||
      payload.message ||
      payload.Message ||
      payload.title ||
      payload.error ||
      response.statusText
    );
  } catch {
    return response.statusText || "Parcel2Go request failed";
  }
}

function mapHttpError(status: number, message: string): Error {
  if (status === 401 || status === 403) {
    return new AuthenticationError(message, { statusCode: status });
  }
  if (status === 429) {
    return new RateLimitError(message, { statusCode: status });
  }
  if (status >= 500) {
    return new NetworkError(message, { statusCode: status, retryable: true });
  }
  return new ShipmentError(message, { statusCode: status });
}

type InternalRequestOptions = Parcel2GoRequestOptions & {
  authRetried?: boolean;
  /** When false, non-idempotent POSTs (e.g. payment) are never retried. Default true. */
  retryable?: boolean;
};

export class Parcel2GoClient {
  readonly logger: ShippingLogger;
  readonly timeoutMs: number;
  readonly retries: number;

  constructor(options: Parcel2GoClientOptions = {}) {
    this.logger = new ShippingLogger("parcel2go", options.correlationId);
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retries = options.retries ?? DEFAULT_RETRIES;
  }

  async get<T>(path: string, options: Parcel2GoRequestOptions = {}): Promise<T> {
    return this.request<T>("GET", path, undefined, options);
  }

  async post<T>(path: string, body?: unknown, options: Parcel2GoRequestOptions = {}): Promise<T> {
    return this.request<T>("POST", path, body, options);
  }

  async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
    options: InternalRequestOptions = {},
  ): Promise<T> {
    const url = buildUrl(path, options.query);
    let attempt = 0;

    const maxRetries = options.retryable === false ? 0 : this.retries;

    while (attempt <= maxRetries) {
      const start = Date.now();
      this.logger.logRequest(method, path, { retryAttempt: attempt });

      let response: Response;
      try {
        const accessToken = await getParcel2GoAccessToken(this.logger);
        response = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
          cache: "no-store",
          signal: AbortSignal.timeout(options.timeoutMs ?? this.timeoutMs),
        });
      } catch (error) {
        const durationMs = Date.now() - start;
        this.logger.logError("Parcel2Go network request failed", { durationMs });

        if (attempt === maxRetries) {
          throw new NetworkError("Parcel2Go network request failed", { cause: error });
        }

        await delay(1_500);
        attempt += 1;
        continue;
      }

      const durationMs = Date.now() - start;
      this.logger.logResponse(method, path, response.status, durationMs, { retryAttempt: attempt });

      if (response.status === 401 && !options.authRetried) {
        this.logger.log({
          level: "warn",
          provider: this.logger.provider,
          correlationId: this.logger.correlationId,
          event: "auth",
          message: "Parcel2Go API returned 401 — refreshing OAuth token",
          status: 401,
          method,
          path,
        });
        clearParcel2GoTokenCache();
        options.authRetried = true;
        continue;
      }

      if (response.ok) {
        if (response.status === 204) {
          return undefined as T;
        }
        return (await response.json()) as T;
      }

      const message = await parseApiError(response);

      if (RETRYABLE_STATUSES.has(response.status) && attempt < maxRetries) {
        await delay(parseRetryAfterMs(response));
        attempt += 1;
        continue;
      }

      throw mapHttpError(response.status, message);
    }

    throw new NetworkError("Parcel2Go request failed after retries", { retryable: true });
  }

  async probeApiReachability(): Promise<{ reachable: boolean; latencyMs: number; message?: string }> {
    const start = Date.now();
    try {
      await this.get(PARCEL2GO_HEALTH_PROBE_PATH, {
        query: { page: 1, pageSize: 1 },
        retries: 0,
      });
      return { reachable: true, latencyMs: Date.now() - start };
    } catch (error) {
      const shippingError = toShippingError(error);
      const latencyMs = Date.now() - start;

      if (shippingError.statusCode && shippingError.statusCode >= 400 && shippingError.statusCode < 500) {
        return {
          reachable: true,
          latencyMs,
          message: shippingError.message,
        };
      }

      return {
        reachable: false,
        latencyMs,
        message: shippingError.message,
      };
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
