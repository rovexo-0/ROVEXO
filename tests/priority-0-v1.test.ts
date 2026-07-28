import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PRIORITY_0_V1,
  isPriority0SurfaceBlocked,
  isSprint2Unlocked,
  resolvePriority0ReleaseBlocks,
} from "@/lib/priority-0-v1";
import { SUPREME_BLOOD_CODE_IV_V1 } from "@/lib/supreme-blood-code-iv-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Priority 0 — Absolute Law", () => {
  it("locks permanent freeze — nothing comes before white screen + preview + hub", () => {
    expect(PRIORITY_0_V1.codename).toBe("PRIORITY_0");
    expect(PRIORITY_0_V1.status).toBe("OWNER_APPROVED_LOCKED_FROZEN");
    expect(PRIORITY_0_V1.absolute).toBe(true);
    expect(PRIORITY_0_V1.nothingComesBefore).toEqual([
      "WHITE_SCREEN",
      "PREVIEW_VIEW",
      "CONVERSATION_HUB",
    ]);
    expect(PRIORITY_0_V1.priority0Order.at(-1)).toBe("SPRINT_2_UNLOCKED");
  });

  it("blocks release when Owner sees white screen or missing Pay Now", () => {
    expect(isPriority0SurfaceBlocked({ whiteScreen: true })).toBe(true);
    expect(isPriority0SurfaceBlocked({ noPayNow: true })).toBe(true);
    expect(isPriority0SurfaceBlocked({ noHeader: true })).toBe(true);
    expect(isPriority0SurfaceBlocked({})).toBe(false);
    expect(resolvePriority0ReleaseBlocks()).toEqual({
      product: "FAIL",
      sprint: "FAIL",
      commit: "BLOCKED",
      push: "BLOCKED",
      certification: "BLOCKED",
    });
  });

  it("unlocks Sprint 2 only after Priority 0 gates PASS", () => {
    expect(
      isSprint2Unlocked({
        whiteScreenCleared: true,
        conversationHubPass: true,
        visualCertificationPass: true,
        zeroRegressionPass: true,
      }),
    ).toBe(true);
    expect(
      isSprint2Unlocked({
        whiteScreenCleared: true,
        conversationHubPass: true,
        visualCertificationPass: false,
        zeroRegressionPass: true,
      }),
    ).toBe(false);
  });

  it("locks Conversation Hub never-display and preview must-see contracts", () => {
    expect(PRIORITY_0_V1.conversationHubMustNeverDisplay).toContain("WHITE_SCREEN");
    expect(PRIORITY_0_V1.conversationHubMustNeverDisplay).toContain("BROKEN_PAY_NOW");
    expect(PRIORITY_0_V1.previewOwnerMustSee).toContain("PAY_NOW");
    expect(PRIORITY_0_V1.previewOwnerMustSee).toContain("INPUT_BOX");
    expect(PRIORITY_0_V1.failClosedOnlyShow).toContain("LOADING_SKELETON");
  });

  it("wires into Blood IV, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_IV_V1.childLaws).toMatchObject({
      priority0: "lib/priority-0-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      priority0: "lib/priority-0-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      priority0: "lib/priority-0-v1.ts",
    });
  });

  it("keeps Conversation Hub SSOT path and always-apply rule in sync", () => {
    const rule = readSource(".cursor/rules/priority-0-v1.mdc");
    const doc = readSource("docs/engineering/PRIORITY_0_V1.md");
    const hub = readSource(PRIORITY_0_V1.surfaces.conversationHub);
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("NOTHING COMES BEFORE");
    expect(doc).toContain("Sprint 2 unlocked");
    expect(hub).toContain("conv-hub");
    expect(hub).toContain("SafeImage");
    expect(hub).toContain("AccountCanonicalShell");
    expect(hub).toContain("ConversationSkeleton");
  });
});
