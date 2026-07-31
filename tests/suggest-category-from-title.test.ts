import { describe, expect, it } from "vitest";
import {
  AUTO_SELECT_CONFIDENCE,
  SUGGEST_CONFIDENCE_MIN,
  detectCategoryFromTitle,
  getCategoryDetectionTier,
  shouldAutoSelectCategory,
} from "@/lib/sell/category-detection-pro";
import {
  hashTitleForLearning,
  suggestCategoryFromTitle,
} from "@/lib/sell/suggest-category-from-title";
import { resolveTitleCategoryPath } from "@/lib/sell/title-category-rules";

describe("title-only category detection", () => {
  it("resolves core marketplace paths used by title rules", () => {
    // Legacy title-engine paths remain resolvable via Catalog Master aliases.
    expect(resolveTitleCategoryPath(["computers", "computer-accessories", "mice"])).not.toBeNull();
    expect(resolveTitleCategoryPath(["tools", "power-tools", "drills"])).not.toBeNull();
    expect(resolveTitleCategoryPath(["home-garden", "furniture", "tables"])).not.toBeNull();
    expect(resolveTitleCategoryPath(["phones", "smartphones", "unlocked-phones"])).not.toBeNull();
    expect(resolveTitleCategoryPath(["car-parts", "wheels-tyres", "alloy-wheels"])).not.toBeNull();
  });

  it("returns empty suggestions for short titles", () => {
    expect(suggestCategoryFromTitle("ab")).toEqual([]);
    expect(suggestCategoryFromTitle("abcd")).toEqual([]);
    expect(suggestCategoryFromTitle("  ")).toEqual([]);
  });

  it("uses v1.0 confidence tiers", () => {
    expect(getCategoryDetectionTier(0.95)).toBe("auto");
    expect(getCategoryDetectionTier(0.94)).toBe("suggest");
    expect(getCategoryDetectionTier(0.8)).toBe("suggest");
    expect(getCategoryDetectionTier(0.79)).toBe("possible");
    expect(getCategoryDetectionTier(0.5)).toBe("possible");
    expect(getCategoryDetectionTier(0.49)).toBe("none");
    expect(AUTO_SELECT_CONFIDENCE).toBe(0.95);
    expect(SUGGEST_CONFIDENCE_MIN).toBe(0.8);
  });

  it("never auto-selects — seller must Apply Suggestion", () => {
    const auto = shouldAutoSelectCategory(suggestCategoryFromTitle("iPhone 15 Pro Max 256GB"));
    expect(auto).toBeNull();
    const top = detectCategoryFromTitle("iPhone 15 Pro Max 256GB").top;
    expect(top).not.toBeNull();
    expect(top!.path.categorySlug).toBe("electronics");
    expect(top!.path.subcategorySlug).toBe("phones-tablets");
  });

  it("confidently classifies an unambiguous book title", () => {
    // A title dominated by book tokens resolves to Books at suggest confidence.
    const detection = detectCategoryFromTitle("Used paperback novel crime fiction");
    expect(detection.top).not.toBeNull();
    expect(detection.top!.path.categorySlug).toBe("books");
    expect(detection.top!.confidence).toBeGreaterThanOrEqual(SUGGEST_CONFIDENCE_MIN);
    expect(["suggest", "auto"]).toContain(getCategoryDetectionTier(detection.top!.confidence));
  });

  it("maps release example titles to expected categories", () => {
    const cases = [
      { title: "iPhone 15 Pro Max", categorySlug: "electronics", childSlug: "smartphones" },
      { title: "Samsung Galaxy S25 Ultra", categorySlug: "electronics", childSlug: "smartphones" },
      { title: "Apple Magic Mouse", categorySlug: "electronics", childSlug: "mice" },
      { title: "MacBook Pro M4", categorySlug: "electronics", childSlug: "laptops" },
      { title: "Nike Air Max 270", categorySlug: "mens-fashion", childSlug: "trainers" },
      { title: "PlayStation 5 Console", categorySlug: "electronics", childSlug: "consoles" },
      // "PS5" alone is below MIN_TITLE_LENGTH (5); use a full title.
      { title: "PS5 Console", categorySlug: "electronics", childSlug: "consoles" },
      { title: "BMW F30 Front Bumper", categorySlug: "vehicle-parts", childSlug: "body-panels" },
      { title: "Sofa Grey Leather", categorySlug: "home-garden", childSlug: "sofas-and-armchairs" },
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
    expect(suggestCategoryFromTitle("ifone 15 pro max")[0]?.path.categorySlug).toBe("electronics");
    expect(suggestCategoryFromTitle("ps5 console")[0]?.path.categorySlug).toBe("electronics");
    expect(suggestCategoryFromTitle("macbok air m2")[0]?.path.categorySlug).toBe("electronics");
  });

  it("handles multilingual title tokens", () => {
    expect(suggestCategoryFromTitle("téléphone samsung galaxy")[0]?.path.categorySlug).toBe(
      "electronics",
    );
    expect(suggestCategoryFromTitle("chaussures nike air max")[0]?.path.categorySlug).toBe(
      "mens-fashion",
    );
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

    // Warm Catalog Master leaf index once (cold build is outside the hot path budget).
    detectCategoryFromTitle("Warm up Catalog Master index");

    for (const title of samples) {
      const start = performance.now();
      detectCategoryFromTitle(title);
      expect(performance.now() - start).toBeLessThan(100);
    }
  });
});

describe("title category batch accuracy", () => {
  // Expected roots are Catalog Master production roots (Law XXX).
  const batch = [
    ["Samsung Galaxy S24 Ultra", "electronics"],
    ["DeWalt XR Combi Drill", "home-garden"],
    ["Adidas Ultraboost Running Shoes", "mens-fashion"],
    ["Audi Alloy Wheels 18 inch", "vehicle-parts"],
    ["Apple MacBook Air M2", "electronics"],
    ["PlayStation 5 Console", "electronics"],
    ["Dyson Cordless Vacuum", "home-garden"],
    ["Chesterfield Fabric Sofa", "home-garden"],
    ["Lego Technic Supercar", "kids-fashion"],
    ["OLED Smart TV 55 inch", "electronics"],
    ["Continental Winter Tyres 225/45", "vehicle-parts"],
  ] as const;

  it.each(batch)("classifies %s under %s", (title, expectedCategory) => {
    const detection = detectCategoryFromTitle(title);
    expect(detection.top?.path.categorySlug).toBe(expectedCategory);
    expect(detection.top?.confidence ?? 0).toBeGreaterThanOrEqual(SUGGEST_CONFIDENCE_MIN);
  });
});
