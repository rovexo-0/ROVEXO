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
import { SUGGEST_SSOT_HARDENING_V1 } from "@/lib/catalog/suggest-ssot-hardening-v1";
import {
  assertRuntimeCatalogFingerprintOrBlock,
  getCatalogEnvironmentParityReport,
  getRuntimeCatalogIndex,
  resetRuntimeCatalogIndexForTests,
} from "@/lib/catalog/runtime-catalog-index-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Category Suggestion Engine v1.0 — Catalog Master SSOT", () => {
  it("locks deterministic Catalog Master contract (no AI / auto / keyword patches)", () => {
    expect(CATEGORY_SUGGESTION_ENGINE_V1.method).toBe("deterministic_catalog_master_index");
    expect(CATEGORY_SUGGESTION_ENGINE_V1.ssot).toBe("lib/catalog/tree.ts");
    expect(CATEGORY_SUGGESTION_ENGINE_V1.ownerConfidenceThreshold).toBe(
      SUGGEST_SSOT_HARDENING_V1.ownerConfidenceThreshold,
    );
    expect(CATEGORY_SUGGESTION_ENGINE_V1.forbidden).toContain("ai");
    expect(CATEGORY_SUGGESTION_ENGINE_V1.forbidden).toContain("keyword_patches");
    expect(CATEGORY_SUGGESTION_ENGINE_V1.forbidden).toContain("fuzzy_ai_matching");
    expect(CATEGORY_SUGGESTION_ENGINE_V1.forbidden).toContain("auto_category");
    expect(shouldAutoApplyCategorySuggestion()).toBe(false);
    expect(CATEGORY_ENGINE_V1.selection).toBe("title_only_leaf_apply_manual_lock");
  });

  it("ONE runtime Catalog Master index · Localhost ≡ Preview ≡ Production lock", () => {
    resetRuntimeCatalogIndexForTests();
    const a = getRuntimeCatalogIndex();
    const b = getRuntimeCatalogIndex();
    expect(a).toBe(b);
    expect(a.source).toBe("catalog-master");
    expect(a.ssot).toBe("lib/catalog/tree.ts");
    expect(a.fingerprint.leafCount).toBe(960);
    expect(a.fingerprint.nodeCount).toBe(1044);
    expect(a.leaves).toHaveLength(960);
    expect(a.phraseIndex.size).toBeGreaterThan(0);
    expect(a.synonymIndex.size).toBeGreaterThan(0);
    expect(assertRuntimeCatalogFingerprintOrBlock(a)).toBe(a);
    const parity = getCatalogEnvironmentParityReport(a);
    expect(parity.pass).toBe(true);
    expect(parity.environments.localhost.treeHash).toBe(parity.environments.preview.treeHash);
    expect(parity.environments.preview.treeHash).toBe(parity.environments.production.treeHash);
  });

  it("Owner determinism titles map to Catalog Master paths", () => {
    const cases = [
      {
        title: "Sleeping bag",
        slugs: ["sports", "camping", "sleeping-bags"] as const,
      },
      {
        title: "Camping sleeping bag",
        slugs: ["sports", "camping", "sleeping-bags"] as const,
      },
      {
        title: "Travel pillow",
        slugs: ["home-garden", "pillows-cushions", "travel-pillows"] as const,
      },
      {
        title: "Pregnancy pillow",
        slugs: ["home-garden", "pillows-cushions", "pregnancy-pillows"] as const,
      },
      {
        title: "Memory foam pillow",
        slugs: ["home-garden", "pillows-cushions", "memory-foam-pillows"] as const,
      },
      {
        title: "iPhone 16 Pro",
        slugs: ["electronics", "phones-tablets", "iphones"] as const,
      },
      {
        title: "Camping Tent",
        slugs: ["sports", "camping", "camping-tents"] as const,
      },
    ] as const;

    for (const testCase of cases) {
      const suggestion = suggestCategory(testCase.title);
      expect(suggestion, testCase.title).not.toBeNull();
      expect(suggestion!.path.segments.map((s) => s.slug), testCase.title).toEqual([
        ...testCase.slugs,
      ]);
      expect(suggestion!.confidence, testCase.title).toBeGreaterThanOrEqual(
        SUGGEST_SSOT_HARDENING_V1.ownerConfidenceThreshold,
      );
      expect(suggestionConfidencePercent(suggestion!), testCase.title).toBeGreaterThanOrEqual(95);
    }
  });

  it("Suggest Safety Law — typos never guess (fail closed)", () => {
    for (const title of [
      "slepping bag",
      "travell pillow",
      "memry foam pillow",
      "iphne 16",
      "addidas shoes",
    ] as const) {
      expect(suggestCategory(title), title).toBeNull();
    }
  });

  it("normalizes jacket titles to Catalog Master Leather Jackets", () => {
    for (const title of [
      "jacket",
      "jackets",
      "leather jacket",
      "leather jackets",
      "women leather jacket",
      "women's leather jacket",
    ] as const) {
      const suggestion = suggestCategory(title);
      expect(suggestion, title).not.toBeNull();
      expect(suggestion!.path.segments.map((s) => s.slug), title).toEqual([
        "womens-fashion",
        "jackets",
        "leather-jackets",
      ]);
    }
    expect(suggestCategory("summer leather jacket")!.path.childCategorySlug).toBe("leather-jackets");
    expect(suggestCategory("summer jacket")).toBeNull();
  });

  it("Sleeping Bag never maps to Women's Fashion Bags", () => {
    for (const title of ["Sleeping bag", "sleeping-bag", "Camping Sleeping Bag"] as const) {
      const suggestion = suggestCategory(title);
      expect(suggestion, title).not.toBeNull();
      const slugs = suggestion!.path.segments.map((s) => s.slug);
      expect(slugs[0], title).toBe("sports");
      expect(slugs[1], title).toBe("camping");
      expect(slugs[2], title).toBe("sleeping-bags");
      expect(slugs.join("/"), title).not.toMatch(/womens-fashion|mens-fashion|\/bags\//);
    }
  });

  it("never auto-overwrites a manual category — Native lock", () => {
    const manual = resolveCategoryPathBySlugs([
      "jewellery",
      "fine-jewellery",
      "watches",
    ]);
    expect(manual).not.toBeNull();

    const live = resolveLiveCategorySuggestion({
      title: "Memory Foam Pillow",
      description: "memory foam cushion donut",
      manualPath: manual,
    });

    expect(live.suggestion).toBeNull();
    expect(live.betterSuggestionAvailable).toBe(false);
  });

  it("applyCategorySuggestion returns Category → Subcategory → Product Type only", () => {
    const suggestion = suggestCategory("iPhone 16 Pro");
    expect(suggestion).not.toBeNull();
    const applied = applyCategorySuggestion(suggestion!);
    expect(applied.segments).toHaveLength(3);
    expect(applied.categorySlug).toBe("electronics");
    expect(applied.subcategorySlug).toBe("phones-tablets");
    expect(applied.childCategorySlug).toBe("iphones");
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

  it("resolves Catalog Master phone leaves", () => {
    const path = resolveCategoryPathBySlugs(["electronics", "phones-tablets", "iphones"]);
    expect(path?.pathLabel).toBe("Electronics > Phones & Tablets > iPhones");
  });

  it("prohibited validation still fails closed before publish", () => {
    const path = resolveCategoryPathBySlugs(["electronics", "phones-tablets", "android-phones"]);
    const gate = assertSellCategoryPublishGate({
      categoryPath: path,
      title: "Illegal handgun for sale",
      description: "Brand new firearm pistol ready to ship",
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.code).toBe("PROHIBITED_ITEM");
  });

  it("Sell UI wires title-only Native category contract above Category picker", () => {
    const block = readSource("features/sell/ui/SellCategoryBlock.tsx");
    const card = readSource("features/sell/ui/SellCategorySuggestion.tsx");
    expect(block).toContain("resolveTitleOnlyCategoryDecision");
    expect(block).toContain("SellCategorySuggestionCard");
    expect(block).not.toContain("deferredDescription");
    expect(block).not.toContain("shouldAutoSelectCategory(");
    expect(card).toContain("Suggested Category");
    expect(card).toContain("Browse manually");
    expect(card).not.toContain("Better suggestion available");
    expect(card).not.toContain("Apply Suggestion");
    expect(card).not.toMatch(/\bConfidence\b/);
    expect(card).not.toContain("suggestionConfidencePercent");
  });

  it("Suggest engine consumes runtime Catalog Master indexes only", () => {
    const source = readSource("lib/sell/category-suggestion-engine-v1.ts");
    expect(source).toContain("getRuntimeCatalogIndex");
    expect(source).toContain("phraseIndex");
    expect(source).toContain("synonymIndex");
    expect(source).not.toContain("CATEGORY_KEYWORD_MAP");
    expect(source).not.toContain("PRODUCT_TYPE_DATABASE");
    expect(source).not.toContain("CATALOG_PHRASE_RULES");
    expect(source).not.toContain("TITLE_CATEGORY_RULES");
    expect(readSource("instrumentation.ts")).toContain("assertRuntimeCatalogIndexOrBlock");
  });

  it("publish reset remains in SellProvider", () => {
    const provider = readSource("features/sell/context/SellProvider.tsx");
    expect(provider).toContain("createNewListingSession");
    expect(provider).toContain("window.scrollTo(0, 0)");
  });
});
