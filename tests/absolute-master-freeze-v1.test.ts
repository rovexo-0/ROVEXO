import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";
import { SEARCH_MASTER_FREEZE_V1 } from "@/lib/search/search-master-freeze-v1";
import { HEADER_MASTER_FREEZE_V1 } from "@/lib/header/header-master-freeze-v1";
import { AUTH_MASTER_FREEZE_V1 } from "@/lib/auth/auth-master-freeze-v1";
import { CAMERA_SEARCH_V1 } from "@/lib/search/camera-search-v1-freeze";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Absolute Master Freeze v1.0 — LEVEL 8 OWNER LOCKED", () => {
  it("locks Owner-approved absolute freeze status", () => {
    expect(ABSOLUTE_MASTER_FREEZE_V1.status).toBe("OWNER_APPROVED_LOCKED_FROZEN");
    expect(ABSOLUTE_MASTER_FREEZE_V1.approvedByOwner).toBe(true);
    expect(ABSOLUTE_MASTER_FREEZE_V1.freezeLocked).toBe(true);
    expect(ABSOLUTE_MASTER_FREEZE_V1.ssotReady).toBe(true);
    expect(ABSOLUTE_MASTER_FREEZE_V1.fiftyPlusYearsReady).toBe(true);
    expect(ABSOLUTE_MASTER_FREEZE_V1.level).toBe(8);
    expect(ABSOLUTE_MASTER_FREEZE_V1.certified).toBe(true);
    expect(ABSOLUTE_MASTER_FREEZE_V1.finalFreeze.masterFreezeCertified).toBe(true);
  });

  it("locks canonical singularity systems", () => {
    const systems = ABSOLUTE_MASTER_FREEZE_V1.canonicalSystems;
    expect(systems.oneHeader).toBe(true);
    expect(systems.oneSearchEngine).toBe(true);
    expect(systems.oneCameraSearch).toBe(true);
    expect(systems.oneAuthSystem).toBe(true);
    expect(systems.oneSessionOwner).toBe(true);
    expect(systems.oneCookieOwner).toBe(true);
    expect(systems.oneUserOwner).toBe(true);
    expect(systems.oneCallbackOwner).toBe(true);
    expect(systems.oneSourceOfTruth).toBe(true);
  });

  it("locks Header SEARCH_ONLY tokens", () => {
    expect(ABSOLUTE_MASTER_FREEZE_V1.header.purpose).toBe("SEARCH_ONLY");
    expect(ABSOLUTE_MASTER_FREEZE_V1.header.status).toBe("FROZEN");
    expect(ABSOLUTE_MASTER_FREEZE_V1.header.searchBar.heightPx).toBe(44);
    expect(ABSOLUTE_MASTER_FREEZE_V1.header.searchBar.radiusPx).toBe(16);
    expect(ABSOLUTE_MASTER_FREEZE_V1.header.searchBar.iconPx).toBe(20);
    expect(HEADER_MASTER_FREEZE_V1.freezeLocked).toBe(true);
    expect(HEADER_MASTER_FREEZE_V1.noAvatarInHeader).toBe(true);
  });

  it("locks Search philosophy and empty/typing contracts", () => {
    expect(SEARCH_MASTER_FREEZE_V1.status).toBe("OWNER_APPROVED_LOCKED_FROZEN");
    expect(SEARCH_MASTER_FREEZE_V1.philosophy.userDoesPercent).toBe(5);
    expect(SEARCH_MASTER_FREEZE_V1.philosophy.rovexoDoesPercent).toBe(95);
    expect(SEARCH_MASTER_FREEZE_V1.emptyStateOnly).toEqual([
      "Recent Searches",
      "Trending Searches",
    ]);
    expect(ABSOLUTE_MASTER_FREEZE_V1.search.status).toBe("FROZEN");
    expect(ABSOLUTE_MASTER_FREEZE_V1.search.notAllowed).toContain("AI Search");
  });

  it("locks Camera Search equation and timing", () => {
    expect(ABSOLUTE_MASTER_FREEZE_V1.cameraSearch.status).toBe("FROZEN");
    expect(ABSOLUTE_MASTER_FREEZE_V1.cameraSearch.equation).toBe(
      "ONE PHOTO = ONE SEARCH = ONE RESULTS PAGE",
    );
    expect(ABSOLUTE_MASTER_FREEZE_V1.cameraSearch.targetSeconds).toBe(2);
    expect(ABSOLUTE_MASTER_FREEZE_V1.cameraSearch.absoluteMaximumSeconds).toBe(3);
    expect(CAMERA_SEARCH_V1.freezeLocked).toBe(true);
    expect(CAMERA_SEARCH_V1.oneCameraSearchOnly).toBe(true);
  });

  it("locks Auth as Supabase singularity", () => {
    expect(ABSOLUTE_MASTER_FREEZE_V1.auth.status).toBe("FROZEN");
    expect(ABSOLUTE_MASTER_FREEZE_V1.auth.system).toBe("SUPABASE_AUTH");
    expect(AUTH_MASTER_FREEZE_V1.canonicalAuthSystem).toBe("SUPABASE_AUTH");
    expect(AUTH_MASTER_FREEZE_V1.freezeLocked).toBe(true);
    expect(ABSOLUTE_MASTER_FREEZE_V1.auth.notAllowed).toContain("Clerk");
    expect(ABSOLUTE_MASTER_FREEZE_V1.auth.notAllowed).toContain("Next Auth");
  });

  it("locks all production gates at PASS", () => {
    for (const value of Object.values(ABSOLUTE_MASTER_FREEZE_V1.productionGates)) {
      expect(value).toBe("PASS");
    }
  });

  it("references existing child freeze files on disk", () => {
    for (const relativePath of Object.values(ABSOLUTE_MASTER_FREEZE_V1.childFreezes)) {
      expect(existsSync(join(process.cwd(), relativePath))).toBe(true);
    }
    const rule = readSource(".cursor/rules/absolute-master-freeze-v1.mdc");
    expect(rule).toContain("ABSOLUTE MASTER FREEZE");
    expect(rule).toContain("LEVEL 8");
    expect(rule).toContain("Production deploy forbidden");
  });

  it("locks golden rules 1–9", () => {
    expect(ABSOLUTE_MASTER_FREEZE_V1.goldenRules.rule1).toContain("HELP SEARCH");
    expect(ABSOLUTE_MASTER_FREEZE_V1.goldenRules.rule2).toContain("DO NOT TOUCH");
    expect(ABSOLUTE_MASTER_FREEZE_V1.goldenRules.rule6).toContain("USER MUST DO LESS");
    expect(ABSOLUTE_MASTER_FREEZE_V1.goldenRules.rule9).toContain(
      "PRODUCTION DEPLOY IS FORBIDDEN",
    );
  });
});
