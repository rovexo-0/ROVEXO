import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  SEARCH_UI_FREEZE_NAME,
  SEARCH_UI_V1_FREEZE,
} from "@/lib/search/search-ui-v1-freeze";

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

describe("Search UI Freeze — SEARCH_UI_v1.0", () => {
  it("locks freeze identity and Owner certification", () => {
    expect(SEARCH_UI_FREEZE_NAME).toBe("SEARCH_UI_v1.0");
    expect(SEARCH_UI_V1_FREEZE.status).toBe("FROZEN");
    expect(SEARCH_UI_V1_FREEZE.ownerApproved).toBe(true);
    expect(SEARCH_UI_V1_FREEZE.freezeLocked).toBe(true);
    expect(SEARCH_UI_V1_FREEZE.permanentlyFrozen).toBe(true);
    expect(SEARCH_UI_V1_FREEZE.certified).toBe(true);
    expect(SEARCH_UI_V1_FREEZE.approvedAt).toBe("2026-07-25");
  });

  it("forbids visual redesign without Owner approval", () => {
    expect(SEARCH_UI_V1_FREEZE.lockedForbiddenWithoutOwnerApproval).toContain(
      "Visual redesign",
    );
    expect(SEARCH_UI_V1_FREEZE.lockedForbiddenWithoutOwnerApproval).toContain(
      "Spacing changes",
    );
  });

  it("excludes engine / API / backend from UI freeze", () => {
    expect(SEARCH_UI_V1_FREEZE.notIncluded).toContain("Search Engine");
    expect(SEARCH_UI_V1_FREEZE.notIncluded).toContain("Search API");
    expect(SEARCH_UI_V1_FREEZE.notIncluded).toContain("Backend");
  });

  it("stamps SEARCH_UI_v1.0 DOM on Search landing", () => {
    const landing = read("features/search/components/SearchLandingView.tsx");
    expect(landing).toContain(`data-search-freeze="${SEARCH_UI_FREEZE_NAME}"`);
    expect(landing).toContain('data-search-ui="v1.0"');
    expect(landing).toContain('data-search-version="v1.0"');
  });

  it("keeps category cards badge-free (image → name → count)", () => {
    const card = read("features/search/components/SearchCategoryBrowseCard.tsx");
    expect(card).not.toContain("srch-land__cat-badge");
    expect(SEARCH_UI_V1_FREEZE.visualLock.categoryBadges).toBe(false);
    expect(SEARCH_UI_V1_FREEZE.visualLock.categoryStructure).toEqual([
      "image",
      "name",
      "itemCount",
    ]);
  });

  it("documents the freeze", () => {
    const doc = read("docs/modules/search/UI_FREEZE.md");
    expect(doc).toContain("SEARCH_UI_v1.0");
    expect(doc).toContain("FROZEN");
  });
});
