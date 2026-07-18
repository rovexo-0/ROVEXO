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
  // Static premium assets are served from CDN/public; exclude from serverless traces.
  outputFileTracingExcludes: {
    "/*": ["public/**", "scripts/**", "e2e/**", "tests/**", "mobile/**", ".next/cache/**"],
  },
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
    staticGenerationMaxConcurrency: 6,
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
    // Next 15 rejects any `quality` not in this allowlist. 75 stays the default
    // for cards/thumbnails (small payloads); 90 is used for the full-bleed
    // Product Detail hero + lightbox so detailed photos render crisply instead
    // of showing AVIF compression softness at high-DPR / near-1:1 display sizes.
    qualities: [75, 90],
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
