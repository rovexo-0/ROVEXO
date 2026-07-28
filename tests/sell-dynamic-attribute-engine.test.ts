import { describe, expect, it } from "vitest";
import { flatPathFromSegments } from "@/lib/categories/types";
import { resolveAaQuickSellAttributeIds } from "@/lib/sell/aa-quick-sell-attributes";
import { getQuickSellAttributeDefs } from "@/lib/sell/attribute-engine";
import { buildSellProgressiveSteps } from "@/lib/sell/sell-progressive-flow";
import { createEmptyDraft } from "@/features/sell/types";
import { SELL_QUICK_CONDITIONS } from "@/lib/sell/sell-condition-options";

describe("canonical dynamic sell attribute engine", () => {
  it("phones: Condition → Colour → Storage → Network (no Material)", () => {
    const path = flatPathFromSegments([
      { id: "phones", slug: "phones", name: "Phones" },
      { id: "smartphones", slug: "smartphones", name: "Smartphones" },
    ]);
    expect(resolveAaQuickSellAttributeIds(path)).toEqual([
      "condition",
      "colour",
      "storage",
      "network",
    ]);
    const defs = getQuickSellAttributeDefs(path);
    expect(defs.map((d) => d.id)).toEqual(["condition", "colour", "storage", "network"]);
    expect(defs.find((d) => d.id === "material")).toBeUndefined();
    expect(defs.find((d) => d.id === "colour")?.label).toBe("Colours");
    expect(defs.find((d) => d.id === "colour")?.input).toBe("select-single");
    expect(defs.find((d) => d.id === "colour")?.showSwatch).toBe(true);
  });

  it("shoes: Brand → Condition → Size → Colour → Material (recommended)", () => {
    const path = flatPathFromSegments([
      { id: "shoes", slug: "shoes", name: "Shoes" },
      { id: "trainers", slug: "trainers", name: "Trainers" },
    ]);
    expect(resolveAaQuickSellAttributeIds(path)).toEqual([
      "brand",
      "condition",
      "size",
      "colour",
      "material",
    ]);
    expect(getQuickSellAttributeDefs(path).find((d) => d.id === "material")?.label).toBe(
      "Material (recommended)",
    );
  });

  it("camping sleeping bags: Brand → Condition → Colour → Material → Season Rating → Length", () => {
    const path = flatPathFromSegments([
      { id: "camping", slug: "camping", name: "Camping" },
      { id: "camping-sleeping", slug: "camping-sleeping", name: "Sleeping" },
      { id: "sleeping-bags", slug: "sleeping-bags", name: "Sleeping Bags" },
    ]);
    expect(resolveAaQuickSellAttributeIds(path)).toEqual([
      "brand",
      "condition",
      "colour",
      "material",
      "seasonRating",
      "length",
    ]);
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

  it("progressive steps follow taxonomy order with Condition as step id", () => {
    const draft = {
      ...createEmptyDraft(),
      categoryPath: flatPathFromSegments([
        { id: "phones", slug: "phones", name: "Phones" },
        { id: "smartphones", slug: "smartphones", name: "Smartphones" },
      ]),
    };
    expect(buildSellProgressiveSteps(draft).map((s) => s.id)).toEqual([
      "photos",
      "title",
      "description",
      "category",
      "condition",
      "attribute:colour",
      "attribute:storage",
      "attribute:network",
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
