import { describe, expect, it } from "vitest";
import { cacheControlValue, jsonWithCache } from "@/lib/api/cache-headers";
import { validatePlatformPerformanceSurface } from "@/lib/ops/performance-audit";import { validatePerformanceHeaderConfiguration } from "@/lib/ops/performance-headers";

describe("enterprise performance headers", () => {
  it("defines static asset cache routes", () => {
    const result = validatePerformanceHeaderConfiguration();
    expect(result.pass).toBe(true);
    expect(result.routes).toContain("/icons/:path*");
    expect(result.routes).toContain("/fonts/:path*");
  });
});

describe("enterprise API cache profiles", () => {
  it("uses short-lived edge cache for search", () => {
    expect(cacheControlValue("public-short")).toContain("s-maxage=30");
  });

  it("uses long-lived edge cache for category tree", () => {
    expect(cacheControlValue("public-long")).toContain("s-maxage=3600");
  });

  it("returns cache headers on jsonWithCache responses", () => {
    const response = jsonWithCache({ ok: true }, "public-medium");
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=300");
  });
});

describe("enterprise performance audit", () => {
  it("returns structured performance report", () => {
    const report = validatePlatformPerformanceSurface();
    expect(report.checks.length).toBeGreaterThan(15);
    expect(typeof report.performanceScore).toBe("number");
    expect(typeof report.databaseScore).toBe("number");
    expect(typeof report.cacheScore).toBe("number");
    expect(typeof report.coreWebVitalsScore).toBe("number");
    expect(Array.isArray(report.indexesAdded)).toBe(true);
    expect(Array.isArray(report.queriesOptimized)).toBe(true);
  });

  it("reports current enterprise performance surface scores and open warnings", () => {
    const report = validatePlatformPerformanceSurface();
    expect(report.pass).toBe(true);
    expect(report.enterpriseReady).toBe(true);
    expect(report.productionReady).toBe(true);
    expect(report.performanceScore).toBeGreaterThanOrEqual(85);
    expect(report.databaseScore).toBeGreaterThanOrEqual(85);
    expect(report.cacheScore).toBeGreaterThanOrEqual(85);
    expect(report.coreWebVitalsScore).toBeGreaterThanOrEqual(80);
    expect(report.remainingWarnings).toEqual([]);
    expect(report.checks.some((check) => check.id === "home-dynamic-imports" && check.pass)).toBe(true);
    expect(report.checks.some((check) => check.id === "cwv-home-memo" && check.pass)).toBe(true);
    expect(report.checks.some((check) => check.id === "home-parallel-fetch" && check.pass)).toBe(true);
  });

  it("includes required database indexes", () => {
    const report = validatePlatformPerformanceSurface();
    expect(report.indexesAdded).toContain("products_published_created_idx");
    expect(report.indexesAdded).toContain("orders_status_created_idx");
    expect(report.indexesAdded).toContain("brands_name_trgm_idx");
  });
});
