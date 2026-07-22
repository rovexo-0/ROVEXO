import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HEADER_MASTER_FREEZE_V1 } from "@/lib/header/header-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Header Master Freeze v1.0 — LEVEL 8", () => {
  it("locks one header, one avatar owner, one profile fetch", () => {
    expect(HEADER_MASTER_FREEZE_V1.oneHeaderOnly).toBe(true);
    expect(HEADER_MASTER_FREEZE_V1.oneAvatarOwner).toBe(true);
    expect(HEADER_MASTER_FREEZE_V1.oneProfileFetchOnAppLoad).toBe(true);
    expect(HEADER_MASTER_FREEZE_V1.headerSurvivesNavigation).toBe(true);
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

  it("HeaderProfileLink does not fetch /api/profile", () => {
    const link = readSource("components/header/HeaderProfileLink.tsx");
    expect(link).toContain("useAvatarOptional");
    expect(link).not.toContain('fetch("/api/profile"');
    expect(link).not.toContain("useEffect");
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
    // Presence lock — freeze forbids edits; assert SSOT files still exist unchanged in role.
    const provider = readSource("features/search/components/SearchProvider.tsx");
    const camera = readSource("features/search/components/SearchInputActions.tsx");
    expect(provider).toContain("useSearchOverlayState");
    expect(camera).toContain("search.setResultsReady");
    expect(camera).not.toContain("router.replace");
  });
});
