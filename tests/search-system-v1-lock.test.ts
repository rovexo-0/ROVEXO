import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SEARCH_SYSTEM_V1 } from "@/lib/search/search-system-v1-lock";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Search System v1.0 production lock", () => {
  it("locks placeholder, history max, and no-AI / no-voice policy", () => {
    expect(SEARCH_SYSTEM_V1.placeholder).toBe("Search for items or members");
    expect(SEARCH_SYSTEM_V1.historyMax).toBe(20);
    expect(SEARCH_SYSTEM_V1.status).toBe("IN_PROGRESS");
    expect(SEARCH_SYSTEM_V1.noAi).toBe(true);
    expect(SEARCH_SYSTEM_V1.noVoiceAssistant).toBe(true);
    expect(SEARCH_SYSTEM_V1.noExternalAiApis).toBe(true);
    expect(SEARCH_SYSTEM_V1.cameraAlwaysVisible).toBe(true);
    expect(SEARCH_SYSTEM_V1.closeAlwaysVisible).toBe(true);
  });

  it("routes Homepage search field to /search (SEARCH_UI_v1.0 SSOT — no overlay bypass)", () => {
    const field = readSource("components/home/HomepageSearchField.tsx");
    const overlay = readSource("features/search/components/SearchOverlay.tsx");
    const actions = readSource("features/search/components/SearchInputActions.tsx");
    const history = readSource("features/search/utils/history.ts");
    const landing = readSource("features/search/components/SearchLandingView.tsx");
    const typeahead = readSource("features/search/components/SearchTypeaheadPanel.tsx");

    expect(field).toContain('router.push("/search")');
    expect(field).not.toContain("searchOverlay.open");
    expect(field).toContain("SEARCH_SYSTEM_V1.placeholder");
    expect(field).not.toContain("ImageSearchCamera");
    expect(field).not.toContain("homepage-search__suggestions");

    expect(landing).toContain("SearchTypeaheadPanel");
    expect(landing).toContain('data-search-freeze="SEARCH_UI_v1.0"');
    expect(landing).not.toContain("searchOverlay.open");
    expect(typeahead).toContain("useSearchResults");

    expect(overlay).toContain("SEARCH_SYSTEM_V1.placeholder");
    expect(overlay).toContain("<SearchInputActions");
    expect(overlay).toContain('aria-label="Close"');
    expect(overlay).toContain("SearchBarSearchIcon");
    expect(overlay).toContain("SearchBarCloseIcon");
    expect(overlay).toContain('data-search-bar="v1-icon-freeze"');
    expect(overlay).toContain("Recent Searches");
    expect(overlay).toContain("Trending Searches");
    expect(overlay).toContain('title="Suggestions"');
    expect(overlay).toContain('title="Products"');
    expect(overlay).toContain("Relevant Categories");
    expect(overlay).toContain("Relevant Stores");
    expect(overlay).toContain("Relevant Members");
    expect(overlay).toContain("Similar Products");
    expect(overlay).toContain("Recent + Trending ONLY");
    expect(overlay).not.toContain("Popular Searches");
    expect(overlay).not.toContain("Recent Listings");
    expect(overlay).not.toContain("SavedSearchesPanel");
    expect(overlay).not.toContain('title="Brands"');

    expect(actions).toContain("SearchBarCameraIcon");
    expect(actions).not.toContain("Voice search");
    expect(actions).not.toContain("onVoice");
    expect(actions).not.toContain("MicIcon");
    expect(actions).not.toContain("GalleryLineIcon");

    expect(history).toContain("SEARCH_SYSTEM_V1.historyMax");
  });

  it("locks Search Bar icons to Profile Icons Family (20×20 · stroke 1.9)", () => {
    const icons = readSource("features/search/components/SearchBarIcons.tsx");
    const field = readSource("components/home/HomepageSearchField.tsx");
    const camera = readSource("components/home/ImageSearchCamera.tsx");
    const css = readSource("styles/rovexo/homepage-header.css");

    expect(icons).toContain("SEARCH_BAR_ICON_SIZE_PX = 20");
    expect(icons).toContain("SEARCH_BAR_ICON_STROKE = 1.9");
    expect(icons).toContain("SEARCH_BAR_HEIGHT_PX = 44");
    expect(icons).toContain("SEARCH_BAR_RADIUS_PX = 16");
    expect(icons).toContain("SEARCH_BAR_TEXT_PX = 16");
    expect(icons).toContain("Profile Icons Family");
    expect(field).toContain("SearchBarSearchIcon");
    expect(camera).toContain("SearchBarCameraIcon");
    expect(camera).not.toContain("GalleryLineIcon");
    expect(css).toContain("height: 44px");
    expect(css).toContain("border-radius: 16px");
  });

  it("uses DB-backed search server without hardcoded fake sellers", () => {
    const server = readSource("features/search/utils/search-server.ts");
    const defaults = readSource("lib/search/defaults.ts");

    expect(server).toContain("getPopularSearches");
    expect(server).toContain("getTrendingSearches");
    expect(server).toContain("resolveStoreHrefFromSeller");
    expect(server).not.toContain("defaultSuggestedSellers");
    expect(server).not.toContain("TechHub");
    expect(defaults).toContain("defaultSuggestedSellers: SuggestedSeller[] = []");
  });

  it("keeps image search free of AI providers", () => {
    const search = readSource("lib/image-search/search.ts");
    expect(search).not.toMatch(/openai|anthropic|vision api|chatgpt/i);
  });
});
