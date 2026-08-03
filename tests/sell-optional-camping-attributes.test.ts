import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/features/sell/types";
import { flatPathFromSegments } from "@/lib/categories/types";
import {
  getQuickSellAttributeDefs,
  isAttributeRequiredForPublish,
  OPTIONAL_SELL_ATTRIBUTE_IDS,
} from "@/lib/sell/attribute-engine";
import {
  areRequiredAttributesComplete,
  isSellProgressiveStepComplete,
  buildSellProgressiveSteps,
} from "@/lib/sell/sell-progressive-flow";
import {
  getFirstSellValidationIssue,
  isSellListingPublishable,
} from "@/lib/sell/sell-validation";

const sleepingBagPath = flatPathFromSegments([
  { id: "sports", slug: "sports", name: "Sports & Outdoors" },
  { id: "camping", slug: "camping", name: "Outdoor & Camping" },
  { id: "sleeping-bags", slug: "sleeping-bags", name: "Sleeping Bags" },
]);

function sleepingBagDraft(
  overrides: Partial<ReturnType<typeof createEmptyDraft>> = {},
) {
  return {
    ...createEmptyDraft(),
    photos: [
      {
        id: "p1",
        previewUrl: "https://example.com/a.jpg",
        uploaded: true,
        uploading: false,
        file: null,
      },
    ],
    title: "Camping Sleeping Bag",
    description: "Warm sleeping bag for weekend camping trips.",
    categoryPath: sleepingBagPath,
    brand: "No Brand",
    condition: "Good",
    price: "35",
    parcelSize: "medium" as const,
    attributes: {},
    ...overrides,
  };
}

describe("Sell Publish — Temperature / Season / Length OPTIONAL", () => {
  it("marks Temperature, Season, Length as optional (never required)", () => {
    expect(OPTIONAL_SELL_ATTRIBUTE_IDS.has("temperatureRating")).toBe(true);
    expect(OPTIONAL_SELL_ATTRIBUTE_IDS.has("seasonRating")).toBe(true);
    expect(OPTIONAL_SELL_ATTRIBUTE_IDS.has("length")).toBe(true);

    const defs = getQuickSellAttributeDefs(sleepingBagPath);
    for (const id of ["temperatureRating", "seasonRating", "length"] as const) {
      const def = defs.find((d) => d.id === id);
      expect(def, id).toBeDefined();
      expect(isAttributeRequiredForPublish(def!), id).toBe(false);
    }
  });

  it("Publish SUCCEEDS when Temperature, Season, Length are empty", () => {
    const draft = sleepingBagDraft();
    expect(draft.attributes).toEqual({});
    expect(
      isSellListingPublishable(draft, {
        title: draft.title,
        description: draft.description,
      }),
    ).toBe(true);
    expect(
      getFirstSellValidationIssue(draft, {
        title: draft.title,
        description: draft.description,
      }),
    ).toBeNull();
    expect(areRequiredAttributesComplete(draft)).toBe(true);
  });

  it("progressive steps do not treat optional camping attrs as incomplete", () => {
    const draft = sleepingBagDraft();
    const steps = buildSellProgressiveSteps(draft);
    const input = { title: draft.title, description: draft.description };
    for (const id of ["temperatureRating", "seasonRating", "length"] as const) {
      const step = steps.find((s) => s.id === `attribute:${id}`);
      expect(step, id).toBeDefined();
      expect(isSellProgressiveStepComplete(step!, draft, input), id).toBe(true);
    }
  });

  it("Brand still blocks Publish when empty; Condition is optional (core-6)", () => {
    const noBrand = sleepingBagDraft({ brand: "" });
    expect(
      getFirstSellValidationIssue(noBrand, {
        title: noBrand.title,
        description: noBrand.description,
      })?.field,
    ).toBe("brand");

    const noCondition = sleepingBagDraft({ condition: "" });
    expect(
      getFirstSellValidationIssue(noCondition, {
        title: noCondition.title,
        description: noCondition.description,
      }),
    ).toBeNull();
  });
});
