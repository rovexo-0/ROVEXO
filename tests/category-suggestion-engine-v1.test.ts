import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveCategoryPathBySlugs } from "@/lib/categories/queries";
import {
  CATEGORY_SUGGESTION_ENGINE_V1,
  applyCategorySuggestion,
  resolveLiveCategorySuggestion,
  shouldAutoApplyCategorySuggestion,
  suggestCategory,
  suggestionConfidencePercent,
} from "@/lib/sell/category-suggestion-engine-v1";
import {
  CATEGORY_ENGINE_V1,
  assertSellCategoryPublishGate,
} from "@/lib/sell/category-engine-v1";
import { getCategoryHrefFromSlugs } from "@/lib/categories/navigation";
import { CANONICAL_ROOT_CATEGORIES } from "@/lib/categories/canonical-root-categories-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Category Suggestion Engine v1.0 — Catalog Master · rule-based", () => {
  it("locks deterministic contract (no AI / auto)", () => {
    expect(CATEGORY_SUGGESTION_ENGINE_V1.method).toBe("deterministic_rules");
    expect(CATEGORY_SUGGESTION_ENGINE_V1.forbidden).toContain("ai");
    expect(CATEGORY_SUGGESTION_ENGINE_V1.forbidden).toContain("auto_category");
    expect(CATEGORY_SUGGESTION_ENGINE_V1.forbidden).toContain("auto_select");
    expect(shouldAutoApplyCategorySuggestion()).toBe(false);
    expect(CATEGORY_ENGINE_V1.selection).toBe("manual_with_confirm_suggestion");
    expect(CATEGORY_ENGINE_V1.forbidden).toContain("auto_select_category");
    expect(CATEGORY_ENGINE_V1.forbidden).not.toContain("suggested_category");
  });

  it("Owner validation cases map to Catalog Master paths", () => {
    const cases = [
      {
        title: "Memory Foam Pillow",
        slugs: ["home-garden", "bedding", "pillows"] as const,
        label: "Home & Garden > Bedding > Pillows",
      },
      {
        title: "Nike Air Max",
        slugs: ["mens-fashion", "shoes", "trainers"] as const,
        label: "Men's Fashion > Shoes > Trainers",
      },
      {
        title: "iPhone 16 Pro",
        slugs: ["electronics", "phones-tablets", "smartphones"] as const,
        label: "Electronics > Phones & Tablets > Smartphones",
      },
      {
        title: "Camping Sleeping Bag",
        slugs: ["sports", "camping", "sleeping-bags"] as const,
        label: "Sports & Outdoors > Camping > Sleeping Bags",
      },
    ] as const;

    for (const testCase of cases) {
      const suggestion = suggestCategory(testCase.title);
      expect(suggestion, testCase.title).not.toBeNull();
      expect(suggestion!.path.segments.map((s) => s.slug), testCase.title).toEqual([
        ...testCase.slugs,
      ]);
      expect(suggestion!.path.pathLabel, testCase.title).toBe(testCase.label);
      expect(suggestionConfidencePercent(suggestion!), testCase.title).toBeGreaterThanOrEqual(80);
    }
  });

  it("never auto-overwrites a manual category — only Better suggestion available", () => {
    const manual = resolveCategoryPathBySlugs([
      "jewellery",
      "fine-jewellery",
      "watches",
    ]);
    expect(manual).not.toBeNull();

    const live = resolveLiveCategorySuggestion({
      title: "Memory Foam Pillow",
      manualPath: manual,
    });

    expect(live.suggestion).not.toBeNull();
    expect(live.suggestion!.path.childCategorySlug).toBe("pillows");
    expect(live.betterSuggestionAvailable).toBe(true);
    expect(toSamePath(live.suggestion!.path, manual!)).toBe(false);
  });

  it("Apply Suggestion returns Category → Subcategory → Product Type only", () => {
    const suggestion = suggestCategory("iPhone 16 Pro");
    expect(suggestion).not.toBeNull();
    const applied = applyCategorySuggestion(suggestion!);
    expect(applied.segments).toHaveLength(3);
    expect(applied.categorySlug).toBe("electronics");
    expect(applied.subcategorySlug).toBe("phones-tablets");
    expect(applied.childCategorySlug).toBe("smartphones");
  });

  it("Homepage / Browse mapping uses published category slugs only", () => {
    const path = resolveCategoryPathBySlugs(["home-garden", "bedding", "pillows"]);
    expect(path).not.toBeNull();
    const root = CANONICAL_ROOT_CATEGORIES.find((entry) => entry.slug === path!.categorySlug);
    expect(root?.name).toBe("Home & Garden");
    const href = getCategoryHrefFromSlugs(path!.segments.map((s) => s.slug));
    expect(href).toContain("/category/");
    expect(href).toContain("home-garden");
    expect(href).toContain("bedding");
    expect(href).toContain("pillows");
  });

  it("prohibited validation still fails closed before publish", () => {
    const path = resolveCategoryPathBySlugs(["electronics", "phones-tablets", "smartphones"]);
    const gate = assertSellCategoryPublishGate({
      categoryPath: path,
      title: "Illegal handgun for sale",
      description: "Brand new firearm pistol ready to ship",
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.code).toBe("PROHIBITED_ITEM");
  });

  it("Sell UI wires confirm-only suggestion above Category picker", () => {
    const block = readSource("features/sell/ui/SellCategoryBlock.tsx");
    const card = readSource("features/sell/ui/SellCategorySuggestion.tsx");
    expect(block).toContain("resolveLiveCategorySuggestion");
    expect(block).toContain("SellCategorySuggestionCard");
    expect(block).toContain("applyCategorySuggestion");
    expect(block).not.toContain("shouldAutoSelectCategory(");
    expect(card).toContain("Suggested Category");
    expect(card).toContain("Better suggestion available");
    expect(card).toContain("Apply Suggestion");
  });

  it("publish reset remains in SellProvider", () => {
    const provider = readSource("features/sell/context/SellProvider.tsx");
    expect(provider).toContain("createNewListingSession");
    expect(provider).toContain("window.scrollTo(0, 0)");
  });
});

function toSamePath(
  a: { segments: Array<{ slug: string }> },
  b: { segments: Array<{ slug: string }> },
): boolean {
  return a.segments.map((s) => s.slug).join("/") === b.segments.map((s) => s.slug).join("/");
}
