import Stripe from "stripe";
import { headers as nextHeaders } from "next/headers";
import { getAppUrl } from "@/lib/supabase/env";
import {
  isStripeLiveKey,
  isStripeLiveRuntimeAllowed,
  isStripeTestKey,
  isDevelopmentOrLanHostname,
  parseRuntimeContextFromOrigin,
  resolveStripeKeyMode,
  type StripeKeyMode,
  type StripeRuntimeContext,
} from "@/lib/stripe/runtime-mode-v1";

const stripeClients: Partial<Record<StripeKeyMode, Stripe>> = {};

function readPrimarySecretKey(): string | undefined {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key || undefined;
}

function readTestSecretKey(): string | undefined {
  const key = process.env.STRIPE_SECRET_KEY_TEST?.trim();
  return key || undefined;
}

/**
 * Server runtime context when no request host is available.
 * Prefer request-bound context via getStripeClient({ hostname, protocol }).
 *
 * Fail closed: without a verified HTTPS production host, mode is TEST.
 * Vercel production uses APP_URL + VERCEL_ENV=production for LIVE.
 * Local `next start` with a production APP_URL still stays TEST unless
 * VERCEL_ENV=production (real deploy) — never init LIVE over HTTP/LAN.
 */
function resolveServerRuntimeContext(
  override?: Partial<StripeRuntimeContext>,
): StripeRuntimeContext {
  if (override?.hostname && override?.protocol) {
    return {
      hostname: override.hostname,
      protocol: override.protocol,
    };
  }

  const fromApp = parseRuntimeContextFromOrigin(getAppUrl());
  if (fromApp) {
    // If APP_URL claims production HTTPS but we are not on Vercel production,
    // force a non-live host so local next start cannot initialize LIVE.
    const vercelEnv = process.env.VERCEL_ENV;
    if (
      vercelEnv !== "production" &&
      isStripeLiveRuntimeAllowed(fromApp) &&
      process.env.STRIPE_LIVE_RUNTIME !== "1"
    ) {
      return { hostname: "localhost", protocol: "http:" };
    }
    return fromApp;
  }

  return { hostname: "localhost", protocol: "http:" };
}

function pickSecretKeyForMode(mode: StripeKeyMode): string {
  const primary = readPrimarySecretKey();
  const testAlias = readTestSecretKey();

  if (mode === "test") {
    if (testAlias && isStripeTestKey(testAlias)) return testAlias;
    if (primary && isStripeTestKey(primary)) return primary;
    if (primary && isStripeLiveKey(primary)) {
      throw new Error(
        "Stripe LIVE secret key is blocked on localhost/LAN/HTTP. " +
          "Set STRIPE_SECRET_KEY_TEST=sk_test_… for development.",
      );
    }
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (primary && isStripeLiveKey(primary)) return primary;
  if (primary && isStripeTestKey(primary)) return primary;
  throw new Error("STRIPE_SECRET_KEY is not configured.");
}

export function isStripeConfigured(): boolean {
  try {
    const mode = resolveStripeKeyMode(resolveServerRuntimeContext());
    const primary = readPrimarySecretKey();
    const testAlias = readTestSecretKey();
    if (mode === "test") {
      return Boolean(
        (testAlias && isStripeTestKey(testAlias)) ||
          (primary && isStripeTestKey(primary)),
      );
    }
    return Boolean(primary);
  } catch {
    return Boolean(readPrimarySecretKey() || readTestSecretKey());
  }
}

export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isStripeRequired(): boolean {
  return isProductionEnvironment() && !isStripeConfigured();
}

export function getStripeKeyMode(runtime?: Partial<StripeRuntimeContext>): StripeKeyMode {
  return resolveStripeKeyMode(resolveServerRuntimeContext(runtime));
}

/**
 * Stripe secret client. Automatically uses TEST on localhost / LAN / HTTP / non-prod.
 * LIVE only when HTTPS production domain is verified (Vercel production or STRIPE_LIVE_RUNTIME=1).
 * Never initializes Stripe LIVE over HTTP.
 */
export function getStripeClient(runtime?: Partial<StripeRuntimeContext>): Stripe {
  const ctx = resolveServerRuntimeContext(runtime);
  const mode = resolveStripeKeyMode(ctx);
  const secretKey = pickSecretKeyForMode(mode);

  if (isStripeLiveKey(secretKey) && !isStripeLiveRuntimeAllowed(ctx)) {
    throw new Error(
      "Refusing to initialize Stripe LIVE secret key outside HTTPS production.",
    );
  }

  const existing = stripeClients[mode];
  if (existing) return existing;

  const client = new Stripe(secretKey, {
    apiVersion: "2025-12-15.clover",
  });
  stripeClients[mode] = client;
  return client;
}

export function getStripeWebhookSecret(): string {
  const mode = getStripeKeyMode();
  const liveSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const testSecret = process.env.STRIPE_WEBHOOK_SECRET_TEST?.trim();

  if (mode === "test") {
    const secret = testSecret || liveSecret;
    if (!secret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
    }
    return secret;
  }

  if (!liveSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  return liveSecret;
}

export async function getAppBaseUrl(): Promise<string> {
  // Vercel Production never honors loopback/LAN Origin spoofing.
  if (process.env.VERCEL_ENV === "production") {
    return getAppUrl();
  }

  // LAN / localhost certification: avoid phone-visible loopback URLs.
  // Prefer the origin the PWA is actually running from (Origin/Referer),
  // falling back to the request host only when it is a dev/LAN host.
  try {
    const hdrs = await nextHeaders();
    const host = hdrs.get("host");
    const originHeader = hdrs.get("origin");
    const refererHeader = hdrs.get("referer");
    const xForwardedHost = hdrs.get("x-forwarded-host");
    if (!host) return getAppUrl();

    const xForwardedProto = hdrs.get("x-forwarded-proto");
    const proto = xForwardedProto?.split(",")[0]?.trim() ?? "http";

    const candidates = [originHeader, refererHeader, xForwardedHost, host]
      .map((value) => (value ? value.trim() : value))
      .filter((value): value is string => Boolean(value));

    for (const candidate of candidates) {
      try {
        const url = new URL(
          candidate.includes("://") ? candidate : `${proto}://${candidate}`,
        );
        if (isDevelopmentOrLanHostname(url.hostname)) {
          return url.origin;
        }
      } catch {
        // Ignore and try next candidate.
      }
    }
  } catch {
    // Fail open to the canonical env-based app URL.
  }

  return getAppUrl();
}
