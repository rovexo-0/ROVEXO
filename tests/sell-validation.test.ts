import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/features/sell/types";
import { flatPathFromSegments } from "@/lib/categories/types";
import { getFirstSellValidationIssue, isSellListingPublishable } from "@/lib/sell/sell-validation";
import { buildSellProgressiveSteps } from "@/lib/sell/sell-progressive-flow";

describe("sell validation engine", () => {
  it("checks fields in canonical order and stops at the first issue", () => {
    const draft = createEmptyDraft();
    const issue = getFirstSellValidationIssue(draft, { title: "", description: "" });
    expect(issue?.field).toBe("photos");
  });

  it("requires condition before parcel and price", () => {
    const draft = {
      ...createEmptyDraft(),
      photos: [{ id: "1", previewUrl: "/x.jpg", uploaded: true }],
      title: "Blue Nike trainers",
      description: "Great trainers in good condition for sale.",
      categoryPath: flatPathFromSegments([
        { id: "shoes", slug: "shoes", name: "Shoes" },
        { id: "trainers", slug: "trainers", name: "Trainers" },
      ]),
      brand: "Nike",
      color: "Blue",
      size: "UK 9",
    };
    const issue = getFirstSellValidationIssue(draft, {
      title: draft.title,
      description: draft.description,
    });
    expect(issue?.field).toBe("condition");
  });

  it("includes condition in progressive steps after attributes", () => {
    const draft = {
      ...createEmptyDraft(),
      categoryPath: flatPathFromSegments([
        { id: "health", slug: "health", name: "Health" },
        { id: "wellness", slug: "wellness", name: "Wellness" },
      ]),
    };
    const steps = buildSellProgressiveSteps(draft).map((step) => step.id);
    expect(steps).toContain("condition");
    expect(steps.indexOf("condition")).toBeGreaterThan(steps.findIndex((id) => id.startsWith("attribute:")));
  });

  it("publishable only when all required quick-sell fields are complete", () => {
    const draft = {
      ...createEmptyDraft(),
      photos: [{ id: "1", previewUrl: "/x.jpg", uploaded: true }],
      title: "Vitamin bottle",
      description: "Sealed supplement bottle for testing.",
      categoryPath: flatPathFromSegments([
        { id: "health", slug: "health", name: "Health" },
        { id: "wellness", slug: "wellness", name: "Wellness" },
      ]),
      brand: "Brand X",
      condition: "New",
      parcelSize: "small" as const,
      price: "12",
    };
    expect(
      isSellListingPublishable(draft, { title: draft.title, description: draft.description }),
    ).toBe(true);
  });
});
