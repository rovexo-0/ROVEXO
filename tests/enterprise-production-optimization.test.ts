import { describe, expect, it } from "vitest";
import { authorizeCronRequest } from "@/lib/cron/auth";
import { validateProductionOptimizationSurface } from "@/lib/ops/production-optimization-audit";

describe("production cron auth", () => {
  it("authorizes valid bearer tokens", () => {
    process.env.CRON_SECRET = "test-cron-secret-value";
    const request = new Request("http://localhost/api/cron/maintenance", {
      headers: { authorization: "Bearer test-cron-secret-value" },
    });
    expect(authorizeCronRequest(request)).toBe(true);
    delete process.env.CRON_SECRET;
  });

  it("rejects invalid bearer tokens", () => {
    process.env.CRON_SECRET = "test-cron-secret-value";
    const request = new Request("http://localhost/api/cron/maintenance", {
      headers: { authorization: "Bearer wrong-secret-value" },
    });
    expect(authorizeCronRequest(request)).toBe(false);
    delete process.env.CRON_SECRET;
  });
});

describe("production optimization audit", () => {
  it("returns structured optimization report", () => {
    const report = validateProductionOptimizationSurface();
    expect(report.checks.length).toBeGreaterThan(25);
    expect(typeof report.performanceScore).toBe("number");
    expect(typeof report.infrastructureScore).toBe("number");
    expect(typeof report.seoScore).toBe("number");
    expect(typeof report.databaseScore).toBe("number");
    expect(typeof report.cachingScore).toBe("number");
    expect(typeof report.healthScore).toBe("number");
    expect(Array.isArray(report.indexesAdded)).toBe(true);
  });

  it("reports current production optimization scores and open warnings", () => {
    const report = validateProductionOptimizationSurface();
    expect(report.pass).toBe(false);
    expect(report.productionReady).toBe(false);
    expect(report.enterpriseCertified).toBe(false);
    expect(report.omegaStageIComplete).toBe(false);
    expect(report.performanceScore).toBeGreaterThanOrEqual(85);
    expect(report.infrastructureScore).toBeGreaterThanOrEqual(85);
    expect(report.databaseScore).toBeGreaterThanOrEqual(85);
    expect(report.seoScore).toBeGreaterThanOrEqual(85);
    expect(report.emailScore).toBeGreaterThanOrEqual(85);
    expect(report.pushScore).toBeGreaterThanOrEqual(85);
    expect(report.cronScore).toBeGreaterThanOrEqual(85);
    expect(report.healthScore).toBeGreaterThanOrEqual(85);
    expect(report.remainingWarnings).toEqual([
      "Home below-fold code splitting: Below-fold sections dynamically imported",
      "Listing OpenGraph metadata: Product pages include OG + JSON-LD",
    ]);
    expect(report.checks.some((check) => check.id === "infra-dynamic-imports" && !check.pass)).toBe(true);
  });

  it("includes production catalog indexes", () => {
    const report = validateProductionOptimizationSurface();
    expect(report.indexesAdded).toContain("products_published_category_created_idx");
    expect(report.indexesAdded).toContain("products_description_trgm_idx");
  });

  it("validates cron timing-safe auth and telemetry runner", () => {
    const report = validateProductionOptimizationSurface();
    expect(report.checks.some((c) => c.id === "cron-auth-timing-safe" && c.pass)).toBe(true);
    expect(report.checks.some((c) => c.id === "cron-telemetry-runner" && c.pass)).toBe(true);
    expect(report.checks.some((c) => c.id === "infra-isr-categories" && c.pass)).toBe(true);
  });
});
