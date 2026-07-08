import "server-only";

import {
  getParcel2GoClientId,
  getParcel2GoClientSecret,
  getParcel2GoTokenUrl,
  isParcel2GoConfigured,
  PARCEL2GO_TOKEN_PATH,
} from "@/src/services/shipping/env";
import { AuthenticationError, NetworkError, RateLimitError } from "@/src/services/shipping/errors";
import { ShippingLogger } from "@/src/services/shipping/logger";

/** Official Parcel2Go OAuth scope for client credentials (public-api + payment). */
export const PARCEL2GO_OAUTH_SCOPE = "public-api payment";
export const PARCEL2GO_OAUTH_GRANT_TYPE = "client_credentials";
export const TOKEN_REFRESH_BUFFER_MS = 60_000;

export type Parcel2GoTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

type CachedToken = {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;
let tokenRefreshPromise: Promise<string> | null = null;

export function clearParcel2GoTokenCache(): void {
  cachedToken = null;
  tokenRefreshPromise = null;
}

export function getCachedTokenExpiry(): number | null {
  return cachedToken?.expiresAt ?? null;
}

export function getCachedTokenExpiresAtIso(): string | null {
  if (!cachedToken) return null;
  return new Date(cachedToken.expiresAt).toISOString();
}

export function isCachedTokenValid(now: number = Date.now()): boolean {
  if (!cachedToken) return false;
  return now < cachedToken.expiresAt - TOKEN_REFRESH_BUFFER_MS;
}

function buildOAuthRequestBody(): URLSearchParams {
  return new URLSearchParams({
    grant_type: PARCEL2GO_OAUTH_GRANT_TYPE,
    scope: PARCEL2GO_OAUTH_SCOPE,
    client_id: getParcel2GoClientId(),
    client_secret: getParcel2GoClientSecret(),
  });
}

async function parseOAuthError(response: Response): Promise<{
  message: string;
  error?: string;
  errorDescription?: string;
}> {
  try {
    const payload = (await response.json()) as {
      error?: string;
      error_description?: string;
      message?: string;
    };
    const errorDescription = payload.error_description;
    const error = payload.error;
    const message = errorDescription ?? payload.message ?? error ?? response.statusText;
    return { message, error, errorDescription };
  } catch {
    return { message: response.statusText || "Parcel2Go OAuth failed" };
  }
}

async function requestAccessToken(logger: ShippingLogger): Promise<CachedToken> {
  if (!isParcel2GoConfigured()) {
    throw new AuthenticationError(
      "Parcel2Go is not configured. Set PARCEL2GO_CLIENT_ID, PARCEL2GO_CLIENT_SECRET, PARCEL2GO_AUTH_URL, and PARCEL2GO_API_URL.",
    );
  }

  const tokenUrl = getParcel2GoTokenUrl();
  const body = buildOAuthRequestBody();

  const start = Date.now();
  logger.logRequest("POST", PARCEL2GO_TOKEN_PATH);

  let response: Response;
  try {
    response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "*/*",
      },
      body: body.toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    const durationMs = Date.now() - start;
    logger.logAuthFailure("Parcel2Go OAuth network request failed", {
      durationMs,
      details: { tokenUrl, grantType: PARCEL2GO_OAUTH_GRANT_TYPE },
    });
    throw new NetworkError("Parcel2Go OAuth request failed", { cause: error });
  }

  const durationMs = Date.now() - start;
  logger.logResponse("POST", PARCEL2GO_TOKEN_PATH, response.status, durationMs);

  if (response.status === 429) {
    logger.logAuthFailure("Parcel2Go OAuth rate limited", {
      status: 429,
      durationMs,
      details: { error: "rate_limit" },
    });
    throw new RateLimitError("Parcel2Go OAuth rate limited", { statusCode: 429 });
  }

  if (!response.ok) {
    const parsed = await parseOAuthError(response);
    logger.logAuthFailure("Parcel2Go OAuth authentication failed", {
      status: response.status,
      durationMs,
      details: {
        error: parsed.error ?? "oauth_error",
        errorDescription: parsed.errorDescription,
      },
    });
    throw new AuthenticationError(parsed.message, { statusCode: response.status });
  }

  const payload = (await response.json()) as Parcel2GoTokenResponse;
  if (!payload.access_token || !payload.expires_in) {
    logger.logAuthFailure("Parcel2Go OAuth response missing required fields", {
      status: response.status,
      durationMs,
      details: { missing: ["access_token", "expires_in"].filter((key) => !(key in payload)) },
    });
    throw new AuthenticationError("Parcel2Go OAuth response missing access_token or expires_in");
  }

  const tokenType = (payload.token_type ?? "Bearer").trim();
  if (tokenType.toLowerCase() !== "bearer") {
    logger.logAuthFailure("Parcel2Go OAuth returned unexpected token_type", {
      status: response.status,
      durationMs,
      details: { tokenType },
    });
    throw new AuthenticationError(`Parcel2Go OAuth returned unexpected token_type: ${tokenType}`);
  }

  const token: CachedToken = {
    accessToken: payload.access_token,
    tokenType,
    expiresAt: Date.now() + payload.expires_in * 1_000,
  };

  cachedToken = token;

  logger.log({
    level: "info",
    provider: logger.provider,
    correlationId: logger.correlationId,
    event: "auth",
    message: "Parcel2Go OAuth token obtained",
    durationMs,
    details: {
      expiresInSeconds: payload.expires_in,
      expiresAt: new Date(token.expiresAt).toISOString(),
      cached: true,
    },
  });

  return token;
}

/** Obtain a valid access token, using cache and renewing before expiry. */
export async function getParcel2GoAccessToken(logger?: ShippingLogger): Promise<string> {
  const authLogger = logger ?? new ShippingLogger("parcel2go");

  if (isCachedTokenValid()) {
    return cachedToken!.accessToken;
  }

  if (!tokenRefreshPromise) {
    tokenRefreshPromise = requestAccessToken(authLogger)
      .then((token) => token.accessToken)
      .finally(() => {
        tokenRefreshPromise = null;
      });
  }

  return tokenRefreshPromise;
}

/** Force a fresh OAuth token (explicit re-authentication). */
export async function authenticateParcel2Go(logger?: ShippingLogger): Promise<void> {
  clearParcel2GoTokenCache();
  await getParcel2GoAccessToken(logger);
}
