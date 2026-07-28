import { describe, expect, it } from "vitest";
import {
  SUPREME_BLOOD_LAW_XXXV_CATEGORY_VISUAL_IDENTITY_V1,
  certifyCategoryVisualIdentityXxxv,
  assertCategoryVisualIdentityOrBlock,
  getCategoryVisualBriefBySlug,
} from "@/lib/supreme-blood-law-xxxv-category-visual-identity-v1";
import { CANONICAL_ROOT_CATEGORIES } from "@/lib/categories/canonical-root-categories-v1";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("Absolute Blood Law XXXV — Category Visual Identity", () => {
  it("is locked and production ready", () => {
    const law = SUPREME_BLOOD_LAW_XXXV_CATEGORY_VISUAL_IDENTITY_V1;
    expect(law.bloodLaw).toBe("XXXV");
    expect(law.status).toBe("LOCKED_PRODUCTION_READY");
    expect(law.locked).toBe(true);
    expect(law.rootVisuals).toHaveLength(10);
    expect(law.imageStyle).toContain("White background");
    expect(law.forbidden).toContain("Cartoon graphics");
  });

  it("locks subject briefs for all production roots", () => {
    expect(getCategoryVisualBriefBySlug("womens-fashion")?.subjects).toContain(
      "Luxury handbag",
    );
    expect(getCategoryVisualBriefBySlug("vehicle-parts")?.subjects).toEqual(
      expect.arrayContaining([
        "Premium Alloy Wheel",
        "Purple Brake Caliper",
        "Coilover Shock Absorber",
        "Spark Plug",
      ]),
    );
    expect(getCategoryVisualBriefBySlug("vehicle-parts")?.forbiddenSubjects).toEqual(
      expect.arrayContaining(["complete vehicles"]),
    );
    expect(getCategoryVisualBriefBySlug("collectibles")?.forbiddenSubjects).toEqual(
      expect.arrayContaining([expect.stringContaining("fantasy")]),
    );
  });

  it("aligns visual roots with canonical Catalog Master roots", () => {
    expect(
      SUPREME_BLOOD_LAW_XXXV_CATEGORY_VISUAL_IDENTITY_V1.rootVisuals.map((r) => r.slug),
    ).toEqual(CANONICAL_ROOT_CATEGORIES.map((r) => r.slug));
  });

  it("passes visual identity certification (assets on disk)", () => {
    const report = certifyCategoryVisualIdentityXxxv();
    expect(report.ok, report.errors.join("; ")).toBe(true);
    expect(report.locked).toBe(true);
    expect(report.productionReady).toBe(true);
    expect(() => assertCategoryVisualIdentityOrBlock()).not.toThrow();
  });

  it("runs XXXV gate on application startup", () => {
    const source = readFileSync(path.join(process.cwd(), "instrumentation.ts"), "utf8");
    expect(source).toContain("assertCategoryVisualIdentityOrBlock");
  });
});
