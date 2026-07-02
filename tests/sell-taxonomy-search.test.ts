import { describe, expect, it } from "vitest";

/**
 * Performance regression guard for the Sell category pipeline.
 * Protects the fixes for the "Page Unresponsive" freeze:
 *  - buildTaxonomyTree must not infinite-loop (ensureUniqueSlug termination)
 *  - per-keystroke search must stay well under one 60 FPS frame (16.7 ms)
 *  - synonym lookup must be a token-index hit, not an O(index) substring scan
 */
describe("sell taxonomy performance guard", () => {
  it("builds once and searches within a frame budget", async () => {
    const { getFlatTaxonomy } = await import("@/lib/taxonomy/category-tree");
    const { getSynonymMatches } = await import("@/lib/taxonomy/category-synonyms");
    const { searchCategories, warmCategoryIndexes } = await import("@/lib/taxonomy/category-search");

    // Tree build must complete (previously hung forever on a duplicate slug).
    const flat = getFlatTaxonomy();
    expect(flat.length).toBeGreaterThan(1000);

    // One-time index warm (mirrors the Sell page mount warm-up).
    warmCategoryIndexes();

    // Warm, per-keystroke-scale search cost.
    let total = 0;
    const runs = 20;
    for (let i = 0; i < runs; i += 1) {
      const t = performance.now();
      searchCategories("nike air max trainers size 9", { limit: 5, includeNonLeaf: false });
      total += performance.now() - t;
    }
    const perCall = total / runs;
    expect(perCall).toBeLessThan(16);

    // Common token must not return the old 12k+ substring garbage.
    expect(getSynonymMatches("in").length).toBeLessThan(2000);
  }, 60_000);
});
