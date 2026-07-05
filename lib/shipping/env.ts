import "server-only";

const SHIPPO_ENV_KEY = "SHIPPO_API_KEY";

export function isShippoConfigured(): boolean {
  return Boolean(process.env[SHIPPO_ENV_KEY]?.trim());
}

/** Server-side only — never import from client components. */
export function getShippoApiKey(): string {
  const apiKey = process.env[SHIPPO_ENV_KEY]?.trim();
  if (!apiKey) {
    throw new Error(
      "SHIPPO_API_KEY is not configured. Set it in .env.local (local development) or Vercel environment variables (production). Never expose this key to the browser.",
    );
  }
  return apiKey;
}

/** Optional webhook verification token — server-side only. */
export function getShippoWebhookToken(): string | null {
  return process.env.SHIPPO_WEBHOOK_TOKEN?.trim() || null;
}

function shouldSkipShippoStartupValidation(): boolean {
  return (
    process.env.VITEST === "true" ||
    process.env.NODE_ENV === "test" ||
    process.env.PLAYWRIGHT_E2E === "1"
  );
}

/**
 * Validates Shippo configuration when the Node.js server starts.
 * Production fails fast; development logs a warning so local work can continue.
 */
export function validateShippoEnvironmentOnStartup(): void {
  if (shouldSkipShippoStartupValidation()) return;

  if (isShippoConfigured()) return;

  const message =
    "SHIPPO_API_KEY is not configured. Add SHIPPO_API_KEY to .env.local (local) or Vercel environment variables (production). All Shippo requests are server-side only — never expose this key to the frontend.";

  if (process.env.NODE_ENV === "production") {
    throw new Error(message);
  }

  console.warn(`[shipping] ${message}`);
}
