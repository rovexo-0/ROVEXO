import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/features/sell/types";
import { flatPathFromSegments } from "@/lib/categories/types";
import { buildDeterministicPrefill } from "@/lib/sell/deterministic-prefill";
import { SELL_QUICK_CONDITIONS, isSellQuickCondition } from "@/lib/sell/sell-condition-options";
import {
  applyPrefillRespectingLocks,
  inferUserModifiedFromDraft,
  isFieldUserModified,
  markFieldsUserModified,
  shouldApplyPhotoColourSuggestion,
} from "@/lib/sell/suggestion-field-lock";
import { buildSmartDescription } from "@/lib/sell/smart-description-engine";

describe("smart suggestion engine", () => {
  it("locks fields after manual selection", () => {
    const locks = markFieldsUserModified({}, ["brand", "colour"]);
    expect(isFieldUserModified(locks, "brand")).toBe(true);
    expect(isFieldUserModified(locks, "colour")).toBe(true);
    expect(isFieldUserModified(locks, "size")).toBe(false);
  });

  it("never overwrites user-modified brand or colour during prefill", () => {
    const draft = createEmptyDraft();
    draft.title = "Nike trainers silver";
    draft.userModified = markFieldsUserModified({}, ["brand", "colour"]);
    draft.brand = "Adidas";
    draft.color = "Grey";

    const patch = buildDeterministicPrefill(draft);
    const merged = applyPrefillRespectingLocks(draft, patch);

    expect(merged.brand).toBeUndefined();
    expect(merged.color).toBeUndefined();
  });

  it("allows prefill for unlocked fields only", () => {
    const draft = createEmptyDraft();
    draft.title = "Apple iPhone 15 Pro Max 256GB";
    draft.userModified = markFieldsUserModified({}, ["colour"]);
    draft.color = "Grey";

    const patch = buildDeterministicPrefill(draft);
    const merged = applyPrefillRespectingLocks(draft, patch);

    expect(merged.brand).toBe("Apple");
    expect(merged.color).toBeUndefined();
  });

  it("skips photo colour suggestion when colour is user-modified", () => {
    const draft = createEmptyDraft();
    draft.userModified = markFieldsUserModified({}, ["colour"]);
    expect(shouldApplyPhotoColourSuggestion(draft)).toBe(false);
  });

  it("rebuilds description when user changes colour manually", () => {
    const draft = createEmptyDraft();
    draft.photos = [{ id: "1", previewUrl: "/a.jpg", uploaded: true }];
    draft.title = "Silver laptop stand";
    draft.categoryPath = flatPathFromSegments([
      { id: "home", slug: "home-garden", name: "Home & Garden" },
      { id: "office", slug: "office", name: "Office" },
    ]);
    draft.color = "Silver";
    draft.condition = "Good";

    const silver = buildSmartDescription({ draft, title: draft.title }).description;
    draft.color = "Grey";
    draft.userModified = markFieldsUserModified({}, ["colour"]);
    const grey = buildSmartDescription({ draft, title: draft.title }).description;

    expect(silver).toContain("Colour: Silver.");
    expect(grey).toContain("Colour: Grey.");
    expect(grey).not.toContain("Colour: Silver.");
  });

  it("infers locks from restored draft values", () => {
    const inferred = inferUserModifiedFromDraft({
      categoryPath: flatPathFromSegments([
        { id: "shoes", slug: "shoes", name: "Shoes" },
        { id: "trainers", slug: "trainers", name: "Trainers" },
      ]),
      brand: "Nike",
      color: "Blue",
      condition: "Good",
    });

    expect(inferred.category).toBe(true);
    expect(inferred.brand).toBe(true);
    expect(inferred.colour).toBe(true);
    expect(inferred.condition).toBe(true);
  });
});

describe("sell quick conditions", () => {
  it("excludes For Parts and includes Very Good", () => {
    expect(SELL_QUICK_CONDITIONS).toEqual(["New", "Like New", "Very Good", "Good", "Fair"]);
    expect(SELL_QUICK_CONDITIONS).not.toContain("For Parts");
    expect(isSellQuickCondition("Very Good")).toBe(true);
    expect(isSellQuickCondition("For Parts")).toBe(false);
  });
});
