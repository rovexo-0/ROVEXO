import { describe, expect, it } from "vitest";
import {
  categoryTree,
  taxonomyStats,
  validateMarketplaceTaxonomy,
  searchCategoryPicker,
  warmCategoryPickerIndex,
  getAttributeIdsForCategoryPath,
  resolveCategoryPathBySlugs,
} from "@/lib/categories/taxonomy-engine";
import { findNodeBySlugPath } from "@/lib/categories/navigation";

describe("marketplace taxonomy engine (Catalog Master)", () => {
  it("exposes a single canonical tree for all modules", () => {
    expect(categoryTree).toHaveLength(10);
    expect(taxonomyStats.roots).toBe(10);
    expect(taxonomyStats.leaves).toBeGreaterThanOrEqual(100);
  });

  it("passes structural validation", () => {
    const report = validateMarketplaceTaxonomy();
    expect(report.valid, report.issues.map((issue) => issue.message).join("; ")).toBe(true);
    expect(report.maxDepth).toBeGreaterThanOrEqual(3);
  });

  it("supports Catalog Master product-type paths", () => {
    const curtains = resolveCategoryPathBySlugs([
      "home-garden",
      "home-textiles",
      "curtains",
    ]);
    expect(curtains?.pathLabel).toContain("Curtains");
    expect(curtains?.segments.length).toBe(3);

    const tables = resolveCategoryPathBySlugs(["home-garden", "furniture", "tables"]);
    expect(tables?.pathLabel).toContain("Tables");

    const pillows = resolveCategoryPathBySlugs(["home-garden", "bedding", "pillows"]);
    expect(pillows?.pathLabel).toContain("Pillows");
    expect(pillows?.segments.length).toBe(3);
  });

  it("returns hierarchical smart suggestions", () => {
    warmCategoryPickerIndex();
    const textileNames = searchCategoryPicker("textile").map((result) => result.matchName);
    expect(textileNames).toEqual(expect.arrayContaining(["Home Textiles"]));

    const phoneNames = searchCategoryPicker("android").map((result) => result.matchName);
    expect(phoneNames).toEqual(expect.arrayContaining(["Android Phones"]));
    const iphoneNames = searchCategoryPicker("iphone").map((result) => result.matchName);
    expect(iphoneNames).toEqual(expect.arrayContaining(["iPhones"]));
  });

  it("completes search under 100ms after warm-up", () => {
    warmCategoryPickerIndex();
    const start = performance.now();
    searchCategoryPicker("bench");
    expect(performance.now() - start).toBeLessThan(100);
  });

  it("maps attributes by category vertical", () => {
    const fashion = resolveCategoryPathBySlugs(["womens-fashion", "clothing", "dresses"]);
    const phone = resolveCategoryPathBySlugs([
      "electronics",
      "phones-tablets",
      "android-phones",
    ]);
    const parts = resolveCategoryPathBySlugs([
      "vehicle-parts",
      "car-parts",
      "engine-parts",
    ]);

    expect(getAttributeIdsForCategoryPath(fashion).length).toBeGreaterThan(0);
    expect(getAttributeIdsForCategoryPath(phone).length).toBeGreaterThan(0);
    expect(getAttributeIdsForCategoryPath(parts).length).toBeGreaterThan(0);
  });

  it("exports a valid taxonomy backup bundle", async () => {
    const { exportTaxonomyBackup, parseTaxonomyBackup, stringifyTaxonomyBackup } = await import(
      "@/lib/categories/taxonomy-manager"
    );
    const backup = exportTaxonomyBackup();
    expect(backup.validation.valid).toBe(true);
    expect(backup.brands.length).toBeGreaterThan(40);
    expect(backup.colours.length).toBeGreaterThan(10);
    const roundTrip = parseTaxonomyBackup(stringifyTaxonomyBackup(backup));
    expect(roundTrip.stats.leaves).toBe(backup.stats.leaves);
  });

  it("includes phone and textile departments under Catalog Master roots", () => {
    expect(
      findNodeBySlugPath(categoryTree, ["electronics", "phones-tablets", "feature-phones"]),
    ).not.toBeNull();
    expect(
      findNodeBySlugPath(categoryTree, ["electronics", "phones-tablets", "phone-cases"]),
    ).not.toBeNull();
    expect(
      findNodeBySlugPath(categoryTree, ["home-garden", "home-textiles", "curtains"]),
    ).not.toBeNull();
  });
});
