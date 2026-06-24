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

describe("marketplace category tree", () => {
  it("includes all major top-level marketplace verticals", () => {
    const slugs = new Set(homeCategories.map((category) => category.slug));
    for (const slug of [
      "vehicles",
      "property",
      "phones",
      "computers",
      "electronics",
      "gaming",
      "tv-audio",
      "womens-fashion",
      "mens-fashion",
      "kids-fashion",
      "home-garden",
      "diy",
      "tools",
      "sports",
      "health",
      "beauty",
      "pets",
      "baby",
      "toys",
      "books",
      "music",
      "movies",
      "collectibles",
      "business",
      "jobs",
      "services",
      "tickets",
      "food",
      "office",
      "industrial",
      "agriculture",
      "travel",
      "events",
      "free-stuff",
      "everything-else",
      "cycling",
      "fishing",
      "camping",
    ]) {
      expect(slugs.has(slug)).toBe(true);
    }
  });

  it("meets enterprise taxonomy scale targets", () => {
    expect(categoryTree.length).toBeGreaterThanOrEqual(50);
    expect(taxonomyStats.leaves).toBeGreaterThanOrEqual(1000);
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
    const flat = resolveCategoryPathBySlugs(["phones", "smartphones", "unlocked-phones"]);
    expect(flat?.pathLabel).toContain("Phones");
    expect(flat?.segments.at(-1)?.slug).toBe("unlocked-phones");

    expect(resolveCategoryPathBySlugs(["tools", "power-tools", "drills"])).not.toBeNull();
    expect(resolveCategoryPathBySlugs(["car-parts", "wheels-tyres", "tyres"])).not.toBeNull();
    expect(resolveCategoryPathBySlugs(["electronics", "tv-video", "televisions"])).not.toBeNull();
  });

  it("keeps legacy flatten helper working", () => {
    const paths = flattenCategoryPaths();
    expect(paths.every((path) => path.segments.length >= 2)).toBe(true);
  });
});
