import { describe, expect, it } from "vitest";
import {
  SIZE_ENGINE_CLOTHING_ROWS,
  SIZE_ENGINE_FOOTWEAR_ROWS,
  SIZE_ENGINE_V1,
  buildStandardSelection,
  encodeSizeForStorage,
  formatSizeForViewItem,
  parseStoredSize,
  resolveSizeEngineKind,
  selectionFromCustom,
  validateCustomSizeInput,
} from "@/lib/size";
import type { FlatCategoryPath } from "@/lib/categories/types";

function path(input: {
  categorySlug: string;
  subcategorySlug: string;
  subcategoryName?: string;
  childSlug?: string;
  childName?: string;
}): FlatCategoryPath {
  const segments = [
    { id: "c1", slug: input.categorySlug, name: input.categorySlug },
    { id: "c2", slug: input.subcategorySlug, name: input.subcategoryName ?? input.subcategorySlug },
  ];
  if (input.childSlug) {
    segments.push({
      id: "c3",
      slug: input.childSlug,
      name: input.childName ?? input.childSlug,
    });
  }
  return {
    categoryId: "c1",
    categoryName: input.categorySlug,
    categorySlug: input.categorySlug,
    subcategoryId: "c2",
    subcategoryName: input.subcategoryName ?? input.subcategorySlug,
    subcategorySlug: input.subcategorySlug,
    childCategoryId: input.childSlug ? "c3" : undefined,
    childCategoryName: input.childName,
    childCategorySlug: input.childSlug,
    segments,
    pathLabel: segments.map((s) => s.name).join(" > "),
  };
}

describe("Size Engine v1.0", () => {
  it("exposes Owner clothing and footwear rows", () => {
    expect(SIZE_ENGINE_CLOTHING_ROWS.map((r) => r.id)).toEqual([
      "XXS",
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL",
      "XXXL",
    ]);
    expect(SIZE_ENGINE_FOOTWEAR_ROWS[0]?.id).toBe("UK 3");
    expect(SIZE_ENGINE_FOOTWEAR_ROWS.at(-1)?.id).toBe("UK 15");
    expect(SIZE_ENGINE_FOOTWEAR_ROWS.find((r) => r.id === "UK 5")?.secondary).toBe("UK 5 • EU 38");
    expect(SIZE_ENGINE_CLOTHING_ROWS.find((r) => r.id === "S")?.secondary).toBe("UK 6 • EU 34");
  });

  it("validates custom size", () => {
    expect(validateCustomSizeInput("").ok).toBe(false);
    expect(validateCustomSizeInput("   ").ok).toBe(false);
    expect(validateCustomSizeInput("x".repeat(51)).ok).toBe(false);
    const ok = validateCustomSizeInput("  46 Tall  ");
    expect(ok).toEqual({ ok: true, value: "46 Tall" });
    expect(validateCustomSizeInput("サイズ").ok).toBe(true);
  });

  it("encodes / parses standard clothing and footwear", () => {
    const clothing = buildStandardSelection("clothing", "XL");
    expect(clothing?.display).toBe("XL (UK 12 • EU 40)");
    expect(encodeSizeForStorage(clothing!)).toBe("XL (UK 12 • EU 40)");
    expect(parseStoredSize("XL (UK 12 • EU 40)")?.size_value).toBe("XL");
    expect(formatSizeForViewItem("XL (UK 12 • EU 40)")).toBe("XL (UK 12 • EU 40)");

    const footwear = buildStandardSelection("footwear", "UK 8");
    expect(footwear?.display).toBe("UK 8 (EU 41)");
    expect(formatSizeForViewItem(encodeSizeForStorage(footwear!))).toBe("UK 8 (EU 41)");
  });

  it("auto-return SSOT has no Continue gate", () => {
    expect(SIZE_ENGINE_V1.autoReturnMs).toBe(180);
    expect("continueLabel" in SIZE_ENGINE_V1).toBe(false);
  });

  it("encodes / edits / removes custom sizes", () => {
    const custom = selectionFromCustom("46 Tall");
    expect("error" in custom).toBe(false);
    if ("error" in custom) return;
    expect(encodeSizeForStorage(custom)).toBe("custom:46 Tall");
    expect(formatSizeForViewItem("custom:46 Tall")).toBe("46 Tall");
    expect(parseStoredSize("custom:4XL")?.size_type).toBe("custom");
  });

  it("resolves kind from category without Clothing/Footwear toggle", () => {
    expect(
      resolveSizeEngineKind(
        path({
          categorySlug: "womens-fashion",
          subcategorySlug: "shoes",
          subcategoryName: "Shoes",
        }),
      ),
    ).toBe("footwear");
    expect(
      resolveSizeEngineKind(
        path({
          categorySlug: "mens-fashion",
          subcategorySlug: "shirts",
          subcategoryName: "Shirts",
        }),
      ),
    ).toBe("clothing");
  });

  it("keeps custom max length SSOT", () => {
    expect(SIZE_ENGINE_V1.customMaxLength).toBe(50);
    expect(SIZE_ENGINE_V1.title).toBe("Select size");
  });
});
