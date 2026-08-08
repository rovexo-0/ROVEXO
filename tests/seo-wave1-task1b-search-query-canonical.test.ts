import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/styles/rovexo/search-results-v1.css", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/components/layout/HubPageMain", () => ({
  HubPageMain: ({ children }: { children?: unknown }) => children ?? null,
}));
vi.mock("@/components/beta/BetaAppShell", () => ({
  BetaAppShell: ({ children }: { children?: unknown }) => children ?? null,
}));
vi.mock("@/components/home/ProductSectionStates", () => ({
  ProductGridSkeleton: () => null,
}));
vi.mock("@/features/search/components/SearchResultsView", () => ({
  SearchResultsView: () => null,
}));
vi.mock("@/lib/search/trending", () => ({
  getTrendingSearches: async () => [],
}));

import { generateMetadata } from "@/app/(platform)/search/page";
import { CAMERA_SEARCH_V1 } from "@/lib/search/camera-search-v1-freeze";

const SEARCH_CANONICAL = "https://www.rovexo.co.uk/search";

async function metaFor(params: {
  q?: string;
  visual?: string;
  category?: string;
}) {
  return generateMetadata({
    searchParams: Promise.resolve(params),
  });
}

describe("SEO Wave 1 Task 1B — Search query canonical coherence", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://www.rovexo.co.uk";
  });

  it("/search — canonical /search · index,follow", async () => {
    const meta = await metaFor({});
    expect(meta.alternates?.canonical).toBe(SEARCH_CANONICAL);
    expect(meta.robots).toEqual({ index: true, follow: true });
  });

  it("/search?q=test — canonical /search · noindex,nofollow", async () => {
    const meta = await metaFor({ q: "test" });
    expect(meta.alternates?.canonical).toBe(SEARCH_CANONICAL);
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.title).toBe('Search results for “test”');
  });

  it("/search?q=rolex — canonical /search · noindex,nofollow", async () => {
    const meta = await metaFor({ q: "rolex" });
    expect(meta.alternates?.canonical).toBe(SEARCH_CANONICAL);
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.title).toBe('Search results for “rolex”');
  });

  it("/search?category=electronics — canonical /search · noindex,nofollow", async () => {
    const meta = await metaFor({ category: "electronics" });
    expect(meta.alternates?.canonical).toBe(SEARCH_CANONICAL);
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.title).toBe("Browse electronics");
  });

  it("/search?visual=1 — existing image-results canonical + noindex unchanged", async () => {
    const meta = await metaFor({ visual: "1" });
    expect(meta.alternates?.canonical).toBe(
      `https://www.rovexo.co.uk${CAMERA_SEARCH_V1.resultsRoute}`,
    );
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.title).toBe("Image Search");
  });
});
