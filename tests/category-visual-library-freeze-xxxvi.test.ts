import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  SUPREME_BLOOD_LAW_XXXVI_CATEGORY_VISUAL_LIBRARY_FREEZE_V1,
  OFFICIAL_VEHICLE_PARTS_COMPOSITION_V1,
  certifyCategoryVisualLibraryFreezeXxxvi,
  assertCategoryVisualLibraryFreezeOrBlock,
  isCategoryVisualLibraryFrozen,
  isCategoryAssetQualityImprovementAllowed,
} from "@/lib/supreme-blood-law-xxxvi-category-visual-library-freeze-v1";
import { SUPREME_BLOOD_LAW_XXXV_CATEGORY_VISUAL_IDENTITY_V1 } from "@/lib/supreme-blood-law-xxxv-category-visual-identity-v1";

describe("Absolute Blood Law XXXVI — Category Visual Library Freeze", () => {
  it("is locked, certified, frozen, and production ready", () => {
    const law = SUPREME_BLOOD_LAW_XXXVI_CATEGORY_VISUAL_LIBRARY_FREEZE_V1;
    expect(law.bloodLaw).toBe("XXXVI");
    expect(law.status).toBe("LOCKED_CERTIFIED_FROZEN_PRODUCTION_READY");
    expect(law.locked).toBe(true);
    expect(law.certified).toBe(true);
    expect(law.frozen).toBe(true);
    expect(law.productionReady).toBe(true);
    expect(law.frozenUntil).toContain("ROVEXO v2.0");
    expect(isCategoryVisualLibraryFrozen()).toBe(true);
  });

  it("locks the official ten-root visual library", () => {
    const law = SUPREME_BLOOD_LAW_XXXVI_CATEGORY_VISUAL_LIBRARY_FREEZE_V1;
    expect(law.officialLibrary).toHaveLength(10);
    expect(law.officialLibrary).toEqual(
      SUPREME_BLOOD_LAW_XXXV_CATEGORY_VISUAL_IDENTITY_V1.rootVisuals.map((r) => r.name),
    );
    expect(law.officialLibrary.at(-1)).toBe("Vehicle Parts & Accessories");
  });

  it("locks official Vehicle Parts composition and prohibits whole vehicles", () => {
    expect(OFFICIAL_VEHICLE_PARTS_COMPOSITION_V1).toEqual(
      expect.arrayContaining([
        "Premium Alloy Wheel",
        "Purple Brake Caliper",
        "Coilover Shock Absorber",
        "Spark Plug",
      ]),
    );
    expect(
      SUPREME_BLOOD_LAW_XXXV_CATEGORY_VISUAL_IDENTITY_V1.rootVisuals.find(
        (r) => r.slug === "vehicle-parts",
      )?.subjects,
    ).toEqual([...OFFICIAL_VEHICLE_PARTS_COMPOSITION_V1]);
    expect(
      SUPREME_BLOOD_LAW_XXXVI_CATEGORY_VISUAL_LIBRARY_FREEZE_V1.vehiclePartsProhibited,
    ).toContain("Whole vehicles");
  });

  it("permits quality improvements only", () => {
    expect(isCategoryAssetQualityImprovementAllowed("Higher Resolution")).toBe(true);
    expect(isCategoryAssetQualityImprovementAllowed("Better Lighting")).toBe(true);
    expect(isCategoryAssetQualityImprovementAllowed("UI redesign")).toBe(false);
    expect(
      SUPREME_BLOOD_LAW_XXXVI_CATEGORY_VISUAL_LIBRARY_FREEZE_V1.forbiddenChanges,
    ).toEqual(expect.arrayContaining(["Cartoons", "Whole vehicles"]));
    expect(
      SUPREME_BLOOD_LAW_XXXVI_CATEGORY_VISUAL_LIBRARY_FREEZE_V1.frozenDesign,
    ).toEqual(
      expect.arrayContaining([
        "Asset Mapping",
        "Search Layout",
        "Sell Layout",
        "Homepage Layout",
      ]),
    );
  });

  it("passes library freeze certification", () => {
    const report = certifyCategoryVisualLibraryFreezeXxxvi();
    expect(report.ok, report.errors.join("; ")).toBe(true);
    expect(report.parentOk).toBe(true);
    expect(report.frozen).toBe(true);
    expect(report.certified).toBe(true);
    expect(() => assertCategoryVisualLibraryFreezeOrBlock()).not.toThrow();
  });

  it("runs XXXVI gate on application startup after XXXV", () => {
    const source = readFileSync(path.join(process.cwd(), "instrumentation.ts"), "utf8");
    expect(source).toContain("assertCategoryVisualIdentityOrBlock");
    expect(source).toContain("assertCategoryVisualLibraryFreezeOrBlock");
    expect(source.indexOf("assertCategoryVisualIdentityOrBlock")).toBeLessThan(
      source.indexOf("assertCategoryVisualLibraryFreezeOrBlock"),
    );
  });
});
