export type PerformanceHeader = { key: string; value: string };

export const STATIC_ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable";

export function buildStaticAssetCacheHeaders(): PerformanceHeader[] {
  return [{ key: "Cache-Control", value: STATIC_ASSET_CACHE_CONTROL }];
}

export function buildPerformanceRouteHeaders(): Array<{
  source: string;
  headers: PerformanceHeader[];
}> {
  return [
    { source: "/icons/:path*", headers: buildStaticAssetCacheHeaders() },
    { source: "/fonts/:path*", headers: buildStaticAssetCacheHeaders() },
    { source: "/images/:path*", headers: buildStaticAssetCacheHeaders() },
  ];
}

export function validatePerformanceHeaderConfiguration(): {
  pass: boolean;
  routes: string[];
  missing: string[];
} {
  const routes = buildPerformanceRouteHeaders().map((entry) => entry.source);
  const required = ["/icons/:path*", "/fonts/:path*"];
  const missing = required.filter((route) => !routes.includes(route));

  return {
    pass: missing.length === 0,
    routes,
    missing,
  };
}
