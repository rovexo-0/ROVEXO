import { describe, expect, it } from "vitest";
import {
  CANONICAL_ROOT_CATEGORIES,
  CANONICAL_ROOT_CATEGORY_COUNT,
  FORBIDDEN_ROOT_CATEGORY_SLUGS,
  LEGACY_SECTOR_TO_CANONICAL_ROOT,
  aggregateCountsByCanonicalRoot,
  isForbiddenRootCategorySlug,
  resolveCanonicalRootSlug,
} from "@/lib/categories/canonical-root-categories-v1";
import { ROVEXO_HOME_CATEGORY_RAIL } from "@/lib/home/category-premium-library";
import { HOME_CATEGORY_NAV } from "@/lib/home/constants";
import { ROVEXO_HOMEPAGE_CATEGORIES } from "@/components/home/constants";
import { SUPREME_BLOOD_CODE_XXVIII_V1 } from "@/lib/supreme-blood-code-xxviii-v1";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("Blood XXVIII + Law XXX — Canonical Root Categories", () => {
  it("locks exactly ten Owner roots in fixed Catalog Master order", () => {
    expect(CANONICAL_ROOT_CATEGORY_COUNT).toBe(10);
    expect(CANONICAL_ROOT_CATEGORIES).toHaveLength(10);
    expect(CANONICAL_ROOT_CATEGORIES.map((r) => r.name)).toEqual([
      "Women's Fashion",
      "Men's Fashion",
      "Designer",
      "Kids & Baby",
      "Home & Garden",
      "Electronics",
      "Books & Media",
      "Hobbies & Collectables",
      "Sports & Outdoors",
      "Vehicle Parts & Accessories",
    ]);
    expect(SUPREME_BLOOD_CODE_XXVIII_V1.freezeLocked).toBe(true);
    expect(SUPREME_BLOOD_CODE_XXVIII_V1.rootCount).toBe(10);
  });

  it("forbids Vehicles, Property, Business as roots", () => {
    expect(FORBIDDEN_ROOT_CATEGORY_SLUGS).toEqual(["vehicles", "property", "business"]);
    for (const slug of FORBIDDEN_ROOT_CATEGORY_SLUGS) {
      expect(isForbiddenRootCategorySlug(slug)).toBe(true);
      expect(CANONICAL_ROOT_CATEGORIES.some((r) => r.slug === slug)).toBe(false);
    }
  });

  it("keeps Homepage + Search rails aligned to the ten", () => {
    expect(ROVEXO_HOME_CATEGORY_RAIL).toHaveLength(10);
    expect(HOME_CATEGORY_NAV).toHaveLength(10);
    expect(ROVEXO_HOMEPAGE_CATEGORIES).toHaveLength(10);
    expect(HOME_CATEGORY_NAV.map((i) => i.name)).toEqual(
      CANONICAL_ROOT_CATEGORIES.map((r) => r.name),
    );
    expect(ROVEXO_HOME_CATEGORY_RAIL.some((i) => i.slug === "vehicles")).toBe(false);
    expect(ROVEXO_HOME_CATEGORY_RAIL.some((i) => i.slug === "property")).toBe(false);
    expect(ROVEXO_HOME_CATEGORY_RAIL.some((i) => i.slug === "business")).toBe(false);
    expect(ROVEXO_HOME_CATEGORY_RAIL.some((i) => i.slug === "vehicle-parts")).toBe(true);
  });

  it("maps every legacy sector including removed roots (no orphans in map)", () => {
    expect(resolveCanonicalRootSlug("vehicles")).toBe("vehicle-parts");
    expect(resolveCanonicalRootSlug("property")).toBe("home-garden");
    expect(resolveCanonicalRootSlug("business")).toBe("collectibles");
    expect(resolveCanonicalRootSlug("womens-fashion")).toBe("womens-fashion");
    expect(resolveCanonicalRootSlug("vehicle-parts")).toBe("vehicle-parts");
    expect(Object.keys(LEGACY_SECTOR_TO_CANONICAL_ROOT).length).toBeGreaterThan(30);
  });

  it("aggregates listing counts onto canonical roots", () => {
    const totals = aggregateCountsByCanonicalRoot([
      { slug: "vehicles", itemCount: 5 },
      { slug: "gaming", itemCount: 3 },
      { slug: "electronics", itemCount: 2 },
      { slug: "phones", itemCount: 4 },
    ]);
    expect(totals["vehicle-parts"]).toBe(5);
    expect(totals.electronics).toBe(9);
  });

  it("keeps Search landing + categories index on canonical rail", () => {
    const landing = readFileSync(
      path.join(process.cwd(), "features/search/components/SearchLandingView.tsx"),
      "utf8",
    );
    const categoriesPage = readFileSync(
      path.join(process.cwd(), "app/categories/page.tsx"),
      "utf8",
    );
    expect(landing).toContain("ROVEXO_HOME_CATEGORY_RAIL");
    expect(categoriesPage).toContain("CANONICAL_ROOT_CATEGORIES");
    expect(categoriesPage).not.toContain("getCategoryTree");
  });
});
