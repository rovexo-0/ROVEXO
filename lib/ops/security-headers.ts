export type SecurityHeader = { key: string; value: string };

const isProduction = process.env.NODE_ENV === "production";

export const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://www.google-analytics.com https://region1.google-analytics.com https://nominatim.openstreetmap.org",
  "frame-src https://checkout.stripe.com https://js.stripe.com",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join("; ");

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
] as const;

export function validateSecurityHeaderConfiguration(production = isProduction): {
  pass: boolean;
  configured: string[];
  missing: string[];
  productionReady: boolean;
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
  };
}
