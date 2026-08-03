import { describe, expect, it } from "vitest";
import { CATALOG_NO_BRAND } from "@/lib/catalog/brands";
import {
  assertCrossCategoryBrandSeparation,
  assertLeafBrandIndependence,
  assertProductTypeBrandOrder,
  getBrandsForProductType,
  getCategoryBrandDatabaseStats,
  resetProductTypeBrandDatabaseCacheForTests,
} from "@/lib/catalog/brands-by-product-type";
import { CATALOG_SECTORS } from "@/lib/catalog/tree";

describe("Leaf Category Brand Database refinement — COD SÂNGE", () => {
  resetProductTypeBrandDatabaseCacheForTests();

  it("Travel Pillows V2: major travel manufacturers including Mulisoft Elviros Napfun", () => {
    const brands = getBrandsForProductType("travel-pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "pillows-cushions",
    });
    expect(assertProductTypeBrandOrder(brands)).toBe(true);
    expect(brands[0]).toBe(CATALOG_NO_BRAND);
    expect(brands[1]).toBe("Other");
    expect(brands).toContain("Cabeau");
    expect(brands).toContain("BCOZZY");
    expect(brands).toContain("Trtl");
    expect(brands).toContain("MLVOC");
    expect(brands).toContain("Cocoon");
    expect(brands).toContain("Mulisoft");
    expect(brands).toContain("Elviros");
    expect(brands).toContain("Jinxia");
    expect(brands).toContain("Napfun");
    expect(brands).toContain("Dot & Dot");
    expect(brands).toContain("Huzi");
    expect(brands).toContain("Everlasting Comfort");
    expect(brands).not.toContain("bbhugme");
    expect(brands).not.toContain("Momcozy");
    expect(brands).not.toContain("Boppy");
    expect(brands).not.toContain("Dreamgenii");
  });

  it("Maternity Pillows: maternity specialists only — no travel-only brands", () => {
    const brands = getBrandsForProductType("maternity-pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "pillows-cushions",
    });
    expect(brands).toContain("bbhugme");
    expect(brands).toContain("Momcozy");
    expect(brands).toContain("PharMeDoc");
    expect(brands).toContain("Dreamgenii");
    expect(brands).toContain("Boppy");
    expect(brands).toContain("Clevamama");
    expect(brands).not.toContain("Cabeau");
    expect(brands).not.toContain("Trtl");
    expect(brands).not.toContain("BCOZZY");
    expect(brands).not.toContain("Go Travel");
  });

  it("Decorative Cushions: home brands — no travel specialists", () => {
    const brands = getBrandsForProductType("decorative-cushions", {
      rootSlug: "home-garden",
      subcategorySlug: "pillows-cushions",
    });
    expect(brands).toContain("John Lewis");
    expect(brands).toContain("IKEA");
    expect(brands).toContain("Dunelm");
    expect(brands).toContain("Catherine Lansfield");
    expect(brands).not.toContain("Cabeau");
    expect(brands).not.toContain("Trtl");
    expect(brands).not.toContain("bbhugme");
  });

  it("Memory Foam Pillows: foam brands — no travel-only brands", () => {
    const brands = getBrandsForProductType("memory-foam-pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "pillows-cushions",
    });
    expect(brands).toContain("Tempur");
    expect(brands).toContain("Emma");
    expect(brands).toContain("Simba");
    expect(brands).toContain("Panda London");
    expect(brands).toContain("Dormeo");
    expect(brands).not.toContain("Cabeau");
    expect(brands).not.toContain("Trtl");
    expect(brands).not.toContain("bbhugme");
  });

  it("Phone leaves do not inherit laptop-only brands; furniture not clothing", () => {
    const phones = getBrandsForProductType("android-phones", {
      rootSlug: "electronics",
      subcategorySlug: "phones-tablets",
    });
    expect(phones).toContain("Apple");
    expect(phones).toContain("Samsung");
    expect(phones).not.toContain("Framework");
    expect(phones).not.toContain("Alienware");
    expect(phones).not.toContain("MSI");
    expect(phones).not.toContain("Dell");

    const furniture = getBrandsForProductType("sofas-and-armchairs", {
      rootSlug: "home-garden",
      subcategorySlug: "furniture",
    });
    expect(furniture).toContain("IKEA");
    expect(furniture).not.toContain("Zara");
    expect(furniture).not.toContain("Nike");
  });

  it("every leaf Brand fingerprint is independent", () => {
    expect(assertLeafBrandIndependence().ok).toBe(true);
  });

  it("audits every leaf path — No Brand first, ordered, non-empty", () => {
    let count = 0;
    for (const sector of CATALOG_SECTORS) {
      for (const dept of sector.departments) {
        for (const [, slug] of dept.items ?? []) {
          const brands = getBrandsForProductType(slug, {
            rootSlug: sector.slug,
            subcategorySlug: dept.slug,
          });
          expect(assertProductTypeBrandOrder(brands)).toBe(true);
          expect(brands.length).toBeGreaterThanOrEqual(5);
          count += 1;
        }
      }
    }
    expect(count).toBe(getCategoryBrandDatabaseStats().productTypePaths);
    expect(count).toBeGreaterThanOrEqual(900);
  });

  it("pillow leaf datasets are not identical to each other", () => {
    const travel = getBrandsForProductType("travel-pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "pillows-cushions",
    }).join("|");
    const maternity = getBrandsForProductType("maternity-pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "pillows-cushions",
    }).join("|");
    const decorative = getBrandsForProductType("decorative-cushions", {
      rootSlug: "home-garden",
      subcategorySlug: "pillows-cushions",
    }).join("|");
    const memory = getBrandsForProductType("memory-foam-pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "pillows-cushions",
    }).join("|");
    expect(travel).not.toBe(maternity);
    expect(travel).not.toBe(decorative);
    expect(travel).not.toBe(memory);
    expect(maternity).not.toBe(decorative);
  });

  it("cross-category separation still PASS", () => {
    expect(assertCrossCategoryBrandSeparation().ok).toBe(true);
  });
});
