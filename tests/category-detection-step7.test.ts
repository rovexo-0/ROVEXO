import { describe, expect, it } from "vitest";
import {
  AUTO_SELECT_CONFIDENCE,
  detectCategoryFromTitle,
  getCategoryDetectionTier,
  POSSIBLE_MATCH_MIN,
  SUGGEST_CONFIDENCE_MIN,
} from "@/lib/sell/category-detection-pro";
import { resolveTitleCategoryPath } from "@/lib/sell/title-category-rules";

const STEP7_CASES = [
  { title: "Apple Magic Mouse", path: ["computers", "computer-accessories", "mice"] as const },
  { title: "Nike Air Max", path: ["shoes", "trainers", "nike"] as const },
  { title: "PlayStation 5", path: ["gaming", "consoles", "playstation"] as const },
] as const;

describe("category detection confidence bands", () => {
  it("uses spec thresholds", () => {
    expect(AUTO_SELECT_CONFIDENCE).toBe(0.95);
    expect(SUGGEST_CONFIDENCE_MIN).toBe(0.8);
    expect(POSSIBLE_MATCH_MIN).toBe(0.5);
    expect(getCategoryDetectionTier(0.96)).toBe("auto");
    expect(getCategoryDetectionTier(0.85)).toBe("suggest");
    expect(getCategoryDetectionTier(0.6)).toBe("possible");
    expect(getCategoryDetectionTier(0.4)).toBe("none");
  });

  it("returns at most one visible suggestion", () => {
    const detection = detectCategoryFromTitle("Nike Air Max");
    expect(detection.suggestions.length).toBeLessThanOrEqual(1);
  });
});

describe("STEP 7 — deterministic category detection", () => {
  it("resolves expected marketplace paths", () => {
    for (const testCase of STEP7_CASES) {
      expect(resolveTitleCategoryPath([...testCase.path]), testCase.title).not.toBeNull();
    }
  });

  it.each(STEP7_CASES.map((c) => [c.title, c.path] as const))(
    "detects %s with at least possible-match confidence",
    (title, expectedPath) => {
      const detection = detectCategoryFromTitle(title);
      expect(detection.top, title).not.toBeNull();
      expect(detection.top!.confidence, title).toBeGreaterThanOrEqual(POSSIBLE_MATCH_MIN);
      expect(detection.top!.path.categorySlug, title).toBe(expectedPath[0]);
      expect(detection.top!.path.subcategorySlug, title).toBe(expectedPath[1]);
      expect(detection.top!.path.childCategorySlug, title).toBe(expectedPath[2]);
    },
  );
});
