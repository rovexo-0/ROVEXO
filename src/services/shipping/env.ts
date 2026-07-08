import "server-only";

const ENV_KEYS = {
  clientId: "PARCEL2GO_CLIENT_ID",
  clientSecret: "PARCEL2GO_CLIENT_SECRET",
  authUrl: "PARCEL2GO_AUTH_URL",
  apiUrl: "PARCEL2GO_API_URL",
  webhookSecret: "PARCEL2GO_WEBHOOK_SECRET",
} as const;

/** Official Parcel2Go production endpoints (https://www.parcel2go.com/api/docs). */
export const PARCEL2GO_PRODUCTION_AUTH_URL = "https://www.parcel2go.com/auth";
export const PARCEL2GO_PRODUCTION_API_URL = "https://www.parcel2go.com";
export const PARCEL2GO_SANDBOX_AUTH_URL = "https://sandbox.parcel2go.com/auth";
export const PARCEL2GO_SANDBOX_API_URL = "https://sandbox.parcel2go.com";

export const PARCEL2GO_TOKEN_PATH = "/auth/connect/token";

function readEnv(key: string): string | null {
  const value = process.env[key]?.trim();
  return value || null;
}

function required(label: string, value: string | null): string {
  if (!value) {
    throw new Error(
      `${label} is not configured. Set it in .env.local (local development) or deployment environment variables. Never expose Parcel2Go credentials to the frontend.`,
    );
  }
  return value;
}

export function isParcel2GoConfigured(): boolean {
  return Boolean(
    readEnv(ENV_KEYS.clientId) &&
      readEnv(ENV_KEYS.clientSecret) &&
      readEnv(ENV_KEYS.authUrl) &&
      readEnv(ENV_KEYS.apiUrl),
  );
}

export function getParcel2GoClientId(): string {
  return required(ENV_KEYS.clientId, readEnv(ENV_KEYS.clientId));
}

export function getParcel2GoClientSecret(): string {
  return required(ENV_KEYS.clientSecret, readEnv(ENV_KEYS.clientSecret));
}

export function getParcel2GoAuthUrl(): string {
  return normalizeParcel2GoAuthUrl(required(ENV_KEYS.authUrl, readEnv(ENV_KEYS.authUrl)));
}

export function getParcel2GoApiUrl(): string {
  return normalizeParcel2GoApiUrl(required(ENV_KEYS.apiUrl, readEnv(ENV_KEYS.apiUrl)));
}

export function getParcel2GoWebhookSecret(): string | null {
  return readEnv(ENV_KEYS.webhookSecret);
}

/**
 * Resolves the official Parcel2Go OAuth token endpoint: POST /auth/connect/token.
 * Accepts PARCEL2GO_AUTH_URL as auth base (`…/auth`) or site root (`…parcel2go.com`).
 */
export function getParcel2GoTokenUrl(): string {
  const authBase = getParcel2GoAuthUrl();

  if (authBase.endsWith("/connect/token")) {
    return authBase;
  }

  if (authBase.endsWith("/auth")) {
    return `${authBase}/connect/token`;
  }

  return `${authBase}${PARCEL2GO_TOKEN_PATH}`;
}

export function detectParcel2GoEnvironment(
  apiUrl: string | null = tryGetParcel2GoApiUrl(),
): "production" | "sandbox" | "unknown" {
  if (!apiUrl) return "unknown";
  const normalized = apiUrl.toLowerCase();
  if (normalized.includes("sandbox.parcel2go.com")) return "sandbox";
  if (
    normalized.includes("www.parcel2go.com") ||
    normalized.includes("api.parcel2go.com") ||
    normalized === "https://parcel2go.com"
  ) {
    return "production";
  }
  return "unknown";
}

export function tryGetParcel2GoAuthUrl(): string | null {
  const value = readEnv(ENV_KEYS.authUrl);
  return value ? normalizeParcel2GoAuthUrl(value) : null;
}

export function tryGetParcel2GoApiUrl(): string | null {
  const value = readEnv(ENV_KEYS.apiUrl);
  return value ? normalizeParcel2GoApiUrl(value) : null;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function normalizeParcel2GoAuthUrl(url: string): string {
  const normalized = normalizeBaseUrl(url).toLowerCase();
  if (normalized === "https://api.parcel2go.com/auth") {
    return PARCEL2GO_PRODUCTION_AUTH_URL;
  }
  return normalizeBaseUrl(url);
}

function normalizeParcel2GoApiUrl(url: string): string {
  const normalized = normalizeBaseUrl(url).toLowerCase();
  if (normalized === "https://api.parcel2go.com") {
    return PARCEL2GO_PRODUCTION_API_URL;
  }
  return normalizeBaseUrl(url);
}

function shouldSkipParcel2GoStartupValidation(): boolean {
  return (
    process.env.VITEST === "true" ||
    process.env.NODE_ENV === "test" ||
    process.env.PLAYWRIGHT_E2E === "1"
  );
}

/**
 * Validates Parcel2Go configuration when the Node.js server starts.
 * Production fails fast; development logs a warning so local work can continue.
 */
export function validateParcel2GoEnvironmentOnStartup(): void {
  if (shouldSkipParcel2GoStartupValidation()) return;

  if (isParcel2GoConfigured()) return;

  const message =
    "Parcel2Go is not fully configured. Set PARCEL2GO_CLIENT_ID, PARCEL2GO_CLIENT_SECRET, PARCEL2GO_AUTH_URL, and PARCEL2GO_API_URL in .env.local (local) or deployment environment variables. All Parcel2Go credentials are server-side only — never expose them to the frontend.";

  if (process.env.NODE_ENV === "production") {
    throw new Error(message);
  }

  console.warn(`[shipping] ${message}`);
}
