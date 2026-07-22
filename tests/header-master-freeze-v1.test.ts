import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HEADER_MASTER_FREEZE_V1 } from "@/lib/header/header-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Header Master Freeze v1.0 — LEVEL 8 Search-First", () => {
  it("locks search-first minimalist header (no notification / avatar)", () => {
    expect(HEADER_MASTER_FREEZE_V1.oneHeaderOnly).toBe(true);
    expect(HEADER_MASTER_FREEZE_V1.searchFirstMinimalist).toBe(true);
    expect(HEADER_MASTER_FREEZE_V1.fullWidthSearchBar).toBe(true);
    expect(HEADER_MASTER_FREEZE_V1.noNotificationIcon).toBe(true);
    expect(HEADER_MASTER_FREEZE_V1.noAvatarInHeader).toBe(true);
    expect(HEADER_MASTER_FREEZE_V1.noHeaderProfileFetch).toBe(true);
    expect(HEADER_MASTER_FREEZE_V1.headerSurvivesNavigation).toBe(true);
    expect(HEADER_MASTER_FREEZE_V1.freezeLocked).toBe(true);
    expect(HEADER_MASTER_FREEZE_V1.searchBarTokens.heightPx).toBe(44);
    expect(HEADER_MASTER_FREEZE_V1.searchBarTokens.radiusPx).toBe(16);
    expect(HEADER_MASTER_FREEZE_V1.searchBarTokens.textPx).toBe(14);
    expect(HEADER_MASTER_FREEZE_V1.searchBarTokens.iconPx).toBe(20);
    expect(HEADER_MASTER_FREEZE_V1.searchBarTokens.paddingPx).toBe(16);
  });

  it("mounts Auth + Avatar + Header providers once in root layout", () => {
    const layout = readSource("app/layout.tsx");
    expect(layout).toContain("AuthProvider");
    expect(layout).toContain("AvatarProvider");
    expect(layout).toContain("HeaderProvider");
    expect(layout.match(/<AuthProvider>/g)?.length).toBe(1);
    expect(layout.match(/<AvatarProvider>/g)?.length).toBe(1);
    expect(layout.match(/<HeaderProvider>/g)?.length).toBe(1);
    expect(layout.match(/<SearchProvider>/g)?.length).toBe(1);
  });

  it("RovexoHeaderV2 has no notification, avatar, or badges", () => {
    const header = readSource("components/header/RovexoHeaderV2.tsx");
    expect(header).toContain("HomepageSearchField");
    expect(header).toContain('data-header-search-first="true"');
    expect(header).not.toContain("BellLineIcon");
    expect(header).not.toContain("HeaderProfileLink");
    expect(header).not.toContain("useHeaderBadges");
    expect(header).not.toContain("HomepageHeaderShareButton");
  });

  it("results and search pages do not mount a second RovexoHeaderV2", () => {
    const results = readSource("app/search/image/results/page.tsx");
    const search = readSource("app/search/page.tsx");
    const home = readSource("app/page.tsx");
    const discovery = readSource("components/layout/DiscoveryPageShell.tsx");

    expect(results).not.toMatch(/<RovexoHeaderV2[\s/>]/);
    expect(search).not.toMatch(/<RovexoHeaderV2[\s/>]/);
    expect(home).not.toMatch(/<RovexoHeaderV2[\s/>]/);
    expect(discovery).not.toMatch(/<RovexoHeaderV2[\s/>]/);
  });

  it("does not modify Camera Search / SearchProvider ownership files", () => {
    const provider = readSource("features/search/components/SearchProvider.tsx");
    const camera = readSource("features/search/components/SearchInputActions.tsx");
    expect(provider).toContain("useSearchOverlayState");
    expect(camera).toContain("search.setResultsReady");
    expect(camera).not.toContain("router.replace");
  });
});
