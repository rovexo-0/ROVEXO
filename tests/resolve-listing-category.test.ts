import { describe, expect, it } from "vitest";
import {
  materializeCategoryChain,
  resolveCanonicalCategoryNodes,
  type CategoryChainStore,
} from "@/lib/categories/server";

/**
 * In-memory stand-in for the `categories` table. Mirrors the real
 * `unique (slug, parent_id)` behaviour so we can prove the get-or-create walk
 * without a live Supabase connection.
 */
function createMemoryStore() {
  const rows: Array<{
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    pathLabel: string;
    sortOrder: number;
  }> = [];
  let sequence = 0;

  const store: CategoryChainStore = {
    async findId(slug, parentId) {
      return rows.find((row) => row.slug === slug && row.parentId === parentId)?.id ?? null;
    },
    async create(input) {
      const id = `cat-${(sequence += 1)}`;
      rows.push({ id, ...input });
      return id;
    },
  };

  return { store, rows };
}

describe("canonical category validation", () => {
  it("accepts real Catalog Master paths", () => {
    expect(resolveCanonicalCategoryNodes(["kids-fashion", "toys-games"])).not.toBeNull();
    expect(resolveCanonicalCategoryNodes(["kids-fashion", "toys-games", "building-sets"])).not.toBeNull();
    expect(resolveCanonicalCategoryNodes(["electronics", "phones-tablets", "smartphones"])).not.toBeNull();
    expect(resolveCanonicalCategoryNodes(["kids-fashion", "baby", "baby-clothes"])).not.toBeNull();
  });

  it("rejects invalid or incomplete paths (no bypass, no display-name matching)", () => {
    expect(resolveCanonicalCategoryNodes(["kids-fashion", "does-not-exist"])).toBeNull();
    expect(resolveCanonicalCategoryNodes(["not-a-real-root", "child"])).toBeNull();
    expect(resolveCanonicalCategoryNodes(["kids-fashion"])).toBeNull(); // needs >= 2 levels
    expect(resolveCanonicalCategoryNodes([])).toBeNull();
    // Correct slugs but wrong parent order must not resolve.
    expect(resolveCanonicalCategoryNodes(["toys-games", "kids-fashion"])).toBeNull();
  });
});

describe("materializeCategoryChain (get-or-create)", () => {
  it("creates the full chain in parent order and returns the leaf id", async () => {
    const nodes = resolveCanonicalCategoryNodes(["kids-fashion", "toys-games", "building-sets"])!;
    const { store, rows } = createMemoryStore();

    const leafId = await materializeCategoryChain(nodes, store);

    expect(leafId).toBe("cat-3");
    expect(rows.map((row) => row.slug)).toEqual(["kids-fashion", "toys-games", "building-sets"]);
    expect(rows[0]!.parentId).toBeNull();
    expect(rows[1]!.parentId).toBe(rows[0]!.id);
    expect(rows[2]!.parentId).toBe(rows[1]!.id);
    expect(rows[2]!.pathLabel).toBe("Kids & Baby > Toys & Games > Building Sets");
  });

  it("reuses existing rows and never duplicates on repeat publishes", async () => {
    const nodes = resolveCanonicalCategoryNodes(["kids-fashion", "toys-games", "building-sets"])!;
    const { store, rows } = createMemoryStore();

    const first = await materializeCategoryChain(nodes, store);
    const second = await materializeCategoryChain(nodes, store);

    expect(first).toBe(second);
    expect(rows).toHaveLength(3);
  });

  it("shares the parent chain across sibling leaves", async () => {
    const { store, rows } = createMemoryStore();

    await materializeCategoryChain(
      resolveCanonicalCategoryNodes(["kids-fashion", "toys-games", "building-sets"])!,
      store,
    );
    await materializeCategoryChain(
      resolveCanonicalCategoryNodes(["kids-fashion", "toys-games", "board-games"])!,
      store,
    );

    // kids-fashion + toys-games + building-sets + board-games = 4 rows (parents shared).
    expect(rows).toHaveLength(4);
    expect(rows.filter((row) => row.slug === "kids-fashion")).toHaveLength(1);
    expect(rows.filter((row) => row.slug === "toys-games")).toHaveLength(1);
  });
});
