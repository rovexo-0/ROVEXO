import { describe, it, expect } from "vitest";
import {
  assertLeafBrandIndependence,
  getBrandsForProductType,
  getCategoryBrandDatabaseStats,
  resetProductTypeBrandDatabaseCacheForTests,
} from "@/lib/catalog/brands-by-product-type";
import {
  assertLeafMaterialIndependence,
  getCategoryMaterialDatabaseStats,
  resetProductTypeMaterialDatabaseCacheForTests,
} from "@/lib/catalog/product-type-material-database-v1";
import {
  resolveLeafAttributeOverride,
  LEAF_CATEGORY_ATTRIBUTE_OVERRIDES,
} from "@/lib/catalog/leaf-category-attribute-overrides-v1";
import { loadCategoryScopedTaxonomy } from "@/lib/category-loaders/scoped";
import type { FlatCategoryPath } from "@/lib/categories/types";

function path(slugs: string[]): FlatCategoryPath {
  return {
    segments: slugs.map((slug) => ({ slug, name: slug, id: slug })),
  } as FlatCategoryPath;
}

describe("LEAF ATTRIBUTE DATABASE V3 audit", () => {
  resetProductTypeBrandDatabaseCacheForTests();
  resetProductTypeMaterialDatabaseCacheForTests();

  it("pillow / travel / maternity brand independence + owner examples", () => {
    const pillow = getBrandsForProductType("pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "bedding",
    });
    const travel = getBrandsForProductType("travel-pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "bedding",
    });
    const maternity = getBrandsForProductType("maternity-pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "bedding",
    });

    for (const b of [
      "Mulisoft",
      "Elviros",
      "Jinxia",
      "Tempur",
      "Emma",
      "Silentnight",
      "Simba",
      "Panda London",
      "Utopia Bedding",
      "Coop Home Goods",
    ]) {
      expect(pillow).toContain(b);
    }
    for (const b of [
      "Cabeau",
      "BCOZZY",
      "Trtl",
      "Huzi",
      "Dot & Dot",
      "Napfun",
      "Lewis N. Clark",
      "Mulisoft",
    ]) {
      expect(travel).toContain(b);
    }
    for (const b of ["PharMeDoc", "Queen Rose", "Niimo", "Dreamgenii"]) {
      expect(maternity).toContain(b);
    }
    expect(travel).not.toContain("PharMeDoc");
    expect(travel).not.toContain("Dreamgenii");
    expect(maternity).not.toContain("Cabeau");
    expect(maternity).not.toContain("Trtl");

    for (const brands of [pillow, travel, maternity]) {
      expect(brands[0]).toBe("No Brand");
      expect(brands[1]).toBe("Other");
      expect(new Set(brands).size).toBe(brands.length);
      const rest = brands.slice(2);
      const sorted = [...rest].sort((a, c) =>
        a.localeCompare(c, "en", { sensitivity: "base" }),
      );
      expect(rest).toEqual(sorted);
    }
  });

  it("leaf attribute overrides + scoped load", () => {
    expect(Object.keys(LEAF_CATEGORY_ATTRIBUTE_OVERRIDES).length).toBeGreaterThanOrEqual(15);
    const travelTax = loadCategoryScopedTaxonomy(
      path(["home-garden", "bedding", "pillows", "travel-pillows"]),
    );
    expect(travelTax?.features).toContain("Travel Compact");
    expect(travelTax?.styles).toContain("U-Shape");
    expect(travelTax?.brands).toContain("Cabeau");
    expect(travelTax?.materials.length).toBeGreaterThan(5);

    const matTax = loadCategoryScopedTaxonomy(
      path(["home-garden", "bedding", "pillows", "maternity-pillows"]),
    );
    expect(matTax?.styles).toContain("C-Shape");
    expect(matTax?.features).toContain("Pregnancy Support");
    expect(matTax?.brands).toContain("PharMeDoc");

    expect(resolveLeafAttributeOverride("decorative-cushions")?.patterns).toContain("Bouclé");
  });

  it("global independence + coverage stats", () => {
    expect(assertLeafBrandIndependence().ok).toBe(true);
    expect(assertLeafMaterialIndependence().ok).toBe(true);
    const brands = getCategoryBrandDatabaseStats();
    const mats = getCategoryMaterialDatabaseStats();
    expect(brands.productTypePaths).toBeGreaterThan(900);
    expect(mats.productTypePaths).toBeGreaterThan(900);
    console.log(
      JSON.stringify({
        brandLeaves: brands.productTypePaths,
        brandUnique: brands.uniqueBrandNames,
        brandAvg: brands.averageBrandsPerCategory,
        matLeaves: mats.productTypePaths,
        matUnique: mats.uniqueMaterialNames,
        matAvg: mats.averageMaterialsPerCategory,
        attrLeaves: Object.keys(LEAF_CATEGORY_ATTRIBUTE_OVERRIDES).length,
      }),
    );
  });
});
