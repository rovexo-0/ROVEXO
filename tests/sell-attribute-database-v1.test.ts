import { describe, expect, it } from "vitest";
import { CATALOG_NO_BRAND } from "@/lib/catalog/brands";
import { getBrandsForProductType } from "@/lib/catalog/brands-by-product-type";
import { flatPathFromSegments } from "@/lib/categories/types";
import {
  excludesElectronicsBrands,
  loadBrandsForCategory,
  loadCategoryScopedTaxonomy,
  loadColoursForCategory,
  loadMaterialsForCategory,
  orderSellBrandDatabase,
} from "@/lib/category-loaders/scoped";
import { createEmptyDraft } from "@/features/sell/types";
import { buildDeterministicPrefill } from "@/lib/sell/deterministic-prefill";
import { shouldApplyPhotoColourSuggestion } from "@/lib/sell/suggestion-field-lock";

function path(slugs: Array<{ slug: string; name: string }>) {
  return flatPathFromSegments(slugs.map((s) => ({ id: s.slug, slug: s.slug, name: s.name })));
}

describe("sell category attribute database — COD SÂNGE", () => {
  it("orders brands: No Brand → Other → alphabetical official brands", () => {
    const ordered = orderSellBrandDatabase(["Zebra", "Apple", "Nike"]);
    expect(ordered[0]).toBe(CATALOG_NO_BRAND);
    expect(ordered[1]).toBe("Other");
    expect(ordered.slice(2)).toEqual(["Apple", "Nike", "Zebra"]);
  });

  it("loads footwear brands for trainers — not phone brands", () => {
    const trainers = path([
      { slug: "womens-fashion", name: "Women's Fashion" },
      { slug: "shoes", name: "Shoes" },
      { slug: "trainers", name: "Trainers" },
    ]);
    const brands = loadBrandsForCategory(trainers);
    expect(brands[0]).toBe(CATALOG_NO_BRAND);
    expect(brands[1]).toBe("Other");
    expect(brands).toContain("Nike");
    expect(brands).not.toContain("Apple");
    expect(excludesElectronicsBrands(trainers)).toBe(true);
  });

  it("loads electronics brands for phones — not fashion-only lists", () => {
    const phones = path([
      { slug: "electronics", name: "Electronics" },
      { slug: "phones-tablets", name: "Phones & Tablets" },
      { slug: "smartphones", name: "Smartphones" },
    ]);
    const brands = loadBrandsForCategory(phones);
    expect(brands).toContain("Apple");
    expect(brands).toContain("Samsung");
    expect(getBrandsForProductType("smartphones", {
      rootSlug: "electronics",
      subcategorySlug: "phones-tablets",
    }).length).toBeGreaterThan(2);
  });

  it("loads home/pillow brand scope for travel pillows", () => {
    const pillows = path([
      { slug: "home-garden", name: "Home & Garden" },
      { slug: "bedding", name: "Bedding" },
      { slug: "travel-pillows", name: "Travel Pillows" },
    ]);
    const taxonomy = loadCategoryScopedTaxonomy(pillows);
    expect(taxonomy).not.toBeNull();
    expect(taxonomy!.brands[0]).toBe(CATALOG_NO_BRAND);
    expect(taxonomy!.brands[1]).toBe("Other");
    expect(taxonomy!.materials.length).toBeGreaterThan(0);
    expect(taxonomy!.colours.length).toBeGreaterThan(0);
    expect(taxonomy!.conditions.length).toBeGreaterThan(0);
    expect(loadMaterialsForCategory(pillows).length).toBeGreaterThan(0);
    expect(loadColoursForCategory(pillows).length).toBeGreaterThan(0);
  });

  it("loads vehicle-part brands for car parts — not fashion brands", () => {
    const parts = path([
      { slug: "vehicle-parts", name: "Vehicle Parts & Accessories" },
      { slug: "braking", name: "Braking" },
      { slug: "brakes", name: "Brakes" },
    ]);
    const brands = loadBrandsForCategory(parts);
    expect(brands).toContain("Brembo");
    expect(brands).not.toContain("Zara");
  });

  it("never auto-selects attributes when category or title changes", () => {
    const draft = createEmptyDraft();
    draft.title = "Nike black trainers Like New";
    draft.description = "Cotton memory foam";
    expect(buildDeterministicPrefill(draft)).toEqual({});
    expect(shouldApplyPhotoColourSuggestion(draft)).toBe(false);
  });
});
