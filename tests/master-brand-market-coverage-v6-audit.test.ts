import { describe, it, expect } from "vitest";
import {
  getCategoryBrandDatabaseStats,
  getAllProductTypeBrandPaths,
  getBrandsForProductTypePath,
  assertLeafBrandIndependence,
  resetProductTypeBrandDatabaseCacheForTests,
  getCanonicalBrandStats,
  getCanonicalBrandRegistry,
} from "@/lib/catalog/brands-by-product-type";
import {
  getCategoryMaterialDatabaseStats,
  assertLeafMaterialIndependence,
  resetProductTypeMaterialDatabaseCacheForTests,
} from "@/lib/catalog/product-type-material-database-v1";
import type { ProductTypeBrandContext } from "@/lib/catalog/brands-by-product-type";

describe("V6 market coverage audit", () => {
  resetProductTypeBrandDatabaseCacheForTests();
  resetProductTypeMaterialDatabaseCacheForTests();

  it("reports weakest leaf brand coverage", () => {
    const paths = getAllProductTypeBrandPaths();
    const rows: { path: string; count: number; brands: string[] }[] = [];
    for (const path of paths) {
      const [rootSlug, subcategorySlug, productTypeSlug] = path.split("/");
      const ctx: ProductTypeBrandContext = {
        rootSlug: rootSlug!,
        subcategorySlug: subcategorySlug!,
        productTypeSlug: productTypeSlug!,
      };
      const brands = getBrandsForProductTypePath(ctx).filter(
        (b) => b !== "No Brand" && b !== "Other",
      );
      rows.push({ path, count: brands.length, brands: brands.slice(0, 8) });
    }
    rows.sort((a, b) => a.count - b.count);
    const stats = getCategoryBrandDatabaseStats();
    const mat = getCategoryMaterialDatabaseStats();
    // force registry
    getCanonicalBrandRegistry();
    const weak = rows.filter((r) => r.count < 25);
    const byRoot = new Map<string, { n: number; sum: number; min: number }>();
    for (const r of rows) {
      const root = r.path.split("/")[0]!;
      const cur = byRoot.get(root) ?? { n: 0, sum: 0, min: 9999 };
      cur.n += 1;
      cur.sum += r.count;
      cur.min = Math.min(cur.min, r.count);
      byRoot.set(root, cur);
    }
    console.log(
      JSON.stringify(
        {
          stats,
          mat,
          canonical: getCanonicalBrandStats(),
          independence: {
            brand: assertLeafBrandIndependence().ok,
            material: assertLeafMaterialIndependence().ok,
          },
          weakest20: rows.slice(0, 20),
          weakUnder25: weak.length,
          rootAvg: [...byRoot.entries()].map(([root, v]) => ({
            root,
            leaves: v.n,
            avg: Math.round((v.sum / v.n) * 10) / 10,
            min: v.min,
          })),
        },
        null,
        2,
      ),
    );
    expect(paths.length).toBe(960);
  });
});
