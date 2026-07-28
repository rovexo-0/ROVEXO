import { describe, expect, it } from "vitest";
import { categoryTree, homeCategories, taxonomyStats } from "@/lib/categories/tree";
import {
  findNodeBySlugPath,
  collectLeafPaths,
  breadcrumbsFromPath,
} from "@/lib/categories/navigation";
import {
  flattenCategoryPaths,
  resolveCategoryPathBySlugs,
} from "@/lib/categories/queries";
import { flatPathFromSegments } from "@/lib/categories/types";
import { CANONICAL_ROOT_CATEGORIES } from "@/lib/categories/canonical-root-categories-v1";

describe("marketplace category tree (Catalog Master)", () => {
  it("includes exactly the nine canonical courier-safe roots", () => {
    const slugs = homeCategories.map((category) => category.slug);
    expect(slugs).toEqual(CANONICAL_ROOT_CATEGORIES.map((r) => r.slug));
    for (const forbidden of ["vehicles", "property", "business", "jobs", "services"]) {
      expect(slugs).not.toContain(forbidden);
    }
  });

  it("meets Catalog Master scale (essential, not mega-dump)", () => {
    expect(categoryTree).toHaveLength(10);
    expect(taxonomyStats.roots).toBe(10);
    expect(taxonomyStats.leaves).toBeGreaterThanOrEqual(100);
  });

  it("supports Home & Garden nesting", () => {
    const path = findNodeBySlugPath(categoryTree, ["home-garden", "furniture", "beds-and-mattresses"]);
    expect(path?.map((node) => node.slug)).toEqual([
      "home-garden",
      "furniture",
      "beds-and-mattresses",
    ]);
  });

  it("builds breadcrumbs for nested paths", () => {
    const path = findNodeBySlugPath(categoryTree, ["home-garden", "bedding", "duvet-covers"]);
    expect(path).not.toBeNull();
    const crumbs = breadcrumbsFromPath(path!);
    expect(crumbs.at(-1)?.href).toBe("/category/home-garden/bedding/duvet-covers");
  });

  it("flattens leaf paths with segment arrays", () => {
    const leaves = collectLeafPaths(categoryTree);
    expect(leaves.length).toBeGreaterThan(100);
    const first = flatPathFromSegments(leaves[0]!.segments);
    expect(first.segments.length).toBeGreaterThanOrEqual(2);
    expect(first.pathLabel).toContain(">");
  });

  it("resolves category paths by slug arrays", () => {
    expect(
      resolveCategoryPathBySlugs(["electronics", "phones-tablets", "smartphones"]),
    ).not.toBeNull();
    expect(resolveCategoryPathBySlugs(["electronics", "computers", "laptops"])).not.toBeNull();
    expect(
      resolveCategoryPathBySlugs(["vehicle-parts", "tyres-and-wheels", "car-tyres"]),
    ).not.toBeNull();
    expect(resolveCategoryPathBySlugs(["electronics", "tv-audio", "televisions"])).not.toBeNull();
  });

  it("keeps legacy flatten helper working", () => {
    const paths = flattenCategoryPaths();
    expect(paths.every((path) => path.segments.length >= 2)).toBe(true);
  });
});
