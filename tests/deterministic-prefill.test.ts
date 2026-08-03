import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/features/sell/types";
import {
  applyDeterministicPrefill,
  buildDeterministicPrefill,
  suggestBrandFromText,
  suggestColourFromTitle,
  suggestConditionFromText,
} from "@/lib/sell/deterministic-prefill";

describe("deterministic sell prefill — COD SÂNGE manual attributes", () => {
  it("never auto-writes brand, material, colour, condition, or storage into the draft", () => {
    const draft = createEmptyDraft();
    draft.title = "Apple iPhone 15 Pro Max 256GB Unlocked Like New";
    const patch = buildDeterministicPrefill(draft);
    expect(patch).toEqual({});
  });

  it("never auto-writes memory foam material from pillow titles", () => {
    const draft = createEmptyDraft();
    draft.title = "Tempur memory foam pillow excellent condition";
    expect(buildDeterministicPrefill(draft)).toEqual({});
  });

  it("keeps heuristics available as picker suggestions only", () => {
    expect(suggestBrandFromText("Apple iPhone 15")).toBe("Apple");
    expect(suggestColourFromTitle("Black travel pillow")).toBe("Black");
    expect(suggestConditionFromText("Like New")).toBe("Like New");
  });

  it("applyDeterministicPrefill still respects non-empty user values when given a patch", () => {
    const draft = createEmptyDraft();
    draft.brand = "Sony";
    const merged = applyDeterministicPrefill(draft, { brand: "Apple" });
    expect(merged.brand).toBeUndefined();
  });
});
