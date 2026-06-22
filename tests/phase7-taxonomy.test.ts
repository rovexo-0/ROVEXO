import { describe, expect, it } from "vitest";
import { categoryTree, taxonomyStats } from "@/lib/categories/marketplace-tree";
import { findNodeBySlugPath } from "@/lib/categories/navigation";
import { ENTERPRISE_SECTORS } from "@/lib/categories/enterprise/sectors";
import { getFiltersForCategorySlug } from "@/lib/categories/filters";

describe("enterprise taxonomy", () => {
  it("has 50+ primary categories", () => {
    expect(categoryTree.length).toBeGreaterThanOrEqual(50);
    expect(ENTERPRISE_SECTORS.length).toBeGreaterThanOrEqual(50);
  });

  it("documents enterprise taxonomy counts", () => {
    expect(taxonomyStats).toMatchInlineSnapshot(`
      {
        "branches": 285,
        "leaves": 1006,
        "roots": 55,
      }
    `);
  });

  it("includes required UK marketplace sectors", () => {
    const slugs = new Set(categoryTree.map((category) => category.slug));
    for (const slug of [
      "vehicles",
      "property",
      "phones",
      "computers",
      "gaming",
      "tv-audio",
      "home-garden",
      "diy",
      "tools",
      "womens-fashion",
      "mens-fashion",
      "shoes",
      "jewellery",
      "beauty",
      "health",
      "baby",
      "pets",
      "sports",
      "cycling",
      "fishing",
      "camping",
      "books",
      "collectibles",
      "office",
      "business",
      "services",
      "jobs",
      "food",
      "travel",
      "events",
      "free-stuff",
      "everything-else",
    ]) {
      expect(slugs.has(slug)).toBe(true);
    }
  });

  it("provides vehicle filters with enterprise fields", () => {
    const filters = getFiltersForCategorySlug("cars", ["vehicles", "cars"]);
    for (const key of ["make", "model", "fuel", "mileage", "ulez"]) {
      expect(filters.some((filter) => filter.key === key)).toBe(true);
    }
  });

  it("includes nested furniture and bedding departments", () => {
    const slugs = new Set(categoryTree.map((category) => category.slug));
    expect(slugs.has("home-garden")).toBe(true);
    const furniture = findNodeBySlugPath(categoryTree, ["home-garden", "furniture"]);
    const bedding = findNodeBySlugPath(categoryTree, ["home-garden", "bedding"]);
    expect(furniture?.map((node) => node.slug)).toEqual(["home-garden", "furniture"]);
    expect(bedding?.map((node) => node.slug)).toEqual(["home-garden", "bedding"]);
  });

  it("provides bedding filters with size and thread count", () => {
    const filters = getFiltersForCategorySlug("duvets", ["home-garden", "bedding", "duvets"]);
    expect(filters.some((filter) => filter.key === "size")).toBe(true);
    expect(filters.some((filter) => filter.key === "thread_count")).toBe(true);
  });
});
