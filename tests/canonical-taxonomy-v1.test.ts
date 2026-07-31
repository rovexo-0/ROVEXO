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
} from "@/lib/category-loaders";
import { getProductFamiliesForGroup } from "@/lib/product-types";
import { MARKETPLACE_COLOURS } from "@/lib/colours";
import { MARKETPLACE_BRANDS } from "@/lib/brands";
import { validateBrand, validateMaterial, validateColour } from "@/lib/categories/taxonomy-engine";
import { CATALOG_NO_BRAND } from "@/lib/catalog";

describe("Catalog Master taxonomy v1.0", () => {
  it("passes structural validation", () => {
    const report = validateMarketplaceTaxonomy();
    expect(report.valid, report.issues.map((i) => i.message).join("; ")).toBe(true);
  });

  it("meets Catalog Master scale targets", () => {
    expect(PRODUCT_TYPE_COUNT).toBeGreaterThanOrEqual(100);
    expect(BRAND_COUNT).toBeGreaterThanOrEqual(50);
    expect(MATERIAL_COUNT).toBeGreaterThanOrEqual(20);
    expect(COLOUR_COUNT).toBeGreaterThanOrEqual(12);
    expect(COLOUR_COUNT).toBeLessThanOrEqual(24);
  });

  it("supports bedding pillow paths", () => {
    const pillows = resolveCategoryPathBySlugs(["home-garden", "bedding", "pillows"]);
    expect(pillows?.segments.length).toBe(3);
    expect(pillows?.pathLabel).toContain("Pillows");
  });

  it("exposes bedding product types from Catalog Master", () => {
    const families = getProductFamiliesForGroup("bedding");
    expect(families.map(([, slug]) => slug)).toContain("pillows");
    expect(families.map(([, slug]) => slug)).toContain("duvets");
  });

  it("loads category-scoped brands for pillows", () => {
    const pillowPath = resolveCategoryPathBySlugs(["home-garden", "bedding", "pillows"]);
    const scoped = loadCategoryScopedTaxonomy(pillowPath);
    expect(scoped!.brands).toContain(CATALOG_NO_BRAND);
    expect(scoped!.brands).toContain("IKEA");
  });

  it("loads category-scoped materials for pillows", () => {
    const pillowPath = resolveCategoryPathBySlugs(["home-garden", "bedding", "pillows"]);
    const scoped = loadCategoryScopedTaxonomy(pillowPath);
    expect(scoped!.materials).toContain("Memory foam");
  });

  it("loads electronics brands for phones", () => {
    const androidPath = resolveCategoryPathBySlugs([
      "electronics",
      "phones-tablets",
      "android-phones",
    ]);
    const iphonePath = resolveCategoryPathBySlugs([
      "electronics",
      "phones-tablets",
      "iphones",
    ]);
    expect(loadCategoryScopedTaxonomy(androidPath)!.brands).toContain("Samsung");
    expect(loadCategoryScopedTaxonomy(iphonePath)!.brands).toContain("Apple");
  });

  it("has compact colour palette with rgb", () => {
    expect(MARKETPLACE_COLOURS.length).toBeLessThanOrEqual(24);
    const white = MARKETPLACE_COLOURS.find((c) => c.id === "White");
    expect(white?.rgb).toMatch(/^rgb\(/);
    expect(white?.slug).toBe("white");
  });

  it("validates brand material colour against Catalog Master", () => {
    expect(validateBrand("Apple")).toBe(true);
    expect(validateBrand("FakeBrandXYZ")).toBe(false);
    expect(validateMaterial("Memory foam")).toBe(true);
    expect(validateColour("Blue")).toBe(true);
  });

  it("generates validation report with Catalog Master targets met", () => {
    const report = generateCanonicalTaxonomyReport();
    expect(report.valid).toBe(true);
    expect(report.targets.productTypes.met).toBe(true);
    expect(report.targets.brands.met).toBe(true);
    expect(report.targets.materials.met).toBe(true);
    expect(report.targets.colours.met).toBe(true);
    expect(report.lazyLoadingEnabled).toBe(true);

    const formatted = formatCanonicalTaxonomyReport(report);
    expect(formatted).toContain("Catalog Master");
  });

  it("has no duplicate brands", () => {
    expect(new Set(MARKETPLACE_BRANDS).size).toBe(MARKETPLACE_BRANDS.length);
  });

  it("uses ten-root Catalog Master tree", () => {
    expect(taxonomyStats.roots).toBe(10);
    expect(taxonomyStats.leaves).toBeGreaterThanOrEqual(100);
    expect(categoryTree).toHaveLength(10);
  });
});
