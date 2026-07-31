import { describe, expect, it } from "vitest";
import { catalogPathRequiresSize } from "@/lib/sell/catalog-size-visibility-v1";
import { getQuickSellAttributeDefs } from "@/lib/sell/attribute-engine";
import type { FlatCategoryPath } from "@/lib/categories/types";

function path(partial: Partial<FlatCategoryPath> & { categorySlug: string }): FlatCategoryPath {
  return {
    categorySlug: partial.categorySlug,
    subcategorySlug: partial.subcategorySlug ?? "",
    childCategorySlug: partial.childCategorySlug,
    pathLabel: partial.pathLabel ?? "x",
    segments: partial.segments ?? [
      { slug: partial.categorySlug, name: partial.categorySlug },
      ...(partial.subcategorySlug
        ? [{ slug: partial.subcategorySlug, name: partial.subcategorySlug }]
        : []),
      ...(partial.childCategorySlug
        ? [{ slug: partial.childCategorySlug, name: partial.childCategorySlug }]
        : []),
    ],
  };
}

describe("catalog-size-visibility-v1", () => {
  it("shows Size for clothing, shoes, rings", () => {
    expect(
      catalogPathRequiresSize(
        path({
          categorySlug: "womens-fashion",
          subcategorySlug: "clothing",
          childCategorySlug: "dresses",
        }),
      ),
    ).toBe(true);
    expect(
      catalogPathRequiresSize(
        path({
          categorySlug: "mens-fashion",
          subcategorySlug: "shoes",
          childCategorySlug: "trainers",
        }),
      ),
    ).toBe(true);
    expect(
      catalogPathRequiresSize(
        path({
          categorySlug: "jewellery",
          subcategorySlug: "rings",
          childCategorySlug: "rings",
        }),
      ),
    ).toBe(true);
  });

  it("hides Size for electronics, furniture, camping, books, toys", () => {
    expect(
      catalogPathRequiresSize(
        path({
          categorySlug: "electronics",
          subcategorySlug: "phones",
          childCategorySlug: "android-phones",
        }),
      ),
    ).toBe(false);
    expect(
      catalogPathRequiresSize(
        path({
          categorySlug: "home-garden",
          subcategorySlug: "furniture",
          childCategorySlug: "tables",
        }),
      ),
    ).toBe(false);
    expect(
      catalogPathRequiresSize(
        path({
          categorySlug: "sports-outdoors",
          subcategorySlug: "camping",
          childCategorySlug: "sleeping-bags",
        }),
      ),
    ).toBe(false);
    expect(
      catalogPathRequiresSize(
        path({
          categorySlug: "books-media",
          subcategorySlug: "books",
          childCategorySlug: "fiction",
        }),
      ),
    ).toBe(false);
    expect(
      catalogPathRequiresSize(
        path({
          categorySlug: "hobbies-collectables",
          subcategorySlug: "toys",
          childCategorySlug: "dolls",
        }),
      ),
    ).toBe(false);
  });

  it("getQuickSellAttributeDefs respects Catalog Master Size gate", () => {
    const dress = getQuickSellAttributeDefs(
      path({
        categorySlug: "womens-fashion",
        subcategorySlug: "clothing",
        childCategorySlug: "dresses",
      }),
    );
    expect(dress.some((def) => def.id === "size")).toBe(true);

    const phone = getQuickSellAttributeDefs(
      path({
        categorySlug: "electronics",
        subcategorySlug: "phones",
        childCategorySlug: "android-phones",
      }),
    );
    expect(phone.some((def) => def.id === "size")).toBe(false);
  });
});
