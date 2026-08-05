export type PerformanceHeader = { key: string; value: string };

export const STATIC_ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable";

export function buildStaticAssetCacheHeaders(): PerformanceHeader[] {
  return [{ key: "Cache-Control", value: STATIC_ASSET_CACHE_CONTROL }];
}

export function buildPerformanceRouteHeaders(): Array<{
  source: string;
  headers: PerformanceHeader[];
}> {
  const immutable = buildStaticAssetCacheHeaders();
  return [
    { source: "/icons/:path*", headers: immutable },
    { source: "/fonts/:path*", headers: immutable },
    { source: "/images/:path*", headers: immutable },
    { source: "/brand/:path*", headers: immutable },
    { source: "/categories/:path*", headers: immutable },
    { source: "/search/:path*", headers: immutable },
    { source: "/assets/:path*", headers: immutable },
    { source: "/placeholder-product.svg", headers: immutable },
    { source: "/favicon.ico", headers: immutable },
    { source: "/favicon.svg", headers: immutable },
    { source: "/apple-touch-icon.png", headers: immutable },
    { source: "/apple-icon.png", headers: immutable },
  ];
}

export function validatePerformanceHeaderConfiguration(): {
  pass: boolean;
  routes: string[];
  missing: string[];
} {
  const routes = buildPerformanceRouteHeaders().map((entry) => entry.source);
  const required = [
    "/icons/:path*",
    "/fonts/:path*",
    "/brand/:path*",
    "/categories/:path*",
  ];
  const missing = required.filter((route) => !routes.includes(route));

  return {
    pass: missing.length === 0,
    routes,
    missing,
  };
}
