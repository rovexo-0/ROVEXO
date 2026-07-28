import { describe, expect, it } from "vitest";
import {
  CATALOG_MASTER_FINAL_LAW_XXXII_V1,
  CATALOG_MASTER_V1,
  certifyCatalogMasterProductionRelease,
  assertCatalogMasterProductionReleaseOrBlock,
} from "@/lib/catalog";
import { getCategoryTree } from "@/lib/categories/queries";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("Absolute Law XXXII — Catalog Master Final Law", () => {
  it("is locked and production ready", () => {
    expect(CATALOG_MASTER_FINAL_LAW_XXXII_V1.status).toBe("CERTIFIED_LOCKED_PRODUCTION_READY");
    expect(CATALOG_MASTER_FINAL_LAW_XXXII_V1.productionReady).toBe(true);
    expect(CATALOG_MASTER_FINAL_LAW_XXXII_V1.permanentlyLocked).toBe(true);
    expect(CATALOG_MASTER_FINAL_LAW_XXXII_V1.sellPageFrozen).toBe(true);
    expect(CATALOG_MASTER_V1.finalLaw).toBe("XXXII");
    expect(CATALOG_MASTER_V1.status).toBe("CERTIFIED_LOCKED_PRODUCTION_READY");
  });

  it("certifies production release against live Catalog Master", () => {
    const report = certifyCatalogMasterProductionRelease(getCategoryTree());
    expect(report.ok, report.errors.join("; ")).toBe(true);
    expect(report.productionReady).toBe(true);
    expect(report.blocked).toBe(false);
    expect(report.checks.every((c) => c.pass)).toBe(true);
    expect(() =>
      assertCatalogMasterProductionReleaseOrBlock(getCategoryTree()),
    ).not.toThrow();
  });

  it("locks exactly the ten production root display names", () => {
    expect(CATALOG_MASTER_FINAL_LAW_XXXII_V1.productionRoots).toEqual([
      "Women's Fashion",
      "Men's Fashion",
      "Designer",
      "Kids & Baby",
      "Home & Garden",
      "Electronics",
      "Books & Media",
      "Hobbies & Collectables",
      "Sports & Outdoors",
      "Vehicle Parts & Accessories",
    ]);
  });

  it("keeps Sell CategoryPicker on Catalog Master path only (UI frozen)", () => {
    const source = readFileSync(
      path.join(process.cwd(), "features/sell/ui/SellCategoryPicker.tsx"),
      "utf8",
    );
    expect(source).toContain('from "@/lib/categories/tree"');
    expect(source).toContain("loadCategoriesWithRecovery");
    expect(source).not.toContain("buildCategoryTreeFromDatabase");
  });

  it("runs XXXII production lock on application startup", () => {
    const source = readFileSync(path.join(process.cwd(), "instrumentation.ts"), "utf8");
    expect(source).toContain("assertCatalogMasterProductionReleaseOrBlock");
    expect(source).toContain("runCatalogMasterStartupGate");
  });
});
