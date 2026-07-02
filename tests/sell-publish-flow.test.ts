import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/features/sell/types";
import { resolveEffectiveSellDraft } from "@/lib/sell/resolve-effective-draft";
import { isListingValid } from "@/features/sell/types";
import { resolveCategoryPathBySlugs } from "@/lib/categories/queries";

describe("sell publish flow with pending title", () => {
  it("validates using in-progress title before idle commit", () => {
    const draft = createEmptyDraft();
    draft.photos = [
      {
        id: "1",
        previewUrl: "https://www.rovexo.co.uk/media/test/a.jpg",
        uploaded: true,
        url: "https://www.rovexo.co.uk/media/test/a.jpg",
        storagePath: "seller/a.jpg",
      },
    ];
    draft.description = "A complete description for the listing.";
    draft.categoryPath = resolveCategoryPathBySlugs(["shoes", "trainers", "nike"]);
    draft.condition = "Good";
    draft.price = "50";
    draft.shippingMethod = "delivery_available";
    draft.locationCity = "London";

    const pendingTitle = "Nike trainers size 9";
    const effectiveDraft = resolveEffectiveSellDraft(draft, pendingTitle);

    expect(draft.title).toBe("");
    expect(effectiveDraft.title).toBe(pendingTitle);
    expect(isListingValid(effectiveDraft, { mode: "quick" })).toBe(true);
  });
});
