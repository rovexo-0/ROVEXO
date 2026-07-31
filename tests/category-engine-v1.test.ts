import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveCategoryPathBySlugs } from "@/lib/categories/queries";
import { categoryTree } from "@/lib/categories/tree";
import {
  CATEGORY_ENGINE_V1,
  assertSellCategoryPublishGate,
  validateManualCategoryPath,
  validateManualCategorySlugs,
} from "@/lib/sell/category-engine-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Category Engine v1.0 — manual only · Catalog Master · fail closed", () => {
  it("locks confirm-only suggestion contract (no AI / auto-select)", () => {
    expect(CATEGORY_ENGINE_V1.selection).toBe("manual_with_confirm_suggestion");
    expect(CATEGORY_ENGINE_V1.depth).toBe(3);
    expect(CATEGORY_ENGINE_V1.forbidden).toContain("ai_category");
    expect(CATEGORY_ENGINE_V1.forbidden).toContain("auto_select_category");
    expect(CATEGORY_ENGINE_V1.forbidden).toContain("auto_description");
    expect(CATEGORY_ENGINE_V1.forbidden).not.toContain("suggested_category");
  });

  it("Catalog Master leaves are exactly depth 3", () => {
    const depths = new Set<number>();
    const walk = (nodes: typeof categoryTree, depth: number) => {
      for (const node of nodes) {
        if (!node.children?.length) depths.add(depth);
        else walk(node.children, depth + 1);
      }
    };
    walk(categoryTree, 1);
    expect([...depths]).toEqual([3]);
  });

  it("accepts a valid Catalog Master path", () => {
    const path = resolveCategoryPathBySlugs(["home-garden", "bedding", "pillows"]);
    expect(path).not.toBeNull();
    expect(validateManualCategoryPath(path)).toEqual({ ok: true });
  });

  it("rejects incomplete / unknown taxonomy", () => {
    expect(validateManualCategorySlugs(["home-garden"]).ok).toBe(false);
    expect(validateManualCategorySlugs(["home-garden", "bedding"]).ok).toBe(false);
    expect(validateManualCategorySlugs(["nope", "nope", "nope"]).ok).toBe(false);
    expect(validateManualCategoryPath(null).ok).toBe(false);
  });

  it("Sell UI wires confirm-only suggestion; picker stays manual; no auto-select", () => {
    const picker = readSource("features/sell/ui/SellCategoryPicker.tsx");
    const block = readSource("features/sell/ui/SellCategoryBlock.tsx");
    const provider = readSource("features/sell/context/SellProvider.tsx");

    expect(picker).not.toContain("suggestCategoryFromTitle");
    expect(picker).not.toContain("detectCategoryFromTitle");
    expect(block).toContain("resolveLiveCategorySuggestion");
    expect(block).toContain("shouldAutoApplyCategorySuggestion");
    expect(block).not.toContain("shouldAutoSelectCategory(");
    expect(provider).not.toContain("buildSmartDescription");
    expect(provider).not.toContain("canStartSmartDescriptionEngine");
  });

  it("prohibited content fails closed before publish", () => {
    const path = resolveCategoryPathBySlugs(["electronics", "phones-tablets", "android-phones"]);
    expect(path).not.toBeNull();
    const gate = assertSellCategoryPublishGate({
      categoryPath: path,
      title: "Illegal handgun for sale",
      description: "Brand new firearm pistol ready to ship",
    });
    expect(gate.ok).toBe(false);
    if (!gate.ok) expect(gate.code).toBe("PROHIBITED_ITEM");
  });

  it("SellProvider resets draft after successful publish", () => {
    const provider = readSource("features/sell/context/SellProvider.tsx");
    expect(provider).toContain("createNewListingSession");
    expect(provider).toContain("publishSuccessRef.current = true");
    expect(provider).toContain("window.scrollTo(0, 0)");
  });
});
