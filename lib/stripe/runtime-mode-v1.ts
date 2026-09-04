/**
 * Stripe runtime key mode — configuration gate (not UI).
 *
 * LIVE keys only on HTTPS + official production domain.
 * localhost / LAN / HTTP → TEST only. Never initialize Stripe LIVE over HTTP.
 */

export type StripeKeyMode = "test" | "live";

export type StripeRuntimeContext = {
  hostname: string;
  protocol: string;
};

/** Official production hosts allowed to use Stripe LIVE keys. */
export const STRIPE_LIVE_PRODUCTION_HOSTS = [
  "www.rovexo.co.uk",
  "rovexo.co.uk",
] as const;

export function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, "").split(":")[0] ?? "";
}

export function normalizeProtocol(protocol: string): "http" | "https" | "other" {
  const p = protocol.trim().toLowerCase().replace(/:$/, "");
  if (p === "http") return "http";
  if (p === "https") return "https";
  return "other";
}

/**
 * Development / private network hosts — must never use Stripe LIVE.
 * localhost · 127.0.0.1 · ::1 · 192.168.x.x · 10.x.x.x · 172.16–31.x.x
 */
export function isDevelopmentOrLanHostname(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  if (!host) return true;

  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]"
  ) {
    return true;
  }

  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;

  const m = /^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(host);
  if (m) {
    const second = Number(m[1]);
    if (second >= 16 && second <= 31) return true;
  }

  return false;
}

export function isOfficialProductionStripeHost(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  return (STRIPE_LIVE_PRODUCTION_HOSTS as readonly string[]).includes(host);
}

/**
 * Stripe publishable/secret keys are long opaque tokens.
 * Reject stubs like `sk_test_...` that only match the prefix — those cause
 * "Invalid API Key" at Confirm & Pay instead of a clear not-configured error.
 */
const MIN_STRIPE_KEY_LENGTH = 80;

function isPlausibleStripeKey(key: string): boolean {
  if (key.length < MIN_STRIPE_KEY_LENGTH) return false;
  if (key.includes("...")) return false;
  if (/placeholder/i.test(key)) return false;
  return true;
}

export function isStripeLiveKey(key: string | undefined | null): boolean {
  const k = key?.trim() ?? "";
  if (!isPlausibleStripeKey(k)) return false;
  return k.startsWith("pk_live_") || k.startsWith("sk_live_");
}

export function isStripeTestKey(key: string | undefined | null): boolean {
  const k = key?.trim() ?? "";
  if (!isPlausibleStripeKey(k)) return false;
  return k.startsWith("pk_test_") || k.startsWith("sk_test_");
}

/**
 * LIVE allowed only when served over HTTPS on the official production domain.
 * Never over HTTP. Never on localhost / LAN.
 */
export function isStripeLiveRuntimeAllowed(ctx: StripeRuntimeContext): boolean {
  const protocol = normalizeProtocol(ctx.protocol);
  const hostname = normalizeHostname(ctx.hostname);

  if (protocol !== "https") return false;
  if (!hostname || isDevelopmentOrLanHostname(hostname)) return false;
  if (!isOfficialProductionStripeHost(hostname)) return false;
  return true;
}

/**
 * Resolve test vs live from the actual serve host/protocol.
 * Optional Node signals keep Vercel preview / `next dev` on TEST even if APP_URL is wrong.
 */
export function resolveStripeKeyMode(
  ctx: StripeRuntimeContext,
  options?: {
    nodeEnv?: string | undefined;
    vercelEnv?: string | undefined;
  },
): StripeKeyMode {
  const nodeEnv = options?.nodeEnv ?? (typeof process !== "undefined" ? process.env.NODE_ENV : undefined);
  const vercelEnv =
    options?.vercelEnv ?? (typeof process !== "undefined" ? process.env.VERCEL_ENV : undefined);

  // Local / non-production Node — always TEST
  if (nodeEnv && nodeEnv !== "production") return "test";

  // Vercel preview / development deployments — always TEST
  if (vercelEnv && vercelEnv !== "production") return "test";

  if (!isStripeLiveRuntimeAllowed(ctx)) return "test";
  return "live";
}

export function parseRuntimeContextFromOrigin(origin: string): StripeRuntimeContext | null {
  try {
    const url = new URL(origin.includes("://") ? origin : `https://${origin}`);
    return {
      hostname: url.hostname,
      protocol: url.protocol,
    };
  } catch {
    return null;
  }
}
