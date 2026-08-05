import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import { validateMutationOrigin } from "@/lib/api/csrf-guard";
import { enforceRateLimit } from "@/lib/api/rate-limit";

/**
 * P11.2 — Central API perimeter: CSRF Origin + sensitive rate limits.
 * Applied in middleware for all `/api/*` traffic.
 *
 * CSRF EXEMPT (signed / server-to-server — must NOT use browser Origin CSRF):
 * - Stripe / Sendcloud webhooks
 * - Cron Bearer jobs
 * - Auth callback (GET; listed for clarity)
 */

export const API_CSRF_EXEMPT_PREFIXES = [
  "/api/webhooks/",
  "/api/stripe/webhook",
  "/api/cron/",
  "/api/auth/callback",
] as const;

type RateRule = {
  prefix: string;
  scope: string;
  limit: number;
  windowMs: number;
};

/** Longest-prefix match — more specific rules first. */
const SENSITIVE_RATE_RULES: RateRule[] = [
  { prefix: "/api/auth/mfa/", scope: "p112-auth-mfa", limit: 30, windowMs: 60_000 },
  { prefix: "/api/checkout/", scope: "p112-checkout", limit: 40, windowMs: 60_000 },
  { prefix: "/api/orders/checkout", scope: "p112-orders-checkout", limit: 40, windowMs: 60_000 },
  { prefix: "/api/wallet/", scope: "p112-wallet", limit: 40, windowMs: 60_000 },
  { prefix: "/api/payment-methods", scope: "p112-payment-methods", limit: 40, windowMs: 60_000 },
  { prefix: "/api/monetization/", scope: "p112-monetization", limit: 30, windowMs: 60_000 },
  { prefix: "/api/promotions/", scope: "p112-promotions", limit: 40, windowMs: 60_000 },
  { prefix: "/api/offers", scope: "p112-offers", limit: 60, windowMs: 60_000 },
  { prefix: "/api/listings/upload", scope: "p112-listings-upload", limit: 40, windowMs: 60_000 },
  { prefix: "/api/listings", scope: "p112-listings", limit: 60, windowMs: 60_000 },
  { prefix: "/api/sell/", scope: "p112-sell", limit: 60, windowMs: 60_000 },
  { prefix: "/api/messages", scope: "p112-messages", limit: 120, windowMs: 60_000 },
  { prefix: "/api/saved", scope: "p112-saved", limit: 90, windowMs: 60_000 },
  { prefix: "/api/search", scope: "p112-search", limit: 180, windowMs: 60_000 },
  { prefix: "/api/ai/", scope: "p112-ai", limit: 30, windowMs: 60_000 },
  { prefix: "/api/users/report", scope: "p112-users-report", limit: 20, windowMs: 60_000 },
  { prefix: "/api/listings/report", scope: "p112-listings-report", limit: 20, windowMs: 60_000 },
  { prefix: "/api/support", scope: "p112-support", limit: 30, windowMs: 60_000 },
  { prefix: "/api/marketplace-os/", scope: "p112-marketplace-os", limit: 60, windowMs: 60_000 },
  { prefix: "/api/admin/", scope: "p112-admin", limit: 90, windowMs: 60_000 },
  { prefix: "/api/super-admin/", scope: "p112-super-admin", limit: 90, windowMs: 60_000 },
  { prefix: "/api/staff-enterprise/", scope: "p112-staff", limit: 90, windowMs: 60_000 },
  { prefix: "/api/notifications", scope: "p112-notifications", limit: 120, windowMs: 60_000 },
  { prefix: "/api/follows", scope: "p112-follows", limit: 60, windowMs: 60_000 },
  { prefix: "/api/reviews", scope: "p112-reviews", limit: 40, windowMs: 60_000 },
];

export function isApiCsrfExempt(pathname: string): boolean {
  return API_CSRF_EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );
}

function matchSensitiveRateRule(pathname: string): RateRule | null {
  for (const rule of SENSITIVE_RATE_RULES) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix)) {
      return rule;
    }
  }
  return null;
}

/**
 * Fail-closed perimeter for `/api/*`.
 * Returns a blocking NextResponse, or null to continue.
 */
export async function enforceApiPerimeterSecurity(
  request: NextRequest | Request,
): Promise<NextResponse | null> {
  const pathname =
    request instanceof Request && "nextUrl" in request && request.nextUrl
      ? (request as NextRequest).nextUrl.pathname
      : new URL(request.url).pathname;
  if (!pathname.startsWith("/api/")) {
    return null;
  }

  const rateRule = matchSensitiveRateRule(pathname);
  if (rateRule) {
    const limited = await enforceRateLimit(
      request,
      rateRule.scope,
      rateRule.limit,
      rateRule.windowMs,
    );
    if (limited) {
      return limited;
    }
  }

  if (isApiCsrfExempt(pathname)) {
    return null;
  }

  return validateMutationOrigin(request);
}

export const API_PERIMETER_SECURITY_V1 = {
  version: "p11.2-v1",
  csrfExemptPrefixes: API_CSRF_EXEMPT_PREFIXES,
  sensitiveRateRuleCount: SENSITIVE_RATE_RULES.length,
} as const;
