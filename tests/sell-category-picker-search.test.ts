import { describe, expect, it } from "vitest";
import { searchCategoryPicker, warmCategoryPickerIndex } from "@/lib/sell/category-picker-search";
import { resolveCategoryPathBySlugs } from "@/lib/categories/queries";

function resultNames(query: string) {
  return searchCategoryPicker(query).map((result) => result.matchName);
}

describe("category picker search (database-only, no AI)", () => {
  it("returns canonical, publishable paths only", () => {
    const results = searchCategoryPicker("pillow");
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      const slugs = result.path.segments.map((segment) => segment.slug);
      expect(resolveCategoryPathBySlugs(slugs)).not.toBeNull();
    }
  });

  it("maps synonyms / plurals / UK terms onto canonical categories", () => {
    for (const query of ["pillow", "pillows", "cushion", "bolster", "travel pillow", "reading pillow"]) {
      const results = searchCategoryPicker(query);
      expect(results.length, `no results for "${query}"`).toBeGreaterThan(0);
      expect(
        results.some((result) => /pillow/i.test(result.matchName)),
        `expected a Pillows match for "${query}"`,
      ).toBe(true);
    }
  });

  it("returns nothing for blank / too-short queries", () => {
    expect(searchCategoryPicker("")).toEqual([]);
    expect(searchCategoryPicker("a")).toEqual([]);
  });

  it("finds common products by name", () => {
    for (const query of ["laptop", "sofa", "trainers"]) {
      expect(searchCategoryPicker(query).length, `no results for "${query}"`).toBeGreaterThan(0);
    }
  });

  it("returns hierarchical suggestions for phone queries (iph)", () => {
    const results = searchCategoryPicker("iph");
    expect(results.length).toBeGreaterThan(0);
    expect(resultNames("iph")).toEqual(expect.arrayContaining(["Phones", "Smartphones", "Apple iPhone"]));
  });

  it("returns hierarchical suggestions for camping queries (tent)", () => {
    const names = resultNames("tent");
    expect(names).toEqual(expect.arrayContaining(["Camping", "Tents", "Family Tents"]));
  });

  it("returns multi-vertical suggestions for bench queries", () => {
    const names = resultNames("bench");
    expect(names).toEqual(expect.arrayContaining(["Interior", "Bench Seats", "Benches"]));
    expect(names.filter((name) => name === "Benches").length).toBeGreaterThanOrEqual(1);
  });

  it("returns textile suggestions for home textiles", () => {
    const names = resultNames("textile");
    expect(names).toEqual(expect.arrayContaining(["Home & Garden", "Home Textiles"]));
  });

  it("debounces-friendly search completes quickly", () => {
    warmCategoryPickerIndex();
    const start = performance.now();
    searchCategoryPicker("electronics");
    expect(performance.now() - start).toBeLessThan(100);
  });
});
