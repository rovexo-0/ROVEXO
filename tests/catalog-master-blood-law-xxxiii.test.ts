import { describe, expect, it } from "vitest";
import {
  SUPREME_BLOOD_LAW_XXXIII_CATALOG_MASTER_V1,
  CATALOG_MASTER_V1,
  certifyCatalogMasterBloodLawXxxiii,
  assertCatalogMasterBloodCertificationOrBlock,
} from "@/lib/catalog";
import { getCategoryTree } from "@/lib/categories/queries";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("Absolute Blood Law XXXIII — Catalog Master Certification", () => {
  it("is certified, locked, and production ready", () => {
    expect(SUPREME_BLOOD_LAW_XXXIII_CATALOG_MASTER_V1.status).toBe(
      "CERTIFIED_LOCKED_PRODUCTION_READY",
    );
    expect(SUPREME_BLOOD_LAW_XXXIII_CATALOG_MASTER_V1.certified).toBe(true);
    expect(SUPREME_BLOOD_LAW_XXXIII_CATALOG_MASTER_V1.systemFrozen).toBe(true);
    expect(SUPREME_BLOOD_LAW_XXXIII_CATALOG_MASTER_V1.architectureFrozen).toBe(true);
    expect(CATALOG_MASTER_V1.bloodLaw).toBe("XXXIII");
    expect(CATALOG_MASTER_V1.status).toBe("CERTIFIED_LOCKED_PRODUCTION_READY");
  });

  it("locks the Sell system", () => {
    expect(SUPREME_BLOOD_LAW_XXXIII_CATALOG_MASTER_V1.sellSystem).toEqual({
      sellPage: "LOCKED",
      sellUi: "LOCKED",
      sellUx: "LOCKED",
      sellFlow: "LOCKED",
      publishingLogic: "LOCKED",
    });
  });

  it("passes blood certification against live Catalog Master", () => {
    const report = certifyCatalogMasterBloodLawXxxiii(getCategoryTree());
    expect(report.ok, report.errors.join("; ")).toBe(true);
    expect(report.certified).toBe(true);
    expect(report.productionReady).toBe(true);
    expect(report.blocked).toBe(false);
    expect(report.checks.every((c) => c.pass)).toBe(true);
    expect(() =>
      assertCatalogMasterBloodCertificationOrBlock(getCategoryTree()),
    ).not.toThrow();
  });

  it("runs full XXXIII chain on application startup", () => {
    const source = readFileSync(path.join(process.cwd(), "instrumentation.ts"), "utf8");
    expect(source).toContain("runCatalogMasterStartupGate");
    expect(source).toContain("assertCatalogMasterProductionReleaseOrBlock");
    expect(source).toContain("assertCatalogMasterBloodCertificationOrBlock");
  });

  it("keeps Sell CategoryPicker on Catalog Master path (Sell LOCKED)", () => {
    const source = readFileSync(
      path.join(process.cwd(), "features/sell/ui/SellCategoryPicker.tsx"),
      "utf8",
    );
    expect(source).toContain('from "@/lib/categories/tree"');
    expect(source).toContain("loadCategoriesWithRecovery");
    expect(source).not.toContain("buildCategoryTreeFromDatabase");
  });
});
