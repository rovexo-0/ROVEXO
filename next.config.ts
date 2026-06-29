import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPerformanceRouteHeaders } from "./lib/ops/performance-headers";
import { buildSecurityHeaders } from "./lib/ops/security-headers";

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
const securityHeaders = buildSecurityHeaders(isProduction);

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
    optimizePackageImports: ["lucide-react", "react-hook-form", "@hookform/resolvers"],
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
      ...buildPerformanceRouteHeaders(),
    ];
  },
};

export default nextConfig;
