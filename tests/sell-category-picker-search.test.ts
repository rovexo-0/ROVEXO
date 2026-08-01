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

  it("returns Catalog Master suggestions for phone queries (iph)", () => {
    const results = searchCategoryPicker("iph");
    expect(results.length).toBeGreaterThan(0);
    expect(resultNames("iph")).toEqual(expect.arrayContaining(["iPhones", "Phones & Tablets"]));
  });

  it("returns Catalog Master suggestions for camping queries (tent)", () => {
    const names = resultNames("tent");
    expect(names).toEqual(expect.arrayContaining(["Outdoor & Camping", "Camping Tents"]));
  });

  it("returns Owner Catalog Master product types for Sell search queries", () => {
    const cases: Array<{ query: string; mustInclude: RegExp }> = [
      { query: "Travel Pillow", mustInclude: /travel pillows?/i },
      { query: "Pregnancy Pillow", mustInclude: /pregnancy pillows?/i },
      { query: "Memory Foam Pillow", mustInclude: /memory foam pillows?/i },
      { query: "Camping Tent", mustInclude: /camping tents?/i },
      { query: "Sleeping Bag", mustInclude: /sleeping bags?/i },
      { query: "Garden Chair", mustInclude: /garden chairs?/i },
      { query: "BBQ", mustInclude: /bbq/i },
      { query: "iPhone", mustInclude: /iphones?/i },
      { query: "Football Boots", mustInclude: /football boots?/i },
      { query: "Running Shoes", mustInclude: /running shoes?/i },
    ];
    for (const { query, mustInclude } of cases) {
      const results = searchCategoryPicker(query);
      expect(results.length, `no results for "${query}"`).toBeGreaterThan(0);
      expect(
        results.some(
          (result) =>
            mustInclude.test(result.matchName) || mustInclude.test(result.breadcrumb),
        ),
        `expected ${mustInclude} for "${query}", got ${results
          .slice(0, 5)
          .map((r) => r.breadcrumb)
          .join(" | ")}`,
      ).toBe(true);
      // First hit must never be Women's Fashion Bags for sleeping/camping queries.
      if (/sleeping|camping tent/i.test(query)) {
        expect(results[0]?.breadcrumb).not.toMatch(/Women's Fashion > Bags/i);
        expect(results[0]?.breadcrumb).toMatch(/Sports & Outdoors/i);
      }
    }
  });

  it("returns matching Catalog Master suggestions for bench queries", () => {
    const names = resultNames("bench");
    expect(names).toEqual(expect.arrayContaining(["Garden Benches"]));
  });

  it("returns textile suggestions for home textiles", () => {
    const names = resultNames("textile");
    expect(names).toEqual(expect.arrayContaining(["Home Textiles"]));
  });

  it("produces globally unique render keys for hierarchical suggestions", () => {
    // Regression: hierarchical results (root → branch → leaf) share the same
    // leaf path, so the picker key must include matchDepth to stay unique.
    for (const query of ["iph", "tent", "board games", "pillow"]) {
      const keys = searchCategoryPicker(query).map(
        (result) =>
          `${result.path.segments.map((segment) => segment.slug).join("/")}#${result.matchDepth}`,
      );
      expect(new Set(keys).size, `duplicate render key for "${query}"`).toBe(keys.length);
    }
  });

  it("debounces-friendly search completes quickly", () => {
    warmCategoryPickerIndex();
    const start = performance.now();
    searchCategoryPicker("electronics");
    expect(performance.now() - start).toBeLessThan(100);
  });
});
