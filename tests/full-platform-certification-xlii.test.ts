import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  SUPREME_BLOOD_LAW_XLII_FULL_PLATFORM_CERTIFICATION_V1,
  DEMO_CERTIFICATION_LAYER_V1,
  FULL_PLATFORM_CERT_ORIGIN,
  FULL_PLATFORM_CERTIFICATION_MODULES,
  certifyFullPlatformXlII,
  assertFullPlatformCertificationOrBlock,
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

  it("passes contract gate without claiming production ready (E2E + OAuth evidence required)", () => {
    expect(() => assertFullPlatformCertificationOrBlock()).not.toThrow();
    const report = certifyFullPlatformXlII({ runtimeE2eEvidencePass: false });
    expect(report.bloodLaw).toBe("XLII");
    expect(report.modules).toHaveLength(20);
    expect(report.moduleSummary["End-to-End Certification"]).toBe("FAIL");
    expect(report.productionReady).toBe(false);
    expect(report.productionReadinessPercent).toBeLessThan(100);
    const formatted = formatFullPlatformCertificationReport(report);
    expect(formatted).toContain("Authentication");
    expect(formatted).toContain("Production Readiness");
    expect(() =>
      assertFullPlatformProductionReleaseOrBlock({ runtimeE2eEvidencePass: false }),
    ).toThrow(/PRODUCTION RELEASE BLOCKED/);
  });

  it("wires startup gate in instrumentation", () => {
    const instrumentation = readFileSync(
      path.join(process.cwd(), "instrumentation.ts"),
      "utf8",
    );
    expect(instrumentation).toContain("assertFullPlatformCertificationOrBlock");
  });
});
