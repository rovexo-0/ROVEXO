import { describe, expect, it } from "vitest";
import {
  SUPREME_BLOOD_LAW_XXXIV_GLOBAL_PRODUCTION_FREEZE_V1,
  certifyGlobalProductionFreezeXxxiv,
  assertGlobalProductionFreezeOrBlock,
  isPermittedUnderGlobalProductionFreeze,
  isForbiddenUnderGlobalProductionFreeze,
} from "@/lib/supreme-blood-law-xxxiv-global-production-freeze-v1";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("Absolute Blood Law XXXIV — Global Production Freeze", () => {
  it("declares ROVEXO v1.0 absolute freeze", () => {
    const law = SUPREME_BLOOD_LAW_XXXIV_GLOBAL_PRODUCTION_FREEZE_V1;
    expect(law.bloodLaw).toBe("XXXIV");
    expect(law.status).toBe("ABSOLUTE_FREEZE_LOCKED_CERTIFIED_PRODUCTION_READY");
    expect(law.absoluteFreeze).toBe(true);
    expect(law.architectureVersion).toBe("ROVEXO v1.0");
    expect(law.architectureStatus).toBe("FROZEN");
    expect(law.productionStatus).toBe("LOCKED");
    expect(law.certificationStatus).toBe("VALID");
    expect(law.failPolicy.failClosed).toBe(true);
    expect(law.failPolicy.emergencyBypass).toBe(false);
  });

  it("freezes core production systems including Catalog and Sell", () => {
    const systems = SUPREME_BLOOD_LAW_XXXIV_GLOBAL_PRODUCTION_FREEZE_V1.globallyFrozenSystems;
    for (const name of [
      "Homepage Architecture",
      "Search Architecture",
      "Catalog Master",
      "Sell System",
      "Checkout",
      "Wallet",
      "Authentication",
      "Design System",
    ]) {
      expect(systems).toContain(name);
    }
  });

  it("permits maintenance and forbids redesign", () => {
    expect(isPermittedUnderGlobalProductionFreeze("Bug Fixes")).toBe(true);
    expect(isPermittedUnderGlobalProductionFreeze("Category Content Updates")).toBe(true);
    expect(isForbiddenUnderGlobalProductionFreeze("UI redesign")).toBe(true);
    expect(isForbiddenUnderGlobalProductionFreeze("Parallel systems")).toBe(true);
    expect(isForbiddenUnderGlobalProductionFreeze("Silent fallback")).toBe(true);
  });

  it("passes global production freeze certification", () => {
    const report = certifyGlobalProductionFreezeXxxiv();
    expect(report.ok, report.errors.join("; ")).toBe(true);
    expect(report.absoluteFreeze).toBe(true);
    expect(report.certified).toBe(true);
    expect(report.productionReady).toBe(true);
    expect(report.blocked).toBe(false);
    expect(() => assertGlobalProductionFreezeOrBlock()).not.toThrow();
  });

  it("runs XXXIV gate on application startup after Catalog certification", () => {
    const source = readFileSync(path.join(process.cwd(), "instrumentation.ts"), "utf8");
    expect(source).toContain("assertCatalogMasterBloodCertificationOrBlock");
    expect(source).toContain("assertGlobalProductionFreezeOrBlock");
  });

  it("requires new Blood Law for architectural change", () => {
    expect(SUPREME_BLOOD_LAW_XXXIV_GLOBAL_PRODUCTION_FREEZE_V1.changeControl).toEqual([
      "Architecture Proposal",
      "Technical Review",
      "Engineering Approval",
      "Certification",
      "New Blood Law",
      "New Version",
    ]);
  });
});
