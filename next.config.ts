import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPerformanceRouteHeaders } from "./lib/ops/performance-headers";
import { buildSecurityHeaders } from "./lib/ops/security-headers";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function supabaseImageHostnames(): string[] {
  const hostnames = new Set<string>(["pklotmwxtnnepaitedic.supabase.co"]);
  const configured =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim();
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
const securityHeaders = buildSecurityHeaders(isProduction);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  // Pin workspace root so Next.js does not pick up parent lockfiles on Windows.
  outputFileTracingRoot: projectRoot,
  /**
   * Serverless NFT size guard (Preview/Production).
   *
   * Route key MUST be `*` (not only `/*`): Next traces `instrumentation` without a
   * leading slash, and `/*` does not match it — so heavy repo trees were previously
   * bundled into every function (~800MB+), exceeding Vercel’s 250MB limit.
   *
   * Excludes: build/QA/docs/heavy asset trees that must never ship in lambdas.
   * Startup blood-law source files are injected post-build by
   * `scripts/ensure-startup-trace-files.mjs` (surgical — avoids NFT bloat).
   */
  outputFileTracingExcludes: {
    "*": [
      "./public/**/source/**/*",
      "./public/icons/premium-studio/**/*",
      "./public/icons/fluency-3d/**/*",
      "./public/icons/premium/**/*",
      "./public/assets/empty-states/**/*",
      "./public/hero/**/*",
      "./public/demo/**/*",
      "./lighthouse*.json",
      "./e2e-cert-run.log",
      "./*.log",
      "./scripts/**/*",
      "./e2e/**/*",
      "./tests/**/*",
      "./mobile/**/*",
      "./docs/**/*",
      "./reports/**/*",
      "./archive/**/*",
      "./apps/**/*",
      "./owner-review-screenshots/**/*",
      "./audit-captures/**/*",
      "./audit-captures-auth/**/*",
      "./test-results/**/*",
      "./playwright-report/**/*",
      "./.cursor/**/*",
      "./.next/cache/**/*",
      "./.git/**/*",
      "./.local-chromium-libs/**/*",
      "./node_modules/@sparticuz/**/*",
      "./node_modules/playwright/**/*",
      "./node_modules/playwright-core/**/*",
      "./node_modules/@playwright/**/*",
      "./node_modules/typescript/**/*",
      "./node_modules/@typescript-eslint/**/*",
      "./node_modules/eslint/**/*",
      "./node_modules/eslint-config-next/**/*",
      "./node_modules/vitest/**/*",
      "./node_modules/jsdom/**/*",
      "./node_modules/@axe-core/**/*",
    ],
  },
  // Large Super Admin / location matrices can exceed the default 60s when the
  // worker pool is saturated. Prefer finishing a correct production build over
  // aborting at 60s — pages stay fail-closed at runtime.
  staticPageGenerationTimeout: 180,
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "react-hook-form", "@hookform/resolvers"],
    // Windows/Turbopack production hardening: the compile phase writes all SSR
    // chunks up front, but during "Generating static pages" a parallel worker can
    // transiently fail to require() an already-emitted chunk (Windows file-handle
    // / antivirus locking), surfacing as a ChunkLoadError / MODULE_NOT_FOUND on a
    // chunk that exists on disk. Retrying the affected page lets the worker read
    // the now-unlocked file. Capping pages-per-worker reduces concurrent file
    // contention so the race is far less likely to occur in the first place.
    staticGenerationRetryCount: 3,
    staticGenerationMaxConcurrency: 2,
  },
  ...(isProduction
    ? {
        compiler: {
          removeConsole: { exclude: ["error", "warn"] },
        },
      }
    : {}),
  // Origins allowed to request dev-only assets/HMR in `next dev`. Next.js blocks
  // cross-origin dev requests by default; when a physical device (e.g. an iPhone)
  // loads the dev server via a LAN IP such as http://192.168.x.x:3000, the dev
  // client bundle is blocked, so React never hydrates and the page renders but is
  // completely non-interactive. Allow localhost + private LAN ranges so on-device
  // testing works. This is dev-only and has no effect on production.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.*.*",
    "10.*.*.*",
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
  ],
  images: {
    // Serve AVIF/WebP where supported so product thumbnails ship far smaller
    // payloads on mobile. Product images are immutable (unique filenames), so the
    // optimized results are cached for 30 days to avoid re-optimizing and let
    // browsers reuse cached images across repeat visits.
    formats: ["image/avif", "image/webp"],
    // Next 16 rejects any `quality` not in this allowlist. 75 stays the default
    // for cards/thumbnails (small payloads); 90 is used for the full-bleed
    // Product Detail hero + lightbox; 100 is used for official brand marks
    // (header app icon / auth primary emblem) with no visual degradation.
    qualities: [75, 90, 100],
    minimumCacheTTL: 2592000,
    remotePatterns: [
      ...supabaseImageHostnames().map((hostname) => ({
        protocol: "https" as const,
        hostname,
      })),
      // Demo-environment avatars (search overlays, seller cards in E2E/demo mode).
      {
        protocol: "https" as const,
        hostname: "api.dicebear.com",
        pathname: "/7.x/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/business", destination: "/business/dashboard", permanent: true },
      { source: "/business/center", destination: "/business/dashboard", permanent: true },
      { source: "/account/orders", destination: "/orders", permanent: true },
      { source: "/account/orders/:path*", destination: "/orders/:path*", permanent: true },
      { source: "/account/wallet", destination: "/wallet", permanent: true },
      { source: "/account/wallet/:path*", destination: "/wallet/:path*", permanent: true },
      { source: "/seller/wallet", destination: "/wallet", permanent: true },
      { source: "/seller/wallet/:path*", destination: "/wallet/:path*", permanent: true },
      { source: "/balance", destination: "/wallet", permanent: true },
      { source: "/payments", destination: "/wallet", permanent: true },
      { source: "/legal/terms", destination: "/legal/terms-and-conditions", permanent: true },
      { source: "/legal/privacy", destination: "/legal/privacy-policy", permanent: true },
      { source: "/legal/cookies", destination: "/legal/cookie-policy", permanent: true },
      { source: "/item/:slug", destination: "/listing/:slug", permanent: true },
      { source: "/products/:slug", destination: "/listing/:slug", permanent: true },
      { source: "/product/:slug", destination: "/listing/:slug", permanent: true },
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
      ...buildPerformanceRouteHeaders(),
    ];
  },
};

export default nextConfig;
