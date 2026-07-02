import { describe, expect, it } from "vitest";

describe("taxonomy build steps", () => {
  it("step 1: getFlatTaxonomy", async () => {
    const { getFlatTaxonomy } = await import("@/lib/taxonomy/category-tree");
    const start = performance.now();
    const flat = getFlatTaxonomy();
    const ms = performance.now() - start;
    console.info(`[bench] getFlatTaxonomy: ${flat.length} nodes in ${ms.toFixed(1)}ms`);
    expect(flat.length).toBeGreaterThan(0);
    expect(ms).toBeLessThan(60_000);
  }, 120_000);
});
