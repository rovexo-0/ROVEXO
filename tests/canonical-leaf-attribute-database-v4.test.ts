import { describe, expect, it } from "vitest";
import {
  assertLeafBrandIndependence,
  getBrandsForProductType,
  getCanonicalBrandRegistry,
  getCanonicalBrandStats,
  getCategoryBrandDatabaseStats,
  resolveCanonicalBrandName,
  resetProductTypeBrandDatabaseCacheForTests,
} from "@/lib/catalog/brands-by-product-type";
import {
  assertLeafMaterialIndependence,
  getCategoryMaterialDatabaseStats,
  getMaterialsForProductType,
  resetProductTypeMaterialDatabaseCacheForTests,
} from "@/lib/catalog/product-type-material-database-v1";
import {
  getCanonicalMaterialRegistry,
  getCanonicalMaterialStats,
  resolveCanonicalMaterialName,
} from "@/lib/catalog/canonical-material-registry-v4";

describe("Canonical Leaf Attribute Database V4", () => {
  resetProductTypeBrandDatabaseCacheForTests();
  resetProductTypeMaterialDatabaseCacheForTests();

  it("normalizes brand aliases to one official name", () => {
    expect(resolveCanonicalBrandName("TEMPUR")).toBe("Tempur");
    expect(resolveCanonicalBrandName("Tempur®")).toBe("Tempur");
    expect(resolveCanonicalBrandName("Pharmedoc")).toBe("PharMeDoc");
    expect(resolveCanonicalBrandName("VW")).toBe("Volkswagen");
    expect(resolveCanonicalBrandName("Dr Martens")).toBe("Dr. Martens");
    expect(resolveCanonicalBrandName("memory foam")).not.toBe("Tempur");
  });

  it("normalizes material aliases to one official name", () => {
    expect(resolveCanonicalMaterialName("memory foam")).toBe("Memory Foam");
    expect(resolveCanonicalMaterialName("Memory foam")).toBe("Memory Foam");
    expect(resolveCanonicalMaterialName("microfiber")).toBe("Microfibre");
    expect(resolveCanonicalMaterialName("Polyester Fiber")).toBe("Polyester Fibre");
  });

  it("leaf datasets emit canonical official names (selectable)", () => {
    const maternity = getBrandsForProductType("maternity-pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "bedding",
    });
    expect(maternity).toContain("PharMeDoc");
    expect(maternity).not.toContain("Pharmedoc");

    const travel = getMaterialsForProductType("travel-pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "bedding",
    });
    expect(travel).toContain("Memory Foam");
    const memoryKeys = travel.filter((m) => m.toLowerCase() === "memory foam");
    expect(memoryKeys).toHaveLength(1);
  });

  it("builds global canonical registries once per official name", () => {
    // Force cache + registry sync.
    getCategoryBrandDatabaseStats();
    getCategoryMaterialDatabaseStats();

    const brands = getCanonicalBrandRegistry();
    const materials = getCanonicalMaterialRegistry();
    expect(brands.length).toBeGreaterThan(500);
    expect(materials.length).toBeGreaterThan(100);

    const brandKeys = new Set(brands.map((b) => b.normalizedName));
    expect(brandKeys.size).toBe(brands.length);

    const materialKeys = new Set(materials.map((m) => m.normalizedName));
    expect(materialKeys.size).toBe(materials.length);

    const tempur = brands.find((b) => b.officialName === "Tempur");
    expect(tempur?.slug).toBe("tempur");
    expect(tempur?.status).toBe("active");
    expect(tempur?.aliases.length).toBeGreaterThan(0);
    expect(tempur?.supportedLeafCategories.length).toBeGreaterThan(0);

    const memory = materials.find((m) => m.officialName === "Memory Foam");
    expect(memory?.supportedLeafCategories.length).toBeGreaterThan(0);

    expect(assertLeafBrandIndependence().ok).toBe(true);
    expect(assertLeafMaterialIndependence().ok).toBe(true);

    console.log(
      JSON.stringify({
        ...getCanonicalBrandStats(),
        ...getCanonicalMaterialStats(),
        brandLeaves: getCategoryBrandDatabaseStats().productTypePaths,
        uniqueBrandNames: getCategoryBrandDatabaseStats().uniqueBrandNames,
        uniqueMaterialNames: getCategoryMaterialDatabaseStats().uniqueMaterialNames,
      }),
    );
  });
});
