import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SEARCH_PRIORITY_FREEZE_V1 } from "@/lib/header/search-priority-freeze-v1";
import { HEADER_MASTER_FREEZE_V1 } from "@/lib/header/header-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Search Priority Freeze v1.0 — OWNER LOCKED", () => {
  it("locks search-only header philosophy", () => {
    expect(SEARCH_PRIORITY_FREEZE_V1.status).toBe("OWNER_APPROVED_LOCKED_FROZEN");
    expect(SEARCH_PRIORITY_FREEZE_V1.headerPurpose).toBe("SEARCH_ONLY");
    expect(SEARCH_PRIORITY_FREEZE_V1.headerStateless).toBe(true);
    expect(SEARCH_PRIORITY_FREEZE_V1.identicalMarketplaceChrome).toBe(false);
    expect(SEARCH_PRIORITY_FREEZE_V1.homepageSearchBarOnly).toBe(true);
    expect(SEARCH_PRIORITY_FREEZE_V1.sharedHeaderSurfaces).toEqual(["Home"]);
    expect(SEARCH_PRIORITY_FREEZE_V1.searchOccupiesAvailableSpacePercent).toBe(100);
    expect(SEARCH_PRIORITY_FREEZE_V1.accountUsesBackTitleOnly).toBe(true);
    expect(SEARCH_PRIORITY_FREEZE_V1.forbiddenForever).toContain("Avatar");
    expect(SEARCH_PRIORITY_FREEZE_V1.forbiddenForever).toContain("Notifications");
  });

  it("locks all success gates at PASS", () => {
    const gates = SEARCH_PRIORITY_FREEZE_V1.successGates;
    expect(gates.oneHeader).toBe("PASS");
    expect(gates.oneSearchBar).toBe("PASS");
    expect(gates.noAvatar).toBe("PASS");
    expect(gates.searchPriority100).toBe("PASS");
    expect(gates.availableWidth100).toBe("PASS");
    expect(gates.cameraSearch).toBe("PASS");
  });

  it("uses Homepage-only marketplace chrome (one Search Bar surface)", () => {
    const provider = readSource("features/header/HeaderProvider.tsx");
    const header = readSource("components/header/RovexoHeaderV2.tsx");
    expect(provider).toContain('layout="default"');
    expect(provider).toContain("isHomepageSearchBarRoute");
    expect(provider).not.toContain('layout: "homepage"');
    expect(header).toContain('SEARCH_FIELD_ID = "rx-h2-search"');
    expect(header).not.toContain("hp-canonical-search");
    expect(header).not.toContain("rx-h2--homepage");
    expect(HEADER_MASTER_FREEZE_V1.freezeLocked).toBe(true);
    expect(HEADER_MASTER_FREEZE_V1.homepageSearchBarOnly).toBe(true);
  });
});
