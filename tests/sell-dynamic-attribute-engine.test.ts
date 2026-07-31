import { describe, expect, it } from "vitest";
import { flatPathFromSegments } from "@/lib/categories/types";
import { resolveAaQuickSellAttributeIds } from "@/lib/sell/aa-quick-sell-attributes";
import { getQuickSellAttributeDefs } from "@/lib/sell/attribute-engine";
import { buildSellProgressiveSteps } from "@/lib/sell/sell-progressive-flow";
import { createEmptyDraft } from "@/features/sell/types";
import { SELL_QUICK_CONDITIONS } from "@/lib/sell/sell-condition-options";

describe("canonical dynamic sell attribute engine", () => {
  it("phones: Catalog Master Brand → Model → Storage → Colour → Condition", () => {
    const path = flatPathFromSegments([
      { id: "electronics", slug: "electronics", name: "Electronics" },
      { id: "phones", slug: "phones-tablets", name: "Phones & Tablets" },
      { id: "android-phones", slug: "android-phones", name: "Android Phones" },
    ]);
    const defs = getQuickSellAttributeDefs(path);
    expect(defs.map((d) => d.id)).toEqual(["brand", "model", "storage", "colour", "condition"]);
    expect(defs.find((d) => d.id === "material")).toBeUndefined();
    expect(defs.find((d) => d.id === "size")).toBeUndefined();
  });

  it("shoes: Catalog Master Brand → Size → Colour → Condition", () => {
    const path = flatPathFromSegments([
      { id: "mens", slug: "mens-fashion", name: "Men's Fashion" },
      { id: "shoes", slug: "shoes", name: "Shoes" },
      { id: "trainers", slug: "trainers", name: "Trainers" },
    ]);
    const defs = getQuickSellAttributeDefs(path);
    expect(defs.map((d) => d.id)).toEqual(["brand", "size", "colour", "condition"]);
    expect(defs.find((d) => d.id === "size")).toBeDefined();
  });

  it("camping sleeping bags: Brand → Temperature → Season → Length → Weight → Condition", () => {
    const path = flatPathFromSegments([
      { id: "sports", slug: "sports", name: "Sports & Outdoors" },
      { id: "camping", slug: "camping", name: "Camping" },
      { id: "sleeping-bags", slug: "sleeping-bags", name: "Sleeping Bags" },
    ]);
    expect(getQuickSellAttributeDefs(path).map((d) => d.id)).toEqual([
      "brand",
      "temperatureRating",
      "seasonRating",
      "length",
      "weight",
      "condition",
    ]);
    expect(getQuickSellAttributeDefs(path).find((d) => d.id === "size")).toBeUndefined();
  });

  it("car parts: Compatibility → Brand → Condition → Colour (no Material)", () => {
    const path = flatPathFromSegments([
      { id: "autoparts", slug: "autoparts", name: "Car Parts" },
      { id: "brakes", slug: "brakes", name: "Brakes" },
    ]);
    expect(resolveAaQuickSellAttributeIds(path)).toEqual([
      "compatibility",
      "brand",
      "condition",
      "colour",
    ]);
    expect(resolveAaQuickSellAttributeIds(path)).not.toContain("material");
  });

  it("progressive steps follow Catalog Master attribute order", () => {
    const draft = {
      ...createEmptyDraft(),
      categoryPath: flatPathFromSegments([
        { id: "electronics", slug: "electronics", name: "Electronics" },
        { id: "phones", slug: "phones-tablets", name: "Phones & Tablets" },
        { id: "android-phones", slug: "android-phones", name: "Android Phones" },
      ]),
    };
    expect(buildSellProgressiveSteps(draft).map((s) => s.id)).toEqual([
      "photos",
      "title",
      "description",
      "category",
      "attribute:brand",
      "attribute:model",
      "attribute:storage",
      "attribute:colour",
      "condition",
      "price",
      "parcel",
    ]);
  });

  it("exposes Owner condition list", () => {
    expect(SELL_QUICK_CONDITIONS).toEqual([
      "New with tags",
      "New",
      "Like New",
      "Excellent",
      "Very Good",
      "Good",
      "Fair",
    ]);
  });
});
