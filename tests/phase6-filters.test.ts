import { describe, expect, it } from "vitest";
import { getFiltersForCategorySlug, getAllFilterGroupSlugs } from "@/lib/categories/filters";

describe("category filters", () => {
  it("provides vehicle-parts filters (courier shippable)", () => {
    const filters = getFiltersForCategorySlug("vehicle-parts");
    expect(filters.some((filter) => filter.key === "make")).toBe(true);
    expect(filters.some((filter) => filter.key === "mileage")).toBe(false);
  });

  it("provides bedding size filters", () => {
    const filters = getFiltersForCategorySlug("bedding");
    expect(filters.some((filter) => filter.key === "size")).toBe(true);
  });

  it("falls back to common filters for unknown categories", () => {
    const filters = getFiltersForCategorySlug("unknown-category");
    expect(filters.some((filter) => filter.key === "condition")).toBe(true);
  });

  it("covers Catalog Master filter group slugs", () => {
    const slugs = getAllFilterGroupSlugs();
    for (const slug of [
      "electronics",
      "home-garden",
      "womens-fashion",
      "vehicle-parts",
      "books",
    ]) {
      expect(slugs).toContain(slug);
    }
    for (const forbidden of ["vehicles", "property", "jobs", "services"]) {
      expect(slugs).not.toContain(forbidden);
    }
  });
});
