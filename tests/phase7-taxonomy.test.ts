import { describe, expect, it } from "vitest";
import { categoryTree, taxonomyStats } from "@/lib/categories/marketplace-tree";
import { findNodeBySlugPath } from "@/lib/categories/navigation";
import { ENTERPRISE_SECTORS } from "@/lib/categories/enterprise/sectors";
import { getFiltersForCategorySlug } from "@/lib/categories/filters";
import { CANONICAL_ROOT_CATEGORIES } from "@/lib/categories/canonical-root-categories-v1";

describe("enterprise taxonomy (Catalog Master)", () => {
  it("has exactly ten primary categories", () => {
    expect(categoryTree).toHaveLength(10);
    expect(ENTERPRISE_SECTORS).toHaveLength(10);
    expect(taxonomyStats.roots).toBe(10);
  });

  it("documents Catalog Master taxonomy counts", () => {
    expect(taxonomyStats.roots).toBe(10);
    expect(taxonomyStats.leaves).toBeGreaterThanOrEqual(100);
    expect(taxonomyStats.branches).toBeGreaterThanOrEqual(10);
  });

  it("includes required courier-safe sectors only", () => {
    const slugs = new Set(categoryTree.map((category) => category.slug));
    for (const root of CANONICAL_ROOT_CATEGORIES) {
      expect(slugs.has(root.slug)).toBe(true);
    }
    for (const forbidden of ["vehicles", "property", "jobs", "services", "business"]) {
      expect(slugs.has(forbidden)).toBe(false);
    }
  });

  it("provides vehicle-parts filters (shippable parts only)", () => {
    const filters = getFiltersForCategorySlug("vehicle-parts", [
      "vehicle-parts",
      "car-parts",
    ]);
    expect(filters.some((filter) => filter.key === "make")).toBe(true);
    expect(filters.some((filter) => filter.key === "mileage")).toBe(false);
  });

  it("includes nested furniture and bedding departments", () => {
    const furniture = findNodeBySlugPath(categoryTree, ["home-garden", "furniture"]);
    const bedding = findNodeBySlugPath(categoryTree, ["home-garden", "bedding"]);
    expect(furniture?.map((node) => node.slug)).toEqual(["home-garden", "furniture"]);
    expect(bedding?.map((node) => node.slug)).toEqual(["home-garden", "bedding"]);
  });

  it("provides bedding filters with size", () => {
    const filters = getFiltersForCategorySlug("duvets", ["home-garden", "bedding", "duvets"]);
    expect(filters.some((filter) => filter.key === "size")).toBe(true);
  });
});
