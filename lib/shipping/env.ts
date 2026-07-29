import "server-only";

const PUBLIC_KEY_ENV = "SENDCLOUD_PUBLIC_KEY";
const SECRET_KEY_ENV = "SENDCLOUD_SECRET_KEY";
const WEBHOOK_SECRET_ENV = "SENDCLOUD_WEBHOOK_SECRET";
const BASE_URL_ENV = "SENDCLOUD_BASE_URL";

export const SENDCLOUD_DEFAULT_BASE_URL = "https://panel.sendcloud.sc/api/v2";

export function isSendcloudConfigured(): boolean {
  return Boolean(
    process.env[PUBLIC_KEY_ENV]?.trim() && process.env[SECRET_KEY_ENV]?.trim(),
  );
}

/** Server-side only — never import from client components. */
export function getSendcloudPublicKey(): string {
  const key = process.env[PUBLIC_KEY_ENV]?.trim();
  if (!key) {
    throw new Error(
      "SENDCLOUD_PUBLIC_KEY is not configured. Set it in .env.local or Vercel environment variables.",
    );
  }
  return key;
}

/** Server-side only — never import from client components. */
export function getSendcloudSecretKey(): string {
  const key = process.env[SECRET_KEY_ENV]?.trim();
  if (!key) {
    throw new Error(
      "SENDCLOUD_SECRET_KEY is not configured. Set it in .env.local or Vercel environment variables.",
    );
  }
  return key;
}

export function getSendcloudBaseUrl(): string {
  const configured = process.env[BASE_URL_ENV]?.trim();
  if (!configured) return SENDCLOUD_DEFAULT_BASE_URL;
  return configured.replace(/\/+$/, "");
}

/**
 * Webhook verification secret — server-side only.
 * Required before any Sendcloud webhook may be processed (fail-closed).
 */
export function getSendcloudWebhookSecret(): string | null {
  return process.env[WEBHOOK_SECRET_ENV]?.trim() || null;
}

export function isSendcloudWebhookSecretConfigured(): boolean {
  return Boolean(getSendcloudWebhookSecret());
}

function shouldSkipSendcloudStartupValidation(): boolean {
  return (
    process.env.VITEST === "true" ||
    process.env.NODE_ENV === "test" ||
    process.env.PLAYWRIGHT_E2E === "1"
  );
}

/**
 * Validates Sendcloud configuration when the Node.js server starts.
 * Production fails fast; development logs a warning so local work can continue.
 * When API keys are present in production, WEBHOOK_SECRET is also required
 * (live tracking webhooks must never run unsigned).
 */
export function validateSendcloudEnvironmentOnStartup(): void {
  if (shouldSkipSendcloudStartupValidation()) return;

  if (!isSendcloudConfigured()) {
    const message =
      "Sendcloud is not configured. Set SENDCLOUD_PUBLIC_KEY and SENDCLOUD_SECRET_KEY in .env.local (local) or Vercel environment variables (production). All Sendcloud requests are server-side only.";

    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }

    console.warn(`[shipping] ${message}`);
    return;
  }

  if (!isSendcloudWebhookSecretConfigured()) {
    const webhookMessage =
      "SENDCLOUD_WEBHOOK_SECRET is not configured. Set it before enabling Sendcloud webhooks. Unsigned webhooks are rejected.";

    if (process.env.NODE_ENV === "production") {
      throw new Error(webhookMessage);
    }

    console.warn(`[shipping] ${webhookMessage}`);
  }
}
