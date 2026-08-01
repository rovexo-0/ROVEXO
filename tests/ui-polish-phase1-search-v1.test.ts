import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { UI_POLISH_PHASE1_SEARCH_V1 } from "@/lib/design-system/ui-polish-phase1-search-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("UI Polish Phase 1 — Search", () => {
  it("locks scope: Search only · Listing Card + Homepage frozen · filters deferred", () => {
    expect(UI_POLISH_PHASE1_SEARCH_V1.page).toBe("search");
    expect(UI_POLISH_PHASE1_SEARCH_V1.listingCardLocked).toBe(true);
    expect(UI_POLISH_PHASE1_SEARCH_V1.homepageLocked).toBe(true);
    expect(UI_POLISH_PHASE1_SEARCH_V1.deferred).toContain("filter_button");
    expect(UI_POLISH_PHASE1_SEARCH_V1.deferred).toContain("sort_button");
    expect(UI_POLISH_PHASE1_SEARCH_V1.forbidden).toContain("listing_card_redesign");
  });

  it("bridges landing tokens to CDS and keeps ≥44 touch", () => {
    const css = readSource("styles/rovexo/search-landing-v1.css");
    expect(css).toContain("--cds-space-page-x");
    expect(css).toContain("--cds-touch-target");
    expect(css).toContain("--cds-color-primary");
    expect(css).toContain("font-size: 16px");
    expect(css).toContain("width: var(--srch-land-touch)");
  });

  it("results close / empty back / retry use ≥44 touch; Listing Card untouched", () => {
    const css = readSource("styles/rovexo/search-results-v1.css");
    const resultsView = readSource("features/search/components/SearchResultsView.tsx");
    const listingCard = readSource("components/ui/ListingCard.tsx");

    expect(css).toContain("--cds-touch-target");
    expect(css).toContain("width: var(--srch-results-touch)");
    expect(css).toContain("srch-results__error-retry");
    expect(css).not.toContain("width: 40px");
    expect(resultsView).toContain("srch-results__error-retry");
    expect(resultsView).toContain("Search unavailable");
    expect(resultsView).toContain("ListingCard");
    expect(listingCard).not.toContain("ui-polish-phase1");
  });
});
