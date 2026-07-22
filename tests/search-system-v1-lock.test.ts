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
    expect(SEARCH_SYSTEM_V1.noAi).toBe(true);
    expect(SEARCH_SYSTEM_V1.noVoiceAssistant).toBe(true);
    expect(SEARCH_SYSTEM_V1.cameraAlwaysVisible).toBe(true);
    expect(SEARCH_SYSTEM_V1.closeAlwaysVisible).toBe(true);
  });

  it("opens canonical Search Overlay from Homepage search field", () => {
    const field = readSource("components/home/HomepageSearchField.tsx");
    const overlay = readSource("features/search/components/SearchOverlay.tsx");
    const actions = readSource("features/search/components/SearchInputActions.tsx");
    const history = readSource("features/search/utils/history.ts");

    expect(field).toContain("useSearchOverlayOptional");
    expect(field).toContain("searchOverlay.open");
    expect(field).toContain("SEARCH_SYSTEM_V1.placeholder");
    expect(field).not.toContain("ImageSearchCamera");
    expect(field).not.toContain("homepage-search__suggestions");

    expect(overlay).toContain("SEARCH_SYSTEM_V1.placeholder");
    expect(overlay).toContain("<SearchInputActions");
    expect(overlay).toContain('aria-label="Close"');
    expect(overlay).toContain("Recent Searches");
    expect(overlay).toContain("Trending Searches");
    expect(overlay).toContain("Popular Searches");
    expect(overlay).toContain("Suggested Categories");
    expect(overlay).toContain("Suggested Stores");
    expect(overlay).toContain("Suggested Brands");
    expect(overlay).not.toContain("Recent Listings");
    expect(overlay).not.toContain("SavedSearchesPanel");

    expect(actions).toContain("ImageSearchCamera");
    expect(actions).not.toContain("Voice search");
    expect(actions).not.toContain("onVoice");
    expect(actions).not.toContain("MicIcon");

    expect(history).toContain("SEARCH_SYSTEM_V1.historyMax");
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
