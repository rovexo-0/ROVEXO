import { describe, expect, it } from "vitest";
import { categoryTree } from "@/lib/categories/tree";
import { getCategoryTree } from "@/lib/categories/queries";
import { isCatalogMasterRootTree } from "@/lib/categories/is-catalog-master-tree";
import { CATALOG_SECTORS, CATALOG_MASTER_V1 } from "@/lib/catalog";
import { readFileSync } from "node:fs";
import path from "node:path";

const ILLEGAL_SELL_ROOTS = [
  "vehicles",
  "property",
  "business",
  "jobs",
  "services",
  "tickets",
  "food",
  "agriculture",
  "travel",
  "events",
  "free-stuff",
  "everything-else",
  "pets",
] as const;

describe("Sell Category data source → Catalog Master", () => {
  it("SellCategoryPicker imports tree + loader (UI unchanged)", () => {
    const source = readFileSync(
      path.join(process.cwd(), "features/sell/ui/SellCategoryPicker.tsx"),
      "utf8",
    );
    expect(source).toContain('from "@/lib/categories/tree"');
    expect(source).toContain("loadCategoriesWithRecovery");
    expect(source).not.toContain("buildCategoryTreeFromDatabase");
  });

  it("static categoryTree is Catalog Master (10 courier-safe roots)", () => {
    expect(isCatalogMasterRootTree(categoryTree)).toBe(true);
    expect(getCategoryTree()).toBe(categoryTree);
    expect(categoryTree).toHaveLength(CATALOG_MASTER_V1.rootCount);
    expect(categoryTree.map((n) => n.slug)).toEqual(CATALOG_SECTORS.map((s) => s.slug));
  });

  it("rejects every illegal legacy root from the Sell data path", () => {
    const slugs = new Set(categoryTree.map((n) => n.slug));
    for (const illegal of ILLEGAL_SELL_ROOTS) {
      expect(slugs.has(illegal), `illegal root still present: ${illegal}`).toBe(false);
    }
  });

  it("API route serves Catalog Master only (not DB legacy)", () => {
    const route = readFileSync(
      path.join(process.cwd(), "app/api/categories/tree/route.ts"),
      "utf8",
    );
    expect(route).toContain("getCategoryTree");
    expect(route).toContain("catalog-master");
    expect(route).not.toContain("buildCategoryTreeFromDatabase");
  });
});
