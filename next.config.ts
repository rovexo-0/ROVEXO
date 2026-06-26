import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function supabaseImageHostnames(): string[] {
  const hostnames = new Set<string>(["pklotmwxtnnepaitedic.supabase.co"]);
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (configured) {
    try {
      hostnames.add(new URL(configured).hostname);
    } catch {
      // ignore invalid URL at build time
    }
  }
  return [...hostnames];
}

const isProduction = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://www.google-analytics.com https://region1.google-analytics.com",
            "frame-src https://checkout.stripe.com https://js.stripe.com",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; "),
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  // Pin workspace root so Next.js does not pick up parent lockfiles on Windows.
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  ...(isProduction
    ? {
        compiler: {
          removeConsole: { exclude: ["error", "warn"] },
        },
      }
    : {}),
  // Allow these origins in dev for HMR and dev resources when Playwright uses localhost/127.0.0.1
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...supabaseImageHostnames().map((hostname) => ({
        protocol: "https" as const,
        hostname,
      })),
    ],
  },
  async redirects() {
    return [
      { source: "/business", destination: "/business/center", permanent: true },
      { source: "/account/orders", destination: "/orders", permanent: true },
      { source: "/account/orders/:path*", destination: "/orders/:path*", permanent: true },
      { source: "/account/wallet", destination: "/seller/wallet", permanent: true },
      { source: "/account/wallet/:path*", destination: "/seller/wallet/:path*", permanent: true },
      { source: "/item/:slug", destination: "/listing/:slug", permanent: true },
      { source: "/cars", destination: "/browse/cars", permanent: true },
      { source: "/cars/:path*", destination: "/browse/cars/:path*", permanent: true },
      { source: "/phones", destination: "/browse/phones", permanent: true },
      { source: "/phones/:path*", destination: "/browse/phones/:path*", permanent: true },
      { source: "/bedding", destination: "/browse/bedding", permanent: true },
      { source: "/bedding/:path*", destination: "/browse/bedding/:path*", permanent: true },
      { source: "/tools/:path*", destination: "/browse/tools/:path*", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
