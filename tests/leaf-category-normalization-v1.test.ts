import { describe, expect, it } from "vitest";
import {
  assertCrossCategoryBrandSeparation,
  assertLeafBrandIndependence,
  assertProductTypeBrandOrder,
  getBrandsForProductType,
  getCategoryBrandDatabaseStats,
  resetProductTypeBrandDatabaseCacheForTests,
} from "@/lib/catalog/brands-by-product-type";
import {
  assertCrossCategoryMaterialSeparation,
  assertLeafMaterialIndependence,
  getCategoryMaterialDatabaseStats,
  getMaterialsForProductType,
  resetProductTypeMaterialDatabaseCacheForTests,
} from "@/lib/catalog/product-type-material-database-v1";

describe("Leaf Category Normalization — COD SÂNGE V2", () => {
  resetProductTypeBrandDatabaseCacheForTests();
  resetProductTypeMaterialDatabaseCacheForTests();

  it("every leaf owns an independent Brand fingerprint", () => {
    expect(assertLeafBrandIndependence().ok).toBe(true);
    expect(assertCrossCategoryBrandSeparation().ok).toBe(true);
  });

  it("every leaf owns an independent Material fingerprint", () => {
    expect(assertLeafMaterialIndependence().ok).toBe(true);
    expect(assertCrossCategoryMaterialSeparation().ok).toBe(true);
  });

  it("Travel vs Maternity brands stay category-specific", () => {
    const travel = getBrandsForProductType("travel-pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "pillows-cushions",
    });
    const maternity = getBrandsForProductType("maternity-pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "pillows-cushions",
    });
    expect(assertProductTypeBrandOrder(travel)).toBe(true);
    expect(travel).toContain("Mulisoft");
    expect(travel).not.toContain("Momcozy");
    expect(maternity).toContain("Momcozy");
    expect(maternity).not.toContain("Cabeau");
  });

  it("Furniture / phones / laptops have no cross-contamination", () => {
    const sofa = getBrandsForProductType("sofas-and-armchairs", {
      rootSlug: "home-garden",
      subcategorySlug: "furniture",
    });
    expect(sofa).toContain("IKEA");
    expect(sofa).not.toContain("Nike");
    expect(sofa).not.toContain("Zara");

    const phones = getBrandsForProductType("android-phones", {
      rootSlug: "electronics",
      subcategorySlug: "phones-tablets",
    });
    expect(phones).toContain("Samsung");
    expect(phones).not.toContain("Dell");
    expect(phones).not.toContain("Framework");

    const bags = getBrandsForProductType("laptop-bags-and-sleeves", {
      rootSlug: "electronics",
      subcategorySlug: "computers",
    });
    expect(bags).not.toContain("Dell");
    expect(bags).toContain("Targus");
  });

  it("sibling furniture Brand lists are not identical parent clones", () => {
    const sofa = getBrandsForProductType("sofas-and-armchairs", {
      rootSlug: "home-garden",
      subcategorySlug: "furniture",
    }).join("|");
    const tables = getBrandsForProductType("dining-tables", {
      rootSlug: "home-garden",
      subcategorySlug: "furniture",
    }).join("|");
    expect(sofa).not.toBe(tables);
  });

  it("Travel materials differ from Maternity materials", () => {
    const travel = getMaterialsForProductType("travel-pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "pillows-cushions",
    });
    const maternity = getMaterialsForProductType("maternity-pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "pillows-cushions",
    });
    expect(travel.join("|")).not.toBe(maternity.join("|"));
    expect(travel).toContain("Memory Foam");
    expect(travel.at(-1)).toBe("Other");
  });

  it("coverage remains substantial across 960 leaves", () => {
    const brands = getCategoryBrandDatabaseStats();
    const materials = getCategoryMaterialDatabaseStats();
    expect(brands.productTypePaths).toBe(960);
    expect(materials.productTypePaths).toBe(960);
    expect(brands.minBrandsPerCategory).toBeGreaterThanOrEqual(12);
    expect(materials.minMaterialsPerCategory).toBeGreaterThanOrEqual(8);
  });
});
