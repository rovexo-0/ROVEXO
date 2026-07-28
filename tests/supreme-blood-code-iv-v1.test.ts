import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  SUPREME_BLOOD_CODE_IV_V1,
  isForbiddenBlankMode,
  isWhiteScreenForbidden,
  resolveKillSwitchRenderMode,
  resolveWhiteScreenReleaseBlocks,
} from "@/lib/supreme-blood-code-iv-v1";
import { SUPREME_BLOOD_CODE_V1 } from "@/lib/supreme-blood-code-v1";
import { SUPREME_BLOOD_CODE_III_V1 } from "@/lib/supreme-blood-code-iii-v1";
import { VIEW_ANALYZER_V1 } from "@/lib/view-analyzer-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Supreme Blood Code IV — White Screen Kill Switch", () => {
  it("locks permanent freeze markers", () => {
    expect(SUPREME_BLOOD_CODE_IV_V1.codename).toBe("WHITE_SCREEN_KILL_SWITCH");
    expect(SUPREME_BLOOD_CODE_IV_V1.status).toBe("OWNER_APPROVED_LOCKED_FROZEN");
    expect(SUPREME_BLOOD_CODE_IV_V1.neverRemove).toBe(true);
    expect(SUPREME_BLOOD_CODE_IV_V1.failClosed).toBe(true);
    expect(SUPREME_BLOOD_CODE_IV_V1.whiteScreenIsForbidden).toBe(true);
    expect(isWhiteScreenForbidden()).toBe(true);
  });

  it("renders REAL_PAGE only when all pre-render checks PASS", () => {
    const checks = SUPREME_BLOOD_CODE_IV_V1.preRenderChecks.map((id) => ({
      id,
      pass: true,
    }));
    expect(resolveKillSwitchRenderMode({ checks })).toBe("REAL_PAGE");
    expect(
      resolveKillSwitchRenderMode({
        checks: [
          ...checks.slice(0, -1),
          { id: "VIEW_EXISTS", pass: false },
        ],
      }),
    ).toBe("SKELETON_PAGE");
    expect(resolveKillSwitchRenderMode({ checks: [] })).toBe("SKELETON_PAGE");
  });

  it("forbids blank modes and blocks release on Owner white screen", () => {
    expect(isForbiddenBlankMode("WHITE_SCREEN")).toBe(true);
    expect(isForbiddenBlankMode("NULL_SCREEN")).toBe(true);
    expect(SUPREME_BLOOD_CODE_IV_V1.allowedRenderModes).toContain("SKELETON_PAGE");
    expect(SUPREME_BLOOD_CODE_IV_V1.allowedRenderModes).toContain("SELF_RECOVERY_PAGE");
    expect(resolveWhiteScreenReleaseBlocks()).toEqual({
      certification: "FAIL",
      sprint: "FAIL",
      commit: "BLOCKED",
      push: "BLOCKED",
      freeze: "BLOCKED",
      ownerApproval: "BLOCKED",
    });
  });

  it("wires into Blood I/III, View Analyzer, Constitution, Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_V1.childLaws).toMatchObject({
      whiteScreenKillSwitch: "lib/supreme-blood-code-iv-v1.ts",
    });
    expect(SUPREME_BLOOD_CODE_III_V1.childLaws).toMatchObject({
      whiteScreenKillSwitch: "lib/supreme-blood-code-iv-v1.ts",
    });
    expect(VIEW_ANALYZER_V1.childLaws).toMatchObject({
      whiteScreenKillSwitch: "lib/supreme-blood-code-iv-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      supremeBloodCodeIv: "lib/supreme-blood-code-iv-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      supremeBloodCodeIv: "lib/supreme-blood-code-iv-v1.ts",
    });
  });

  it("keeps always-apply Cursor rule and engineering doc in sync", () => {
    const rule = readSource(".cursor/rules/supreme-blood-code-iv-v1.mdc");
    const doc = readSource("docs/engineering/SUPREME_BLOOD_CODE_IV_V1.md");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("WHITE SCREEN KILL SWITCH");
    expect(rule).toContain("lib/supreme-blood-code-iv-v1.ts");
    expect(doc).toContain("NEVER REMOVE");
    expect(doc).toContain("the product does not exist");
    expect(SUPREME_BLOOD_CODE_IV_V1.absoluteLaws.ifWhiteScreenExistsProductDoesNotExist).toBe(
      true,
    );
  });
});
