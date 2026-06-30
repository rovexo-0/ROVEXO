import { accessSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ROVEXO_CATEGORY_PREMIUM_KEYS,
  ROVEXO_HOME_CATEGORY_RAIL,
  resolveCategoryPremiumIcon,
} from "@/lib/home/category-premium-library";
import { HOME_CATEGORY_NAV } from "@/lib/home/constants";

describe("ROVEXO premium category asset library", () => {
  it("keeps homepage nav aligned with the canonical premium library", () => {
    expect(HOME_CATEGORY_NAV).toHaveLength(ROVEXO_HOME_CATEGORY_RAIL.length);
    expect(HOME_CATEGORY_NAV.map((item) => item.icon)).toEqual(
      ROVEXO_HOME_CATEGORY_RAIL.map((item) => item.icon),
    );
  });

  it("ships every premium PNG asset on disk", () => {
    const root = path.join(process.cwd(), "public/categories");

    for (const icon of ROVEXO_CATEGORY_PREMIUM_KEYS) {
      const assetPath = path.join(root, `${icon}.png`);
      expect(() => accessSync(assetPath)).not.toThrow();
    }
  });

  it("renders categories with PNG-only CategoryPremiumIcon", () => {
    const iconSource = readFileSync(
      path.join(process.cwd(), "components/category/CategoryPremiumIcon.tsx"),
      "utf8",
    );
    const homeSource = readFileSync(
      path.join(process.cwd(), "components/home/HomeCategoryIconImage.tsx"),
      "utf8",
    );
    const cardSource = readFileSync(
      path.join(process.cwd(), "components/premium/CategoryCard.tsx"),
      "utf8",
    );

    expect(iconSource).toContain("getCategoryPremiumPngSrc");
    expect(iconSource).not.toContain("<svg");
    expect(homeSource).toContain("CategoryPremiumIcon");
    expect(cardSource).toContain("CategoryPremiumIcon");
    expect(cardSource).toContain("containerSize={60}");
    expect(cardSource).toContain("size={40}");
  });

  it("resolves marketplace slugs to premium PNG keys", () => {
    expect(resolveCategoryPremiumIcon("motorcycles")).toBe("vehicles");
    expect(resolveCategoryPremiumIcon("music")).toBe("electronics");
    expect(resolveCategoryPremiumIcon("food")).toBe("handmade");
    expect(resolveCategoryPremiumIcon("jobs")).toBe("business");
    expect(resolveCategoryPremiumIcon("travel")).toBe("export");
    expect(resolveCategoryPremiumIcon("baby")).toBe("kids");
    expect(resolveCategoryPremiumIcon("industrial")).toBe("tools");
    expect(resolveCategoryPremiumIcon("agriculture")).toBe("home-garden");
  });

  it("lists every enterprise category object on the homepage rail", () => {
    const names = ROVEXO_HOME_CATEGORY_RAIL.map((item) => item.name);
    expect(names).toContain("Motorcycles");
    expect(names).toContain("Travel");
    expect(names).toContain("Agriculture");
    expect(ROVEXO_HOME_CATEGORY_RAIL.length).toBeGreaterThanOrEqual(30);
  });
});
