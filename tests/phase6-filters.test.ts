import { describe, expect, it } from "vitest";
import { getFiltersForCategorySlug, getAllFilterGroupSlugs } from "@/lib/categories/filters";

describe("category filters", () => {
  it("provides vehicle-specific filters", () => {
    const filters = getFiltersForCategorySlug("vehicles");
    expect(filters.some((filter) => filter.key === "make")).toBe(true);
    expect(filters.some((filter) => filter.key === "mileage")).toBe(true);
  });

  it("provides bedding size filters", () => {
    const filters = getFiltersForCategorySlug("bedding");
    expect(filters.some((filter) => filter.key === "size")).toBe(true);
  });

  it("falls back to common filters for unknown categories", () => {
    const filters = getFiltersForCategorySlug("unknown-category");
    expect(filters.some((filter) => filter.key === "condition")).toBe(true);
  });

  it("covers enterprise top-level slugs", () => {
    const slugs = getAllFilterGroupSlugs();
    for (const slug of ["travel", "events", "free-stuff", "everything-else"]) {
      expect(slugs).toContain(slug);
    }
  });
});
