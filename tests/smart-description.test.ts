import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/features/sell/types";
import { flatPathFromSegments } from "@/lib/categories/types";
import { parseListingTitle } from "@/lib/sell/title-parser";
import { buildPhotoAnalysisSnapshot } from "@/lib/sell/photo-metadata";
import {
  buildSmartDescription,
  canStartSmartDescriptionEngine,
  markDescriptionAsUserEdited,
  shouldApplyAutoDescription,
} from "@/lib/sell/smart-description-engine";

function pillowDraft() {
  const draft = createEmptyDraft();
  draft.photos = [{ id: "1", previewUrl: "/a.jpg", uploaded: true }];
  draft.title = "Memory Foam Pillow";
  draft.categoryPath = flatPathFromSegments([
    { id: "home", slug: "home-garden", name: "Home & Garden" },
    { id: "bed", slug: "bedroom", name: "Bedroom" },
    { id: "pillows", slug: "pillows", name: "Pillows" },
  ]);
  draft.condition = "New";
  draft.color = "White";
  return draft;
}

describe("smart description engine", () => {
  it("does not start before photo, title and category are ready", () => {
    const draft = createEmptyDraft();
    expect(canStartSmartDescriptionEngine(draft, "")).toBe(false);

    draft.photos = [{ id: "1", previewUrl: "/a.jpg", uploaded: true }];
    expect(canStartSmartDescriptionEngine(draft, "Chair")).toBe(false);

    draft.categoryPath = flatPathFromSegments([
      { id: "home", slug: "home-garden", name: "Home & Garden" },
      { id: "bed", slug: "bedroom", name: "Bedroom" },
    ]);
    expect(canStartSmartDescriptionEngine(draft, "Chair")).toBe(true);
  });

  it("builds a factual template without inventing fields", () => {
    const draft = pillowDraft();
    const result = buildSmartDescription({ draft, title: draft.title });

    expect(result.description).toContain("Memory Foam Pillow.");
    expect(result.description).toContain("Condition: New.");
    expect(result.description).toContain("Colour: White.");
    expect(result.description).toContain("Please see all photos for full details.");
    expect(result.description).not.toContain("undefined");
  });

  it("refreshes live when condition changes", () => {
    const draft = pillowDraft();
    const first = buildSmartDescription({ draft, title: draft.title }).description;
    draft.condition = "Good";
    const second = buildSmartDescription({ draft, title: draft.title }).description;
    expect(first).toContain("Condition: New.");
    expect(second).toContain("Condition: Good.");
  });

  it("never overwrites manual edits", () => {
    const state = { lastAuto: "Auto text.", userEdited: false };
    expect(shouldApplyAutoDescription("Auto text.", "New auto.", state)).toBe(true);

    const edited = markDescriptionAsUserEdited("My custom copy.", state);
    expect(edited.userEdited).toBe(true);
    expect(shouldApplyAutoDescription("My custom copy.", "New auto.", edited)).toBe(false);
  });

  it("parses title keywords without stop words", () => {
    const parsed = parseListingTitle("Nike trainers for sale with box");
    expect(parsed.brand).toBe("Nike");
    expect(parsed.keywords).toContain("trainers");
    expect(parsed.keywords).not.toContain("for");
  });

  it("generates in under 100ms", () => {
    const draft = pillowDraft();
    const start = performance.now();
    for (let index = 0; index < 100; index += 1) {
      buildSmartDescription({ draft, title: draft.title });
    }
    const elapsed = performance.now() - start;
    expect(elapsed / 100).toBeLessThan(100);
  });

  it("analyses photo metadata deterministically", () => {
    const snapshot = buildPhotoAnalysisSnapshot(
      [{ id: "1", previewUrl: "/a.jpg" }],
      [{ id: "1", width: 1200, height: 800, orientation: "landscape", dominantColour: "White" }],
    );
    expect(snapshot.count).toBe(1);
    expect(snapshot.orientations).toEqual(["landscape"]);
    expect(snapshot.dominantColours).toEqual(["White"]);
  });
});
