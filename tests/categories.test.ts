import { describe, expect, it } from "vitest";
import { categoryTree, homeCategories } from "@/lib/categories/tree";
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

describe("marketplace category tree", () => {
  it("includes all major top-level marketplace verticals", () => {
    const slugs = new Set(homeCategories.map((category) => category.slug));
    for (const slug of [
      "vehicles",
      "property",
      "electronics",
      "fashion",
      "home-garden",
      "diy",
      "tools",
      "sports",
      "health",
      "beauty",
      "pets",
      "baby-kids",
      "toys",
      "books",
      "music",
      "movies",
      "gaming",
      "collectibles",
      "business",
      "jobs",
      "services",
      "tickets",
      "food",
      "office",
      "industrial",
      "agriculture",
    ]) {
      expect(slugs.has(slug)).toBe(true);
    }
  });

  it("supports deep Home & Garden nesting", () => {
    const path = findNodeBySlugPath(categoryTree, [
      "home-garden",
      "furniture",
      "beds",
    ]);
    expect(path?.map((node) => node.slug)).toEqual(["home-garden", "furniture", "beds"]);
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
    expect(first.pathLabel).toContain("›");
  });

  it("resolves category paths by slug arrays", () => {
    const flat = resolveCategoryPathBySlugs(["electronics", "phones-tablets", "smartphones"]);
    expect(flat?.pathLabel).toContain("Electronics");
    expect(flat?.segments.at(-1)?.slug).toBe("smartphones");
  });

  it("keeps legacy flatten helper working", () => {
    const paths = flattenCategoryPaths();
    expect(paths.every((path) => path.segments.length >= 2)).toBe(true);
  });
});
