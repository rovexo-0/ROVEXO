import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createEmptyDraft } from "@/features/sell/types";
import { resolveCategoryPathBySlugs } from "@/lib/categories/queries";
import { createListingSchema } from "@/lib/sell/listing-api-schema";
import { buildListingPublishPayload } from "@/lib/sell/build-listing-publish-payload";
import { searchCategoryPicker } from "@/lib/sell/category-picker-search";
import { getSellValidationErrorForField, isSellListingPublishable } from "@/lib/sell/sell-validation";
import {
  resolveTitleOnlyCategoryDecision,
  suggestCategory,
} from "@/lib/sell/category-suggestion-engine-v1";

const PILLOW_SLUGS = ["home-garden", "bedding", "pillows"] as const;
const DESCRIPTION_CUSHION = "memory foam cushion donut";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function slugsOf(path: { segments: Array<{ slug: string }> }): string[] {
  return path.segments.map((segment) => segment.slug);
}

describe("Web Sell Native category parity v1 — title-only", () => {
  it("TEST 1 — title pillow → Home & Garden → Bedding → Pillows", () => {
    const suggestion = suggestCategory("pillow");
    expect(suggestion).not.toBeNull();
    expect(slugsOf(suggestion!.path)).toEqual([...PILLOW_SLUGS]);
    expect(suggestion!.labels).toEqual(["Home & Garden", "Bedding", "Pillows"]);

    const decision = resolveTitleOnlyCategoryDecision({
      title: "pillow",
      currentPath: null,
      categoryManual: false,
    });
    expect(decision.action).toBe("apply-leaf");
    if (decision.action === "apply-leaf") {
      expect(slugsOf(decision.path)).toEqual([...PILLOW_SLUGS]);
    }
  });

  it("TEST 2 — description is ignored after title pillow", () => {
    const fromTitle = suggestCategory("pillow");
    const withDescription = suggestCategory("pillow", DESCRIPTION_CUSHION);
    expect(fromTitle).not.toBeNull();
    expect(withDescription).not.toBeNull();
    expect(slugsOf(fromTitle!.path)).toEqual([...PILLOW_SLUGS]);
    expect(slugsOf(withDescription!.path)).toEqual(slugsOf(fromTitle!.path));

    const afterTitle = resolveTitleOnlyCategoryDecision({
      title: "pillow",
      currentPath: fromTitle!.path,
      categoryManual: false,
    });
    expect(afterTitle.action).toBe("apply-leaf");
    if (afterTitle.action === "apply-leaf") {
      expect(slugsOf(afterTitle.path)).toEqual([...PILLOW_SLUGS]);
    }

    const engineSource = readSource("lib/sell/category-suggestion-engine-v1.ts");
    expect(engineSource).not.toContain("${title} ${description}");
    expect(engineSource).toContain("void _description");

    const block = readSource("features/sell/ui/SellCategoryBlock.tsx");
    expect(block).not.toContain("deferredDescription");
    expect(block).toContain("resolveTitleOnlyCategoryDecision");
    expect(block).not.toContain("description: deferredDescription");
  });

  it("TEST 3 — manual category survives any description", () => {
    const manual = resolveCategoryPathBySlugs([
      "electronics",
      "phones-tablets",
      "iphones",
    ]);
    expect(manual).not.toBeNull();

    const decision = resolveTitleOnlyCategoryDecision({
      title: "pillow",
      currentPath: manual,
      categoryManual: true,
    });
    expect(decision.action).toBe("keep");
    expect(decision.suggestion).toBeNull();
    expect(slugsOf(manual!)).toEqual(["electronics", "phones-tablets", "iphones"]);
  });

  it("TEST 4 — Native contract: manual lock survives later title edits", () => {
    const manual = resolveCategoryPathBySlugs([
      "electronics",
      "phones-tablets",
      "iphones",
    ]);
    expect(manual).not.toBeNull();

    const afterTitle = resolveTitleOnlyCategoryDecision({
      title: "pillow",
      currentPath: manual,
      categoryManual: true,
    });
    expect(afterTitle.action).toBe("keep");
    expect(slugsOf(manual!)).toEqual(["electronics", "phones-tablets", "iphones"]);

    const unlocked = resolveTitleOnlyCategoryDecision({
      title: "pillow",
      currentPath: manual,
      categoryManual: false,
    });
    expect(unlocked.action).toBe("apply-leaf");
    if (unlocked.action === "apply-leaf") {
      expect(slugsOf(unlocked.path)).toEqual([...PILLOW_SLUGS]);
    }
  });

  it("TEST 5 — Web UI must not contain Apply Suggestion", () => {
    const card = readSource("features/sell/ui/SellCategorySuggestion.tsx");
    const block = readSource("features/sell/ui/SellCategoryBlock.tsx");
    expect(card).not.toContain("Apply Suggestion");
    expect(block).not.toContain("Apply Suggestion");
    expect(block).not.toContain("onApply");
  });

  it("TEST 6 — Web UI must not display Confidence %", () => {
    const card = readSource("features/sell/ui/SellCategorySuggestion.tsx");
    const block = readSource("features/sell/ui/SellCategoryBlock.tsx");
    expect(card).not.toMatch(/Confidence\s*%/);
    expect(card).not.toMatch(/\bConfidence\b/);
    expect(card).not.toContain("suggestionConfidencePercent");
    expect(block).not.toContain("suggestionConfidencePercent");
  });

  it("TEST 7 — category browse/search still works", () => {
    const picker = readSource("features/sell/ui/SellCategoryPicker.tsx");
    expect(picker).toContain("Search categories");
    expect(picker).toContain("searchCategoryPicker");
    expect(picker).toContain("CATEGORY_ENGINE_V1");

    const results = searchCategoryPicker("pillow");
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.some((result) => slugsOf(result.path).join("/") === PILLOW_SLUGS.join("/")),
    ).toBe(true);
  });

  it("TEST 8 — category payload remains correct on Publish", () => {
    const suggestion = suggestCategory("pillow");
    expect(suggestion).not.toBeNull();

    const draft = createEmptyDraft();
    draft.title = "pillow";
    draft.description = DESCRIPTION_CUSHION;
    draft.categoryPath = suggestion!.path;
    draft.condition = "Good";
    draft.price = "12.00";
    draft.parcelSize = "medium";
    draft.stock = 1;

    const missingCategory = createEmptyDraft();
    missingCategory.title = "pillow";
    missingCategory.description = DESCRIPTION_CUSHION;
    missingCategory.price = "12.00";
    missingCategory.parcelSize = "medium";
    missingCategory.photos = [
      {
        id: "1",
        previewUrl: "https://example.com/a.jpg",
        url: "https://example.com/a.jpg",
        storagePath: "seller/temp/a.jpg",
        uploaded: true,
      },
    ];
    expect(
      getSellValidationErrorForField(
        missingCategory,
        { title: missingCategory.title, description: missingCategory.description },
        "category",
      ),
    ).toBeTruthy();
    expect(
      isSellListingPublishable(missingCategory, {
        title: missingCategory.title,
        description: missingCategory.description,
      }),
    ).toBe(false);

    draft.photos = missingCategory.photos;
    const payload = buildListingPublishPayload(draft, draft.photos);
    expect(payload.categoryPath?.categorySlugs).toEqual([...PILLOW_SLUGS]);
    expect(payload.categoryPath?.categorySlug).toBe("home-garden");
    expect(payload.categoryPath?.subcategorySlug).toBe("bedding");
    expect(payload.categoryPath?.childCategorySlug).toBe("pillows");

    const parsed = createListingSchema.parse(payload);
    expect(parsed.categoryPath?.categorySlugs ?? [
      parsed.categoryPath?.categorySlug,
      parsed.categoryPath?.subcategorySlug,
      parsed.categoryPath?.childCategorySlug,
    ]).toEqual([...PILLOW_SLUGS]);
  });

  it("does not introduce AI / parallel category engines", () => {
    const engine = readSource("lib/sell/category-suggestion-engine-v1.ts");
    expect(engine).not.toContain("openai");
    expect(engine).not.toContain("CategoryEngineV2");
    expect(engine).not.toContain("CategorySuggestionEngineV2");
    expect(() => readSource("lib/sell/category-suggestion-engine-v2.ts")).toThrow();
    expect(() => readSource("lib/sell/category-engine-v2.ts")).toThrow();
  });
});
