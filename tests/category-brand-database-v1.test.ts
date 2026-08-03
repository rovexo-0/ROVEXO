import { describe, expect, it } from "vitest";
import { CATALOG_NO_BRAND } from "@/lib/catalog/brands";
import {
  assertCrossCategoryBrandSeparation,
  assertProductTypeBrandOrder,
  assertProductTypeBrandsIncludeNoBrand,
  getBrandsForProductType,
  getCategoryBrandDatabaseStats,
} from "@/lib/catalog/brands-by-product-type";
import { flatPathFromSegments } from "@/lib/categories/types";
import { loadBrandsForCategory } from "@/lib/category-loaders/scoped";
import { validateCatalogMaster } from "@/lib/catalog/validate";

function path(slugs: Array<{ slug: string; name: string }>) {
  return flatPathFromSegments(slugs.map((s) => ({ id: s.slug, slug: s.slug, name: s.name })));
}

describe("category brand database expansion — COD SÂNGE", () => {
  it("covers every product-type path with a substantial dedicated Brand DB", () => {
    const stats = getCategoryBrandDatabaseStats();
    expect(stats.productTypePaths).toBeGreaterThanOrEqual(900);
    expect(stats.uniqueBrandNames).toBeGreaterThan(150);
    expect(stats.averageBrandsPerCategory).toBeGreaterThanOrEqual(14);
    expect(stats.minBrandsPerCategory).toBeGreaterThanOrEqual(10);
  });

  it("orders every Brand DB: No Brand → Other → alphabetical", () => {
    const travel = getBrandsForProductType("travel-pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "pillows-cushions",
    });
    expect(assertProductTypeBrandsIncludeNoBrand(travel)).toBe(true);
    expect(assertProductTypeBrandOrder(travel)).toBe(true);
    expect(travel[0]).toBe(CATALOG_NO_BRAND);
    expect(travel[1]).toBe("Other");
  });

  it("loads Travel Pillow brands — not electronics brands", () => {
    const brands = getBrandsForProductType("travel-pillows", {
      rootSlug: "home-garden",
      subcategorySlug: "pillows-cushions",
    });
    expect(brands).toContain("Cabeau");
    expect(brands).toContain("Trtl");
    expect(brands).toContain("Tempur");
    expect(brands).not.toContain("Apple");
    expect(brands).not.toContain("Bosch");
  });

  it("separates Women's vs Men's clothing Brand databases", () => {
    const womens = getBrandsForProductType("jeans", {
      rootSlug: "womens-fashion",
      subcategorySlug: "clothing",
    });
    const mens = getBrandsForProductType("jeans", {
      rootSlug: "mens-fashion",
      subcategorySlug: "clothing",
    });
    expect(womens.join("|")).not.toBe(mens.join("|"));
    expect(womens).toContain("Zara");
    expect(mens).toContain("Jack & Jones");
    expect(womens).not.toContain("Apple");
    expect(mens).not.toContain("Cabeau");
  });

  it("loads phone brands for phones and laptop brands for laptops", () => {
    const phones = getBrandsForProductType("smartphones", {
      rootSlug: "electronics",
      subcategorySlug: "phones-tablets",
    });
    const laptops = getBrandsForProductType("laptops", {
      rootSlug: "electronics",
      subcategorySlug: "computers",
    });
    expect(phones).toContain("Apple");
    expect(phones).toContain("Samsung");
    expect(phones).not.toContain("Zara");
    expect(laptops).toContain("Dell");
    expect(laptops).toContain("MSI");
    expect(laptops.join("|")).not.toBe(phones.join("|"));
  });

  it("loads car-part brands — not fashion brands", () => {
    const brakes = getBrandsForProductType("brakes", {
      rootSlug: "vehicle-parts",
      subcategorySlug: "car-parts",
    });
    expect(brakes).toContain("Brembo");
    expect(brakes).toContain("Bosch");
    expect(brakes).toContain("Febi");
    expect(brakes).not.toContain("Zara");
    expect(brakes).not.toContain("Nike");
  });

  it("loads shoe brands via Sell category path", () => {
    const shoes = loadBrandsForCategory(
      path([
        { slug: "womens-fashion", name: "Women's Fashion" },
        { slug: "shoes", name: "Shoes" },
        { slug: "trainers", name: "Trainers" },
      ]),
    );
    expect(shoes[0]).toBe(CATALOG_NO_BRAND);
    expect(shoes[1]).toBe("Other");
    expect(shoes).toContain("Nike");
    expect(shoes).toContain("Clarks");
    expect(shoes).not.toContain("Apple");
  });

  it("passes cross-category fingerprint separation + catalog validation", () => {
    const separation = assertCrossCategoryBrandSeparation();
    expect(separation.ok).toBe(true);
    const report = validateCatalogMaster();
    expect(report.ok).toBe(true);
  });
});
