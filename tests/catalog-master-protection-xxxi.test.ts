import { describe, expect, it } from "vitest";
import {
  CATALOG_MASTER_PROTECTION_V1,
  CATALOG_MASTER_V1,
  getCatalogMasterCacheKey,
  verifyCatalogMasterProtection,
  assertCatalogMasterProtectionOrBlock,
  assertCatalogMasterTreeOrThrow,
} from "@/lib/catalog";
import { getCategoryTree } from "@/lib/categories/queries";
import { CATEGORY_TREE_CACHE_KEY } from "@/lib/categories/category-loader";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("Absolute Law XXXI — Catalog Master Protection", () => {
  it("defines fail-closed protection contract", () => {
    expect(CATALOG_MASTER_PROTECTION_V1.law).toBe("XXXI");
    expect(CATALOG_MASTER_V1.onlyCategorySource).toBe(true);
    expect(CATALOG_MASTER_PROTECTION_V1.forbidden).toContain("silent-legacy-fallback");
  });

  it("passes protection against live getCategoryTree()", () => {
    const tree = getCategoryTree();
    const report = verifyCatalogMasterProtection(tree);
    expect(report.ok, report.ok ? "" : report.errors.join("; ")).toBe(true);
    expect(() => assertCatalogMasterProtectionOrBlock(tree)).not.toThrow();
    expect(() => assertCatalogMasterTreeOrThrow(tree)).not.toThrow();
  });

  it("blocks legacy root trees", () => {
    const legacy = [
      { id: "1", name: "Vehicles", slug: "vehicles" },
      { id: "2", name: "Property", slug: "property" },
    ];
    expect(() => assertCatalogMasterTreeOrThrow(legacy)).toThrow(/LAW XXXI/);
    const report = verifyCatalogMasterProtection(legacy);
    expect(report.ok).toBe(false);
    expect(report.blocked).toBe(true);
  });

  it("ties cache key to Catalog Master epoch (no legacy v1)", () => {
    const key = getCatalogMasterCacheKey();
    expect(key).toBe(CATEGORY_TREE_CACHE_KEY);
    expect(key).toContain("catalog-master");
    expect(key).toContain(CATALOG_MASTER_PROTECTION_V1.cacheEpoch);
    expect(key).not.toContain("category-tree:v1");
  });

  it("startup instrumentation runs Catalog Master gate", () => {
    const source = readFileSync(path.join(process.cwd(), "instrumentation.ts"), "utf8");
    expect(source).toContain("runCatalogMasterStartupGate");
    expect(source).toContain("getCategoryTree");
  });

  it("DB tree builder never returns database taxonomy", () => {
    const source = readFileSync(
      path.join(process.cwd(), "lib/categories/build-tree-from-db.ts"),
      "utf8",
    );
    expect(source).toContain("getCategoryTree");
    expect(source).not.toContain("loadAllCategories");
  });
});
