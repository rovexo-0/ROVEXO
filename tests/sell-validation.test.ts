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

  it("core-6 gate: after photos/title/description/category next required is price (condition optional)", () => {
    const draft = {
      ...createEmptyDraft(),
      photos: [{ id: "1", previewUrl: "/x.jpg", uploaded: true }],
      title: "Blue Nike trainers",
      description: "Great trainers in good condition for sale.",
      categoryPath: flatPathFromSegments([
        { id: "mens", slug: "mens-fashion", name: "Men's Fashion" },
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
    expect(issue?.field).toBe("price");
  });

  it("includes condition in progressive steps after attributes", () => {
    const draft = {
      ...createEmptyDraft(),
      categoryPath: flatPathFromSegments([
        { id: "electronics", slug: "electronics", name: "Electronics" },
        { id: "phones", slug: "phones-tablets", name: "Phones & Tablets" },
        { id: "android-phones", slug: "android-phones", name: "Android Phones" },
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
      title: "iPhone 16 Pro",
      description: "Sealed smartphone for testing publish gate.",
      categoryPath: flatPathFromSegments([
        { id: "electronics", slug: "electronics", name: "Electronics" },
        { id: "phones", slug: "phones-tablets", name: "Phones & Tablets" },
        { id: "android-phones", slug: "android-phones", name: "Android Phones" },
      ]),
      brand: "Apple",
      condition: "New",
      parcelSize: "small" as const,
      price: "12",
    };
    expect(
      isSellListingPublishable(draft, { title: draft.title, description: draft.description }),
    ).toBe(true);
  });
});
