import { describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  SUPREME_BLOOD_LAW_XLII_FULL_PLATFORM_CERTIFICATION_V1,
  DEMO_CERTIFICATION_LAYER_V1,
  FULL_PLATFORM_CERT_ORIGIN,
  FULL_PLATFORM_CERTIFICATION_MODULES,
  certifyFullPlatformXlII,
  certifyFullPlatformLocalXlII,
  certifyFullPlatformProductionRuntimeXlII,
  assertFullPlatformCertificationOrBlock,
  assertFullPlatformLocalOrBlock,
  assertFullPlatformProductionRuntimeOrBlock,
  assertFullPlatformProductionReleaseOrBlock,
  formatFullPlatformCertificationReport,
} from "@/lib/supreme-blood-law-xlii-full-platform-certification-v1";

describe("Absolute Blood Law XLII — Full Platform Certification", () => {
  it("locks supreme fail-closed full platform contract", () => {
    const law = SUPREME_BLOOD_LAW_XLII_FULL_PLATFORM_CERTIFICATION_V1;
    expect(law.bloodLaw).toBe("XLII");
    expect(law.supreme).toBe(true);
    expect(law.failClosed).toBe(true);
    expect(law.environment).toBe("http://localhost:3000");
    expect(FULL_PLATFORM_CERT_ORIGIN).toBe("http://localhost:3000");
    expect(FULL_PLATFORM_CERTIFICATION_MODULES).toHaveLength(20);
    expect(DEMO_CERTIFICATION_LAYER_V1.accounts.buyer).toBe("demo.buyer@rovexo.co.uk");
    expect(DEMO_CERTIFICATION_LAYER_V1.accounts.seller).toBe("demo.seller@rovexo.co.uk");
    expect(DEMO_CERTIFICATION_LAYER_V1.zeroPermanentChanges).toBe(true);
  });

  it("keeps e2e certification spec on disk targeting localhost:3000", () => {
    const e2ePath = path.join(process.cwd(), "e2e/full-platform-certification.spec.ts");
    expect(existsSync(e2ePath)).toBe(true);
    const e2e = readFileSync(e2ePath, "utf8");
    expect(e2e).toContain("localhost:3000");
    expect(e2e).toContain("FULL_DEMO_ACCOUNTS");
    expect(e2e).toContain("FULL_PLATFORM");
  });

  it("passes Local contract gate without claiming production ready (E2E + OAuth evidence required)", () => {
    expect(() => assertFullPlatformLocalOrBlock()).not.toThrow();
    expect(() => assertFullPlatformCertificationOrBlock()).not.toThrow();
    const report = certifyFullPlatformLocalXlII({ runtimeE2eEvidencePass: false });
    expect(certifyFullPlatformXlII({ runtimeE2eEvidencePass: false }).ok).toBe(report.ok);
    expect(report.bloodLaw).toBe("XLII");
    expect(report.modules).toHaveLength(20);
    expect(report.moduleSummary["End-to-End Certification"]).toBe("FAIL");
    expect(report.productionReady).toBe(false);
    expect(report.productionReadinessPercent).toBeLessThan(100);
    expect(report.checks.some((c) => c.id === "full-demo-gate")).toBe(true);
    expect(report.checks.some((c) => c.id === "deployment-gate")).toBe(true);
    expect(report.checks.some((c) => c.id === "e2e-spec-present")).toBe(true);
    const formatted = formatFullPlatformCertificationReport(report);
    expect(formatted).toContain("Authentication");
    expect(formatted).toContain("Production Readiness");
    expect(() =>
      assertFullPlatformProductionReleaseOrBlock({ runtimeE2eEvidencePass: false }),
    ).toThrow(/PRODUCTION RELEASE BLOCKED/);
  });

  it("Production Runtime cert excludes Local-only gates and passes fail-closed", () => {
    const runtime = certifyFullPlatformProductionRuntimeXlII();
    expect(runtime.bloodLaw).toBe("XLII");
    expect(runtime.ok).toBe(true);
    expect(runtime.moduleSummary["End-to-End Certification"]).toBeUndefined();
    expect(runtime.checks.some((c) => c.id === "full-demo-gate")).toBe(false);
    expect(runtime.checks.some((c) => c.id === "deployment-gate")).toBe(false);
    expect(runtime.checks.some((c) => c.id === "e2e-spec-present")).toBe(false);
    expect(runtime.checks.some((c) => c.id === "oauth-config")).toBe(false);
    expect(runtime.checks.some((c) => c.id === "startup-fail-closed-wiring")).toBe(true);
    expect(runtime.checks.some((c) => c.id === "instrumentation-runtime-xlII")).toBe(true);
    expect(() => assertFullPlatformProductionRuntimeOrBlock()).not.toThrow();
  });

  it("skips source verification on Vercel serverless (never throws)", () => {
    const prev = process.env.VERCEL;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    process.env.VERCEL = "1";
    try {
      const runtime = certifyFullPlatformProductionRuntimeXlII();
      expect(runtime.ok).toBe(true);
      expect(runtime.errors).toEqual([]);
      expect(
        runtime.checks.some((c) => c.id === "source-verification-skipped-serverless"),
      ).toBe(true);
      expect(() => assertFullPlatformProductionRuntimeOrBlock()).not.toThrow();
      expect(warn).toHaveBeenCalledWith(
        "[XLII] Source verification skipped in production runtime.",
      );
    } finally {
      process.env.VERCEL = prev;
      warn.mockRestore();
    }
  });

  it("wires Production Runtime XLII only in instrumentation", () => {
    const instrumentation = readFileSync(
      path.join(process.cwd(), "instrumentation.ts"),
      "utf8",
    );
    expect(instrumentation).toContain("assertFullPlatformProductionRuntimeOrBlock");
    expect(instrumentation).not.toContain("assertFullPlatformCertificationOrBlock()");
    expect(instrumentation).not.toMatch(/certifyFullPlatformLocalXlII\s*\(/);
  });
});
