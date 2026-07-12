import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/features/sell/types";
import {
  buildSellProgressiveSteps,
  getVisibleAttributeDefs,
  isSellProgressiveStepVisible,
} from "@/lib/sell/sell-progressive-flow";
import { flatPathFromSegments } from "@/lib/categories/types";

describe("sell progressive flow", () => {
  it("orders title before category and description", () => {
    const draft = createEmptyDraft();
    const steps = buildSellProgressiveSteps(draft);
    const input = { title: "", description: "" };

    expect(steps.map((step) => step.id)).toEqual(["photos", "title", "category", "description"]);
    expect(isSellProgressiveStepVisible({ id: "category", fieldId: "sell-field-category" }, steps, draft, input)).toBe(false);
    expect(isSellProgressiveStepVisible({ id: "description", fieldId: "sell-field-description" }, steps, draft, input)).toBe(false);
    expect(isSellProgressiveStepVisible({ id: "parcel", fieldId: "sell-field-parcel" }, steps, draft, input)).toBe(false);
    expect(getVisibleAttributeDefs(draft, input)).toEqual([]);
  });

  it("reveals category after title and description after category", () => {
    const draft = createEmptyDraft();
    const steps = buildSellProgressiveSteps(draft);
    const titled = { title: "Nike trainers", description: "" };

    expect(
      isSellProgressiveStepVisible({ id: "category", fieldId: "sell-field-category" }, steps, draft, titled),
    ).toBe(true);
    expect(
      isSellProgressiveStepVisible({ id: "description", fieldId: "sell-field-description" }, steps, draft, titled),
    ).toBe(false);

    draft.categoryPath = flatPathFromSegments([
      { id: "shoes", slug: "shoes", name: "Shoes" },
      { id: "trainers", slug: "trainers", name: "Trainers" },
    ]);

    expect(
      isSellProgressiveStepVisible({ id: "description", fieldId: "sell-field-description" }, steps, draft, titled),
    ).toBe(true);
  });

  it("reveals attributes after category without requiring photos", () => {
    const draft = {
      ...createEmptyDraft(),
      title: "Vitamin supplement",
      description: "Sealed supplement bottle for testing.",
      categoryPath: flatPathFromSegments([
        { id: "health", slug: "health", name: "Health" },
        { id: "wellness", slug: "wellness", name: "Wellness" },
      ]),
    };
    const input = { title: draft.title, description: draft.description };
    const visible = getVisibleAttributeDefs(draft, input);

    expect(visible.length).toBeGreaterThan(0);
    expect(visible[0]?.id).toBe("brand");
  });

  it("reveals the next attribute after the previous one is completed", () => {
    const draft = {
      ...createEmptyDraft(),
      photos: [{ id: "1", previewUrl: "/x.jpg", uploaded: true }],
      title: "Blue Nike hoodie",
      description: "Great condition hoodie for sale",
      categoryPath: flatPathFromSegments([
        { id: "mens-fashion", slug: "mens-fashion", name: "Men's Fashion" },
        { id: "tops", slug: "tops", name: "Tops" },
      ]),
      brand: "Nike",
    };
    const input = { title: draft.title, description: draft.description };
    const visible = getVisibleAttributeDefs(draft, input);

    expect(visible.map((def) => def.id)).toEqual(["brand", "colour"]);
  });
});
