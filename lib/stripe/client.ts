import {
  isStripeLiveKey,
  isStripeLiveRuntimeAllowed,
  isStripeTestKey,
  parseRuntimeContextFromOrigin,
  resolveStripeKeyMode,
  type StripeKeyMode,
  type StripeRuntimeContext,
} from "@/lib/stripe/runtime-mode-v1";

/**
 * Next.js only inlines NEXT_PUBLIC_* when accessed as static property paths.
 */
function readPrimaryPublishableKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  return key || undefined;
}

function readTestPublishableKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST?.trim();
  return key || undefined;
}

function browserRuntimeContext(): StripeRuntimeContext | null {
  if (typeof window === "undefined") return null;
  return {
    hostname: window.location.hostname,
    protocol: window.location.protocol,
  };
}

/**
 * Prefer the browser location (actual serve host). Fall back to public app URL
 * only when window is unavailable (should not happen for loadStripe paths).
 */
function resolveClientRuntimeContext(): StripeRuntimeContext {
  const fromBrowser = browserRuntimeContext();
  if (fromBrowser) return fromBrowser;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "http://localhost:3000";
  return (
    parseRuntimeContextFromOrigin(appUrl) ?? {
      hostname: "localhost",
      protocol: "http:",
    }
  );
}

function pickPublishableKeyForMode(mode: StripeKeyMode): string {
  const primary = readPrimaryPublishableKey();
  const testAlias = readTestPublishableKey();

  if (mode === "test") {
    if (testAlias && isStripeTestKey(testAlias)) return testAlias;
    if (primary && isStripeTestKey(primary)) return primary;
    if (primary && isStripeLiveKey(primary)) {
      throw new Error(
        "Stripe LIVE publishable key is blocked on localhost/LAN/HTTP. " +
          "Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_… for development.",
      );
    }
    throw new Error(
      "Stripe TEST publishable key is not configured. " +
        "Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_test_…).",
    );
  }

  // LIVE mode — HTTPS production domain only
  if (primary && isStripeLiveKey(primary)) return primary;
  if (primary && isStripeTestKey(primary)) {
    // Production misconfigured with test key only — do not invent a live key
    return primary;
  }
  throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured.");
}

export function getStripeKeyMode(): StripeKeyMode {
  return resolveStripeKeyMode(resolveClientRuntimeContext());
}

/**
 * Publishable key for Stripe.js. Automatically uses TEST on localhost / LAN / HTTP.
 * LIVE only when the app is served over HTTPS on the production domain.
 * Never initializes Stripe LIVE over HTTP.
 */
export function getStripePublishableKey(): string {
  const ctx = resolveClientRuntimeContext();
  const mode = resolveStripeKeyMode(ctx);
  const key = pickPublishableKeyForMode(mode);

  if (isStripeLiveKey(key) && !isStripeLiveRuntimeAllowed(ctx)) {
    throw new Error(
      "Refusing to initialize Stripe LIVE publishable key outside HTTPS production.",
    );
  }

  return key;
}

export function isStripePublishableKeyConfigured(): boolean {
  try {
    const mode = getStripeKeyMode();
    const primary = readPrimaryPublishableKey();
    const testAlias = readTestPublishableKey();
    if (mode === "test") {
      return Boolean(
        (testAlias && isStripeTestKey(testAlias)) ||
          (primary && isStripeTestKey(primary)),
      );
    }
    return Boolean(primary);
  } catch {
    return false;
  }
}
