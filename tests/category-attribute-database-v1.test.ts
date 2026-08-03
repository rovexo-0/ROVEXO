import { describe, expect, it } from "vitest";
import { CATALOG_NO_BRAND } from "@/lib/catalog/brands";
import {
  assertCrossCategoryBrandSeparation,
  assertProductTypeBrandOrder,
  getBrandsForProductType,
  getCategoryBrandDatabaseStats,
} from "@/lib/catalog/brands-by-product-type";
import {
  assertCrossCategoryMaterialSeparation,
  getCategoryMaterialDatabaseStats,
  getMaterialsForProductType,
} from "@/lib/catalog/product-type-material-database-v1";
import { flatPathFromSegments } from "@/lib/categories/types";
import { loadBrandsForCategory, loadMaterialsForCategory } from "@/lib/category-loaders/scoped";
import { buildDeterministicPrefill } from "@/lib/sell/deterministic-prefill";
import { shouldApplyPhotoColourSuggestion } from "@/lib/sell/suggestion-field-lock";
import { createEmptyDraft } from "@/features/sell/types";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function path(slugs: Array<{ slug: string; name: string }>) {
  return flatPathFromSegments(slugs.map((s) => ({ id: s.slug, slug: s.slug, name: s.name })));
}

describe("Category Attribute Database V1.0 — COD SÂNGE", () => {
  it("expands Brand + Material databases for every product-type path", () => {
    const brands = getCategoryBrandDatabaseStats();
    const materials = getCategoryMaterialDatabaseStats();
    expect(brands.productTypePaths).toBeGreaterThanOrEqual(900);
    expect(brands.averageBrandsPerCategory).toBeGreaterThanOrEqual(14);
    expect(materials.productTypePaths).toBeGreaterThanOrEqual(900);
    expect(materials.uniqueMaterialNames).toBeGreaterThan(40);
    expect(materials.averageMaterialsPerCategory).toBeGreaterThanOrEqual(8);
  });

  it("Travel Pillows: own brands + materials — never phone brands", () => {
    const brands = getBrandsForProductType("travel-pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "pillows-cushions",
    });
    const materials = getMaterialsForProductType("travel-pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "pillows-cushions",
    });
    expect(assertProductTypeBrandOrder(brands)).toBe(true);
    expect(brands[0]).toBe(CATALOG_NO_BRAND);
    expect(brands[1]).toBe("Other");
    expect(brands).toContain("Cabeau");
    expect(brands).not.toContain("Apple");
    expect(materials).toContain("Memory Foam");
    expect(materials).toContain("Microfibre");
    expect(materials).not.toContain("Titanium");
  });

  it("Phones never display furniture brands or furniture materials", () => {
    const brands = getBrandsForProductType("smartphones", {
      rootSlug: "electronics",
      subcategorySlug: "phones-tablets",
    });
    const materials = getMaterialsForProductType("smartphones", {
      rootSlug: "electronics",
      subcategorySlug: "phones-tablets",
    });
    expect(brands).toContain("Apple");
    expect(brands).not.toContain("IKEA");
    expect(brands).not.toContain("Zara");
    expect(materials).toContain("Glass");
    expect(materials).not.toContain("Oak");
    expect(materials).not.toContain("MDF");
  });

  it("Shoes never display electronics brands", () => {
    const brands = loadBrandsForCategory(
      path([
        { slug: "womens-fashion", name: "Women's Fashion" },
        { slug: "shoes", name: "Shoes" },
        { slug: "trainers", name: "Trainers" },
      ]),
    );
    expect(brands).toContain("Nike");
    expect(brands).not.toContain("Apple");
    expect(brands).not.toContain("Dell");
  });

  it("Furniture never displays clothing brands; own materials only", () => {
    const brands = getBrandsForProductType("sofas-and-armchairs", {
      rootSlug: "home-garden",
      subcategorySlug: "furniture",
    });
    const materials = getMaterialsForProductType("sofas-and-armchairs", {
      rootSlug: "home-garden",
      subcategorySlug: "furniture",
    });
    expect(brands).not.toContain("Zara");
    expect(brands).not.toContain("Nike");
    expect(materials).toContain("Wood");
    expect(materials).toContain("Oak");
    expect(materials).not.toContain("Lace");
  });

  it("Women's vs Men's clothing use dedicated Brand and Material DBs", () => {
    const wBrands = getBrandsForProductType("jeans", {
      rootSlug: "womens-fashion",
      subcategorySlug: "clothing",
    });
    const mBrands = getBrandsForProductType("jeans", {
      rootSlug: "mens-fashion",
      subcategorySlug: "clothing",
    });
    const wMats = getMaterialsForProductType("jeans", {
      rootSlug: "womens-fashion",
      subcategorySlug: "clothing",
    });
    const mMats = getMaterialsForProductType("jeans", {
      rootSlug: "mens-fashion",
      subcategorySlug: "clothing",
    });
    expect(wBrands.join("|")).not.toBe(mBrands.join("|"));
    expect(wMats.join("|")).not.toBe(mMats.join("|"));
    expect(wMats).toContain("Lace");
    expect(mMats).not.toContain("Lace");
  });

  it("never auto-selects Brand / Material / Colour / Condition", () => {
    const draft = createEmptyDraft();
    draft.title = "Nike black leather trainers Like New Memory Foam";
    expect(buildDeterministicPrefill(draft)).toEqual({});
    expect(shouldApplyPhotoColourSuggestion(draft)).toBe(false);
  });

  it("SellOptionPicker: Brand/Material search only · 2-char · accent-insensitive", () => {
    const picker = readFileSync(
      join(process.cwd(), "features/sell/ui/SellOptionPicker.tsx"),
      "utf8",
    );
    expect(picker).toMatch(
      /effectiveSearchable\s*=\s*Boolean\(searchable\s*&&\s*\(isBrandPicker\s*\|\|\s*isMaterialPicker\)\)/,
    );
    expect(picker).toContain("SEARCH_MIN_CHARS = 2");
    expect(picker).toContain('normalize("NFD")');
    expect(picker).toContain("\\p{M}");
  });

  it("passes cross-category Brand + Material separation", () => {
    expect(assertCrossCategoryBrandSeparation().ok).toBe(true);
    expect(assertCrossCategoryMaterialSeparation().ok).toBe(true);
  });

  it("Sell category path loads scoped materials for Travel Pillows", () => {
    const materials = loadMaterialsForCategory(
      path([
        { slug: "home-garden", name: "Home & Garden" },
        { slug: "pillows-cushions", name: "Pillows & Cushions" },
        { slug: "travel-pillows", name: "Travel Pillows" },
      ]),
    );
    expect(materials).toContain("Memory Foam");
    expect(materials).toContain("Velour");
    expect(materials.at(-1)).toBe("Other");
  });
});
