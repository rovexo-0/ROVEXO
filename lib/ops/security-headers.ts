export type SecurityHeader = { key: string; value: string };

const isProduction = process.env.NODE_ENV === "production";

/**
 * P11.2 CSP
 * - `'unsafe-eval'` REMOVED (P11.1) — confirmed unnecessary for Stripe.js / Next production.
 * - `'unsafe-inline'` RETAINED on script-src and style-src — see CSP_RESIDUAL_JUSTIFICATIONS.
 * - object-src tightened to `'none'` (was `'self' blob:`).
 * - upgrade-insecure-requests added in production CSP.
 */
export const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://*.js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://merchant-ui-api.stripe.com https://www.google-analytics.com https://region1.google-analytics.com https://nominatim.openstreetmap.org",
  "frame-src 'self' blob: https://checkout.stripe.com https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

/** Documented residual CSP allowances (audit acceptance — P11.2). */
export const CSP_RESIDUAL_JUSTIFICATIONS = {
  "script-src 'unsafe-inline'":
    "REQUIRED: Next.js App Router emits inline bootstrap scripts; Stripe.js/Elements rely on inline bootstrapping. Nonce/hash CSP migration would require root layout + Stripe loader changes (UI/checkout regression risk). Deferred until dedicated CSP nonce sprint.",
  "style-src 'unsafe-inline'":
    "REQUIRED: Component inline styles and third-party widget style attributes (Stripe Elements, Help). Removing breaks Checkout/Help without a full style nonce program.",
  "script-src 'unsafe-eval'": "REMOVED in P11.1 — not required.",
  "Cross-Origin-Embedder-Policy":
    "OMITTED: COEP breaks Stripe Elements / cross-origin payment embeds. Intentionally not set.",
  "Cross-Origin-Resource-Policy":
    "OMITTED: CORP same-origin breaks Supabase/CDN product images and Stripe assets. Intentionally not set.",
} as const;

export function buildSecurityHeaders(production = isProduction): SecurityHeader[] {
  return [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
    ...(production
      ? [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: PRODUCTION_CSP },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ]
      : []),
  ];
}

export const REQUIRED_SECURITY_HEADER_KEYS = [
  "X-Frame-Options",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
] as const;

export const PRODUCTION_SECURITY_HEADER_KEYS = [
  ...REQUIRED_SECURITY_HEADER_KEYS,
  "Strict-Transport-Security",
  "Content-Security-Policy",
  "Cross-Origin-Opener-Policy",
] as const;

export function validateSecurityHeaderConfiguration(production = isProduction): {
  pass: boolean;
  configured: string[];
  missing: string[];
  productionReady: boolean;
  coepCorpOmitted: true;
} {
  const headers = buildSecurityHeaders(production);
  const configured = headers.map((header) => header.key);
  const required = production ? PRODUCTION_SECURITY_HEADER_KEYS : REQUIRED_SECURITY_HEADER_KEYS;
  const missing = required.filter((key) => !configured.includes(key));

  return {
    pass: missing.length === 0,
    configured,
    missing,
    productionReady: production ? missing.length === 0 : true,
    coepCorpOmitted: true,
  };
}
