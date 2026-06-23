import { describe, expect, it } from "vitest";
import {
  shouldAutoSelectCategory,
  suggestCategoryFromTitle,
} from "@/lib/sell/suggest-category-from-title";

describe("suggestCategoryFromTitle", () => {
  it("returns empty suggestions for short titles", () => {
    expect(suggestCategoryFromTitle("ab")).toEqual([]);
    expect(suggestCategoryFromTitle("  ")).toEqual([]);
  });

  it("matches categories from listing title keywords", () => {
    const suggestions = suggestCategoryFromTitle("Maxi-Cosi car seat isofix");
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]?.path.categorySlug).toBeTruthy();
  });

  it("auto-selects only when confidence is high enough", () => {
    const suggestions = suggestCategoryFromTitle("Nike Air Max trainers UK 9");
    const auto = shouldAutoSelectCategory(suggestions);
    if (auto) {
      expect(auto.confidence).toBeGreaterThanOrEqual(0.65);
    }
  });
});
