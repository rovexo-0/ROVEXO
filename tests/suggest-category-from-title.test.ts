import { describe, expect, it } from "vitest";
import {
  AUTO_SELECT_CONFIDENCE,
  SUGGEST_CONFIDENCE_MIN,
  detectCategoryFromTitle,
  getCategoryDetectionTier,
  hashTitleForLearning,
  shouldAutoSelectCategory,
  suggestCategoryFromTitle,
} from "@/lib/sell/suggest-category-from-title";
import { resolveTitleCategoryPath } from "@/lib/sell/title-category-rules";

describe("title-only category detection", () => {
  it("resolves core marketplace paths used by title rules", () => {
    expect(resolveTitleCategoryPath(["computers", "computer-accessories", "mice"])).not.toBeNull();
    expect(resolveTitleCategoryPath(["tools", "power-tools", "drills"])).not.toBeNull();
    expect(resolveTitleCategoryPath(["home-garden", "furniture", "tables"])).not.toBeNull();
  });

  it("returns empty suggestions for short titles", () => {
    expect(suggestCategoryFromTitle("ab")).toEqual([]);
    expect(suggestCategoryFromTitle("  ")).toEqual([]);
  });

  it("uses v1.0 confidence tiers", () => {
    expect(getCategoryDetectionTier(0.95)).toBe("auto");
    expect(getCategoryDetectionTier(0.9)).toBe("auto");
    expect(getCategoryDetectionTier(0.89)).toBe("suggest");
    expect(getCategoryDetectionTier(0.7)).toBe("suggest");
    expect(getCategoryDetectionTier(0.69)).toBe("none");
  });

  it("auto-selects at 90% confidence or higher", () => {
    const auto = shouldAutoSelectCategory(suggestCategoryFromTitle("iPhone 15 Pro Max 256GB"));
    expect(auto).not.toBeNull();
    expect(auto!.confidence).toBeGreaterThanOrEqual(AUTO_SELECT_CONFIDENCE);
    expect(auto!.path.categorySlug).toBe("phones");
  });

  it("suggests without auto-select between 70% and 89%", () => {
    const detection = detectCategoryFromTitle("Used paperback novel crime fiction");
    if (!detection.top) return;
    expect(detection.top.confidence).toBeGreaterThanOrEqual(SUGGEST_CONFIDENCE_MIN);
    expect(detection.top.confidence).toBeLessThan(AUTO_SELECT_CONFIDENCE);
    expect(detection.tier).toBe("suggest");
    expect(shouldAutoSelectCategory(detection.suggestions)).toBeNull();
  });

  it("maps release example titles to expected categories", () => {
    const cases = [
      { title: "iPhone 15 Pro Max", categorySlug: "phones" },
      { title: "Samsung Galaxy S25 Ultra", categorySlug: "phones" },
      { title: "Apple Magic Mouse", categorySlug: "computers", childSlug: "mice" },
      { title: "MacBook Pro M4", categorySlug: "computers" },
      { title: "Nike Air Max 270", categorySlug: "shoes" },
      { title: "PlayStation 5 Console", categorySlug: "gaming" },
      { title: "PS5", categorySlug: "gaming" },
      { title: "BMW F30 Front Bumper", categorySlug: "car-parts", childSlug: "bumpers" },
      { title: "Sofa Grey Leather", categorySlug: "home-garden", childSlug: "sofas" },
      { title: "Dining Table Oak", categorySlug: "home-garden", childSlug: "tables" },
    ] as const;

    for (const testCase of cases) {
      const detection = detectCategoryFromTitle(testCase.title);
      expect(detection.top, testCase.title).not.toBeNull();
      expect(detection.top!.path.categorySlug, testCase.title).toBe(testCase.categorySlug);
      if ("childSlug" in testCase && testCase.childSlug) {
        expect(detection.top!.path.childCategorySlug, testCase.title).toBe(testCase.childSlug);
      }
      expect(detection.top!.confidence, testCase.title).toBeGreaterThanOrEqual(SUGGEST_CONFIDENCE_MIN);
    }
  });

  it("handles misspellings and abbreviations", () => {
    expect(suggestCategoryFromTitle("ifone 15 pro max")[0]?.path.categorySlug).toBe("phones");
    expect(suggestCategoryFromTitle("ps5 console")[0]?.path.categorySlug).toBe("gaming");
    expect(suggestCategoryFromTitle("macbok air m2")[0]?.path.categorySlug).toBe("computers");
  });

  it("handles multilingual title tokens", () => {
    expect(suggestCategoryFromTitle("téléphone samsung galaxy")[0]?.path.categorySlug).toBe("phones");
    expect(suggestCategoryFromTitle("chaussures nike air max")[0]?.path.categorySlug).toBe("shoes");
  });

  it("produces stable anonymous title hashes for learning", () => {
    const first = hashTitleForLearning("Nike Air Max");
    const second = hashTitleForLearning("nike air max");
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{8}$/);
  });

  it("completes detection within the 100ms target", () => {
    const samples = [
      "iPhone 15 Pro Max",
      "Apple Magic Mouse",
      "Bosch Drill",
      "Nike Air Max 270",
      "BMW F30 Front Bumper",
      "Dining Table Oak",
      "PlayStation 5",
      "Samsung Galaxy S25",
    ];

    for (const title of samples) {
      const start = performance.now();
      detectCategoryFromTitle(title);
      expect(performance.now() - start).toBeLessThan(100);
    }
  });
});

describe("title category batch accuracy", () => {
  const batch = [
    ["Samsung Galaxy S24 Ultra", "phones"],
    ["DeWalt XR Combi Drill", "tools"],
    ["Adidas Ultraboost Running Shoes", "shoes"],
    ["Audi Alloy Wheels 18 inch", "car-parts"],
    ["Apple MacBook Air M2", "computers"],
    ["PlayStation 5 Console", "gaming"],
    ["Dyson Cordless Vacuum", "appliances"],
    ["Chesterfield Fabric Sofa", "home-garden"],
    ["Lego Technic Supercar", "toys"],
    ["OLED Smart TV 55 inch", "electronics"],
    ["Continental Winter Tyres 225/45", "car-parts"],
  ] as const;

  it.each(batch)("classifies %s under %s", (title, expectedCategory) => {
    const detection = detectCategoryFromTitle(title);
    expect(detection.top?.path.categorySlug).toBe(expectedCategory);
    expect(detection.top?.confidence ?? 0).toBeGreaterThanOrEqual(SUGGEST_CONFIDENCE_MIN);
  });
});
