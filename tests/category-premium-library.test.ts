import { accessSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ROVEXO_CATEGORY_PREMIUM_KEYS,
  ROVEXO_HOME_CATEGORY_RAIL,
} from "@/lib/home/category-premium-library";
import { HOME_CATEGORY_NAV } from "@/lib/home/constants";

describe("ROVEXO premium category asset library", () => {
  it("keeps homepage nav aligned with the canonical premium library", () => {
    expect(HOME_CATEGORY_NAV).toHaveLength(ROVEXO_HOME_CATEGORY_RAIL.length);
    expect(HOME_CATEGORY_NAV.map((item) => item.icon)).toEqual([...ROVEXO_CATEGORY_PREMIUM_KEYS]);
  });

  it("ships every premium WebP asset on disk", () => {
    const root = path.join(process.cwd(), "public/categories");

    for (const icon of ROVEXO_CATEGORY_PREMIUM_KEYS) {
      for (const ext of ["webp", "avif", "png"]) {
        const assetPath = path.join(root, `${icon}.${ext}`);
        expect(() => accessSync(assetPath)).not.toThrow();
      }
    }
  });

  it("renders homepage categories as text-only capsules", () => {
    const railSource = readFileSync(
      path.join(process.cwd(), "components/home/RovexoCategoryRail.tsx"),
      "utf8",
    );

    const cardSource = readFileSync(
      path.join(process.cwd(), "components/home/RovexoCategoryCard.tsx"),
      "utf8",
    );

    expect(cardSource).toContain("home-v1-category-capsule");
    expect(cardSource).not.toContain("<picture");
    expect(railSource).toContain("home-v1-category-track__set");
    expect(railSource).not.toContain("useInfiniteCarousel");
    expect(railSource).toContain('aria-label="Categories"');
  });
});
