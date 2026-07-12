import { describe, expect, it } from "vitest";
import {
  categoryTree,
  taxonomyStats,
  resolveCategoryPathBySlugs,
  validateMarketplaceTaxonomy,
  BRAND_COUNT,
  MATERIAL_COUNT,
  COLOUR_COUNT,
  PRODUCT_TYPE_COUNT,
} from "@/lib/categories/taxonomy-engine";
import {
  generateCanonicalTaxonomyReport,
  formatCanonicalTaxonomyReport,
} from "@/lib/categories/taxonomy-validation-report";
import {
  loadCategoryScopedTaxonomy,
  excludesElectronicsBrands,
} from "@/lib/category-loaders";
import { getProductFamiliesForGroup } from "@/lib/product-types";
import { MARKETPLACE_COLOURS } from "@/lib/colours";
import { MARKETPLACE_BRANDS } from "@/lib/brands";
import { validateBrand, validateMaterial, validateColour } from "@/lib/categories/taxonomy-engine";

describe("enterprise canonical taxonomy v1.0", () => {
  it("passes structural validation", () => {
    const report = validateMarketplaceTaxonomy();
    expect(report.valid, report.issues.map((i) => i.message).join("; ")).toBe(true);
  });

  it("meets enterprise scale targets", () => {
    expect(PRODUCT_TYPE_COUNT).toBeGreaterThanOrEqual(10_000);
    expect(BRAND_COUNT).toBeGreaterThanOrEqual(2_000);
    expect(MATERIAL_COUNT).toBeGreaterThanOrEqual(800);
    expect(COLOUR_COUNT).toBeGreaterThanOrEqual(200);
  });

  it("supports 4-level bedding pillow paths", () => {
    const memoryFoam = resolveCategoryPathBySlugs([
      "home-garden", "bedding", "pillows", "memory-foam-pillow",
    ]);
    expect(memoryFoam?.segments.length).toBe(4);
    expect(memoryFoam?.pathLabel).toContain("Memory Foam Pillow");
  });

  it("has massive pillow product families from registry", () => {
    const families = getProductFamiliesForGroup("pillows");
    expect(families.length).toBeGreaterThanOrEqual(30);
    expect(families.map(([, slug]) => slug)).toContain("memory-foam-pillow");
    expect(families.map(([, slug]) => slug)).toContain("travel-pillow");
  });

  it("loads category-scoped brands for pillows (no electronics)", () => {
    const pillowPath = resolveCategoryPathBySlugs([
      "home-garden", "bedding", "pillows", "memory-foam-pillow",
    ]);
    const scoped = loadCategoryScopedTaxonomy(pillowPath);
    expect(scoped!.brands).toContain("Tempur");
    expect(scoped!.brands).not.toContain("Apple");
    expect(excludesElectronicsBrands(pillowPath)).toBe(true);
  });

  it("loads category-scoped materials for pillows", () => {
    const pillowPath = resolveCategoryPathBySlugs([
      "home-garden", "bedding", "pillows", "memory-foam-pillow",
    ]);
    const scoped = loadCategoryScopedTaxonomy(pillowPath);
    expect(scoped!.materials).toContain("Memory Foam");
    expect(scoped!.materials).not.toContain("ABS");
  });

  it("loads electronics brands for phones only", () => {
    const phonePath = resolveCategoryPathBySlugs(["phones", "smartphones", "apple-iphone"]);
    const scoped = loadCategoryScopedTaxonomy(phonePath);
    expect(scoped!.brands).toContain("Apple");
    expect(scoped!.brands).toContain("Samsung");
  });

  it("has premium 200+ colour palette with rgb", () => {
    expect(MARKETPLACE_COLOURS.length).toBeGreaterThanOrEqual(200);
    const white = MARKETPLACE_COLOURS.find((c) => c.id === "White");
    expect(white?.rgb).toMatch(/^rgb\(/);
    expect(white?.slug).toBe("white");
  });

  it("validates brand material colour against canonical database", () => {
    expect(validateBrand("Apple")).toBe(true);
    expect(validateBrand("FakeBrandXYZ")).toBe(false);
    expect(validateMaterial("Memory Foam")).toBe(true);
    expect(validateColour("Navy")).toBe(true);
  });

  it("generates validation report with all targets met", () => {
    const report = generateCanonicalTaxonomyReport();
    expect(report.valid).toBe(true);
    expect(report.targets.productTypes.met).toBe(true);
    expect(report.targets.brands.met).toBe(true);
    expect(report.targets.materials.met).toBe(true);
    expect(report.targets.colours.met).toBe(true);
    expect(report.lazyLoadingEnabled).toBe(true);

    const formatted = formatCanonicalTaxonomyReport(report);
    expect(formatted).toContain("Enterprise Taxonomy");
  });

  it("has no duplicate brands", () => {
    expect(new Set(MARKETPLACE_BRANDS).size).toBe(MARKETPLACE_BRANDS.length);
  });

  it("increased taxonomy tree scale", () => {
    expect(taxonomyStats.roots).toBeGreaterThanOrEqual(50);
    expect(taxonomyStats.leaves).toBeGreaterThan(1000);
    expect(categoryTree.length).toBeGreaterThanOrEqual(50);
  });
});
