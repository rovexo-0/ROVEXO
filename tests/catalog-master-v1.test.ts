import { describe, expect, it } from "vitest";
import {
  CATALOG_MASTER_V1,
  CATALOG_SECTORS,
  CATALOG_COLOURS,
  CATALOG_BRANDS,
  CATALOG_NO_BRAND,
  validateCatalogMaster,
  resolveProductTypeAttributes,
  getBrandsForProductType,
} from "@/lib/catalog";
import { CANONICAL_ROOT_CATEGORIES } from "@/lib/categories/canonical-root-categories-v1";
import { categoryTree, ENTERPRISE_SECTORS } from "@/lib/categories/enterprise";

describe("ROVEXO Catalog Master v1.0 — Absolute Law XXX", () => {
  it("passes catalog validation", () => {
    const report = validateCatalogMaster();
    expect(report.ok, report.errors.join("; ")).toBe(true);
  });

  it("is the ONLY sector SSOT for the marketplace tree", () => {
    expect(ENTERPRISE_SECTORS).toBe(CATALOG_SECTORS);
    expect(categoryTree.map((n) => n.slug)).toEqual(
      CANONICAL_ROOT_CATEGORIES.map((r) => r.slug),
    );
  });

  it("has exactly ten courier-safe roots", () => {
    expect(CATALOG_SECTORS).toHaveLength(10);
    expect(CATALOG_MASTER_V1.rootCount).toBe(10);
    expect(CATALOG_MASTER_V1.courierOnly).toBe(true);
    expect(CATALOG_MASTER_V1.vehiclePartsOwnRoot).toBe(true);
    for (const forbidden of CATALOG_MASTER_V1.forbiddenRoots) {
      expect(CATALOG_SECTORS.some((s) => s.slug === forbidden)).toBe(false);
    }
  });

  it("keeps Vehicle Parts as its own root — never under Electronics", () => {
    const vehicleParts = CATALOG_SECTORS.find((s) => s.slug === "vehicle-parts");
    const electronics = CATALOG_SECTORS.find((s) => s.slug === "electronics");
    expect(vehicleParts).toBeDefined();
    expect(vehicleParts?.name).toBe("Vehicle Parts & Accessories");
    expect(electronics?.departments.some((d) => d.slug === "vehicle-parts")).toBe(
      false,
    );
    expect(vehicleParts?.departments.map((d) => d.slug)).toEqual([
      "car-parts",
      "motorcycle-parts",
      "bicycle-parts",
      "vehicle-accessories",
      "car-care",
      "garage-tools",
      "tyres-and-wheels",
    ]);
  });

  it("always includes No Brand and a compact colour set", () => {
    expect(CATALOG_BRANDS).toContain(CATALOG_NO_BRAND);
    expect(CATALOG_COLOURS.length).toBeGreaterThanOrEqual(12);
    expect(CATALOG_COLOURS.length).toBeLessThanOrEqual(24);
  });

  it("keeps product-type attributes within 3–6", () => {
    for (const sector of CATALOG_SECTORS) {
      for (const dept of sector.departments) {
        for (const [, slug] of dept.items ?? []) {
          const attrs = resolveProductTypeAttributes(slug);
          expect(attrs.length).toBeGreaterThanOrEqual(3);
          expect(attrs.length).toBeLessThanOrEqual(6);
          expect(getBrandsForProductType(slug)).toContain(CATALOG_NO_BRAND);
        }
      }
    }
  });

  it("exposes Vehicle Parts essential attributes", () => {
    const attrs = resolveProductTypeAttributes("engine-parts");
    expect(attrs.map((a) => a.label)).toEqual([
      "Brand",
      "Vehicle Make",
      "Vehicle Model",
      "Condition",
    ]);
  });
});
