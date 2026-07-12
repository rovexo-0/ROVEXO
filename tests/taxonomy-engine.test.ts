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

describe("marketplace taxonomy engine", () => {
  it("exposes a single canonical tree for all modules", () => {
    expect(categoryTree.length).toBeGreaterThanOrEqual(50);
    expect(taxonomyStats.roots).toBeGreaterThanOrEqual(50);
    expect(taxonomyStats.leaves).toBeGreaterThan(1000);
  });

  it("passes structural validation", () => {
    const report = validateMarketplaceTaxonomy();
    expect(report.valid, report.issues.map((issue) => issue.message).join("; ")).toBe(true);
    expect(report.maxDepth).toBeGreaterThanOrEqual(3);
  });

  it("supports 4-level product-type paths", () => {
    const blackout = resolveCategoryPathBySlugs([
      "home-garden",
      "home-textiles",
      "curtains",
      "blackout-curtains",
    ]);
    expect(blackout?.pathLabel).toContain("Blackout Curtains");
    expect(blackout?.segments.length).toBe(4);

    const diningTable = resolveCategoryPathBySlugs(["home-garden", "furniture", "tables", "dining-table"]);
    expect(diningTable?.pathLabel).toContain("Dining Table");

    const memoryFoamPillow = resolveCategoryPathBySlugs([
      "home-garden",
      "bedding",
      "pillows",
      "memory-foam-pillow",
    ]);
    expect(memoryFoamPillow?.pathLabel).toContain("Memory Foam Pillow");
    expect(memoryFoamPillow?.segments.length).toBe(4);
  });

  it("returns hierarchical smart suggestions", () => {
    warmCategoryPickerIndex();
    const textileNames = searchCategoryPicker("textile").map((result) => result.matchName);
    expect(textileNames).toEqual(expect.arrayContaining(["Home & Garden", "Home Textiles"]));

    const iphNames = searchCategoryPicker("iph").map((result) => result.matchName);
    expect(iphNames).toEqual(expect.arrayContaining(["Phones", "Smartphones", "Apple iPhone"]));
  });

  it("completes search under 100ms after warm-up", () => {
    warmCategoryPickerIndex();
    const start = performance.now();
    searchCategoryPicker("bench");
    expect(performance.now() - start).toBeLessThan(100);
  });

  it("maps attributes by category vertical", () => {
    const fashion = resolveCategoryPathBySlugs(["womens-fashion", "womens-clothing", "dresses"]);
    const vehicle = resolveCategoryPathBySlugs(["vehicles", "cars", "saloon"]);
    const phone = resolveCategoryPathBySlugs(["phones", "smartphones", "apple-iphone"]);

    expect(getAttributeIdsForCategoryPath(fashion)).toEqual(
      expect.arrayContaining(["brand", "size", "colour", "material", "condition", "gender", "season"]),
    );
    expect(getAttributeIdsForCategoryPath(vehicle)).toEqual(
      expect.arrayContaining(["brand", "model", "year", "fuel", "mileage", "doors", "seats", "generation", "bodyType", "registration"]),
    );
    expect(getAttributeIdsForCategoryPath(phone)).toEqual(
      expect.arrayContaining(["brand", "model", "storage", "network", "battery", "warranty"]),
    );
  });

  it("exports a valid taxonomy backup bundle", async () => {
    const { exportTaxonomyBackup, parseTaxonomyBackup, stringifyTaxonomyBackup } = await import(
      "@/lib/categories/taxonomy-manager"
    );
    const backup = exportTaxonomyBackup();
    expect(backup.validation.valid).toBe(true);
    expect(backup.brands.length).toBeGreaterThan(100);
    expect(backup.colours.length).toBeGreaterThan(20);
    const roundTrip = parseTaxonomyBackup(stringifyTaxonomyBackup(backup));
    expect(roundTrip.stats.leaves).toBe(backup.stats.leaves);
  });

  it("includes expanded phone and textile departments", () => {
    expect(findNodeBySlugPath(categoryTree, ["phones", "feature-phones"])).not.toBeNull();
    expect(findNodeBySlugPath(categoryTree, ["phones", "phone-accessories-dept", "phone-accessories", "phone-chargers"])).not.toBeNull();
    expect(findNodeBySlugPath(categoryTree, ["home-garden", "home-textiles", "curtains", "sheer-curtains"])).not.toBeNull();
  });
});
