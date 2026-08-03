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

/**
 * Title suggestion SSOT = Catalog Master leaf-phrase engine
 * (`category-suggestion-engine-v1` + SUGGEST_SSOT_HARDENING_V1).
 * Brand/typo/multilingual keyword packs are intentionally fail-closed.
 * Fixtures use leaf-capable Catalog Master phrases only.
 */
describe("title-only category detection", () => {
  it("resolves core marketplace paths used by title rules", () => {
    expect(resolveTitleCategoryPath(["computers", "computer-accessories", "mice"])).not.toBeNull();
    expect(resolveTitleCategoryPath(["tools", "power-tools", "drills"])).not.toBeNull();
    expect(resolveTitleCategoryPath(["home-garden", "furniture", "tables"])).not.toBeNull();
    expect(resolveTitleCategoryPath(["phones", "smartphones", "unlocked-phones"])).not.toBeNull();
    expect(resolveTitleCategoryPath(["car-parts", "wheels-tyres", "alloy-wheels"])).not.toBeNull();
  });

  it("returns empty suggestions for short titles", () => {
    expect(suggestCategoryFromTitle("ab")).toEqual([]);
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

  it("confidently classifies an unambiguous book leaf phrase", () => {
    const detection = detectCategoryFromTitle("Crime Thriller");
    expect(detection.top).not.toBeNull();
    expect(detection.top!.path.categorySlug).toBe("books");
    expect(detection.top!.confidence).toBeGreaterThanOrEqual(SUGGEST_CONFIDENCE_MIN);
    expect(["suggest", "auto"]).toContain(getCategoryDetectionTier(detection.top!.confidence));
  });

  it("maps Catalog Master leaf-capable titles to expected categories", () => {
    const cases = [
      { title: "iPhone 15 Pro Max", categorySlug: "electronics", childSlug: "iphones" },
      { title: "iPhone 15 Pro Max 256GB", categorySlug: "electronics", childSlug: "iphones" },
      { title: "Gaming Mice", categorySlug: "electronics", childSlug: "gaming-mice" },
      { title: "PlayStation Console", categorySlug: "electronics", childSlug: "playstation-consoles" },
      { title: "PS5 Console", categorySlug: "electronics" },
      { title: "Trainers", categorySlug: "womens-fashion", childSlug: "trainers" },
      { title: "Dining Table Oak", categorySlug: "home-garden" },
      { title: "Sleeping bag", categorySlug: "sports", childSlug: "sleeping-bags" },
      { title: "Travel pillow", categorySlug: "home-garden" },
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

  it("fail-closed on typos (Suggest Safety Law — never guess)", () => {
    expect(suggestCategoryFromTitle("ifone 15 pro max")).toEqual([]);
    expect(suggestCategoryFromTitle("macbok air m2")).toEqual([]);
    expect(suggestCategoryFromTitle("slepping bag")).toEqual([]);
  });

  it("fail-closed on brand + short-leaf titles (no keyword packs)", () => {
    expect(suggestCategoryFromTitle("Apple Magic Mouse")).toEqual([]);
    expect(suggestCategoryFromTitle("Nike Air Max Trainers")).toEqual([]);
    expect(suggestCategoryFromTitle("Crime Fiction")).toEqual([]);
  });

  it("accepts certified abbreviations that expand via Catalog Master synonyms", () => {
    expect(suggestCategoryFromTitle("ps5 console")[0]?.path.categorySlug).toBe("electronics");
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
      "Gaming Mice",
      "Trainers",
      "Dining Table Oak",
      "PlayStation Console",
      "Sleeping bag",
    ];

    detectCategoryFromTitle("Warm up Catalog Master index");

    for (const title of samples) {
      const start = performance.now();
      detectCategoryFromTitle(title);
      expect(performance.now() - start).toBeLessThan(100);
    }
  });
});

describe("title category batch accuracy", () => {
  // Leaf-capable titles only — Catalog Master SSOT (no brand keyword packs).
  const batch = [
    ["iPhone 15 Pro Max 256GB", "electronics"],
    ["PlayStation Console", "electronics"],
    ["Trainers", "womens-fashion"],
    ["Dining Table Oak", "home-garden"],
    ["Travel pillow", "home-garden"],
    ["Sleeping bag", "sports"],
    ["Crime Thriller", "books"],
    ["Alloy Wheels", "vehicle-parts"],
    ["Vacuum Cleaners", "home-garden"],
    ["Building Sets", "kids-fashion"],
  ] as const;

  it.each(batch)("classifies %s under %s", (title, expectedCategory) => {
    const detection = detectCategoryFromTitle(title);
    expect(detection.top?.path.categorySlug).toBe(expectedCategory);
    expect(detection.top?.confidence ?? 0).toBeGreaterThanOrEqual(SUGGEST_CONFIDENCE_MIN);
  });
});
