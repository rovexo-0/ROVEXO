import { describe, expect, it } from "vitest";
import {
  AUTO_SELECT_CONFIDENCE,
  detectCategoryFromTitle,
  shouldAutoSelectCategory,
} from "@/lib/sell/category-detection-pro";
import { resolveTitleCategoryPath } from "@/lib/sell/title-category-rules";

/** STEP 7 — release verification titles (title-only, ≥90% auto-select). */
const STEP7_CASES = [
  {
    title: "Apple Magic Mouse",
    path: ["computers", "computer-accessories", "mice"] as const,
  },
  {
    title: "Apple AirPods Pro",
    path: ["electronics", "audio", "earbuds"] as const,
  },
  {
    title: "iPhone 17 Pro Max",
    path: ["phones", "smartphones", "unlocked-phones"] as const,
  },
  {
    title: "Samsung Galaxy S25 Ultra",
    path: ["phones", "smartphones", "unlocked-phones"] as const,
  },
  {
    title: "MacBook Pro M4",
    path: ["computers", "laptops", "macbooks"] as const,
  },
  {
    title: "PlayStation 5",
    path: ["gaming", "consoles", "playstation"] as const,
  },
  {
    title: "PS5 Slim",
    path: ["gaming", "consoles", "playstation"] as const,
  },
  {
    title: "Xbox Series X",
    path: ["gaming", "consoles", "xbox"] as const,
  },
  {
    title: "Nike Air Max",
    path: ["shoes", "trainers", "nike"] as const,
  },
  {
    title: "Adidas Ultraboost",
    path: ["shoes", "trainers", "adidas"] as const,
  },
  {
    title: "BMW F30 Front Bumper",
    path: ["car-parts", "body-parts", "bumpers"] as const,
  },
  {
    title: "Audi A4 Alloy Wheels",
    path: ["car-parts", "wheels-tyres", "alloy-wheels"] as const,
  },
  {
    title: "Leather Sofa",
    path: ["home-garden", "furniture", "sofas"] as const,
  },
  {
    title: "Dining Table Oak",
    path: ["home-garden", "furniture", "tables"] as const,
  },
  {
    title: "Mountain Bike",
    path: ["cycling", "bikes", "mountain-bikes"] as const,
  },
  {
    title: "Baby Stroller",
    path: ["baby", "pushchairs", "prams"] as const,
  },
  {
    title: "Office Chair",
    path: ["office", "office-furniture", "office-chairs"] as const,
  },
  {
    title: "Gaming Monitor",
    path: ["computers", "computer-accessories", "monitors"] as const,
  },
  {
    title: "Canon EOS R6",
    path: ["electronics", "cameras", "mirrorless"] as const,
  },
  {
    title: "DJI Mini 4 Pro",
    path: ["electronics", "cameras", "drones"] as const,
  },
] as const;

describe("STEP 7 — AI category detection verification titles", () => {
  it("resolves every expected marketplace path", () => {
    for (const testCase of STEP7_CASES) {
      expect(resolveTitleCategoryPath([...testCase.path]), testCase.title).not.toBeNull();
    }
  });

  it.each(STEP7_CASES.map((c) => [c.title, c.path] as const))(
    "auto-selects %s",
    (title, expectedPath) => {
      const detection = detectCategoryFromTitle(title);
      expect(detection.top, title).not.toBeNull();
      expect(detection.tier, title).toBe("auto");
      expect(detection.top!.confidence, title).toBeGreaterThanOrEqual(AUTO_SELECT_CONFIDENCE);

      const auto = shouldAutoSelectCategory(detection.suggestions);
      expect(auto, title).not.toBeNull();
      expect(auto!.path.categorySlug, title).toBe(expectedPath[0]);
      expect(auto!.path.subcategorySlug, title).toBe(expectedPath[1]);
      expect(auto!.path.childCategorySlug, title).toBe(expectedPath[2]);
    },
  );

  it("completes all STEP 7 titles within 100ms", () => {
    for (const testCase of STEP7_CASES) {
      const start = performance.now();
      detectCategoryFromTitle(testCase.title);
      expect(performance.now() - start).toBeLessThan(100);
    }
  });
});
