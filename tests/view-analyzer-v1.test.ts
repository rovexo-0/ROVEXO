import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  VIEW_ANALYZER_V1,
  analyzeOwnerView,
  isUserFacingFailureModeForbidden,
  resolveFailureUiFallback,
} from "@/lib/view-analyzer-v1";
import { SUPREME_BLOOD_CODE_III_V1 } from "@/lib/supreme-blood-code-iii-v1";
import { ROVEXO_CONSTITUTION_V1 } from "@/lib/rovexo-constitution-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO View Analyzer v1.0", () => {
  it("locks permanent freeze markers", () => {
    expect(VIEW_ANALYZER_V1.codename).toBe("VIEW_ANALYZER");
    expect(VIEW_ANALYZER_V1.status).toBe("OWNER_APPROVED_LOCKED_FROZEN");
    expect(VIEW_ANALYZER_V1.neverRemove).toBe(true);
    expect(VIEW_ANALYZER_V1.absoluteLaws.neverWhiteScreen).toBe(true);
    expect(VIEW_ANALYZER_V1.ownerMustSee).toContain("PAY_NOW");
    expect(VIEW_ANALYZER_V1.ownerMustSee).toContain("MESSAGE_INPUT");
  });

  it("fails on white/empty/broken/infinite and missing Owner approval", () => {
    expect(analyzeOwnerView({ whiteScreen: true })).toBe("VIEW_FAIL");
    expect(analyzeOwnerView({ emptyPage: true })).toBe("VIEW_FAIL");
    expect(analyzeOwnerView({ brokenImage: true })).toBe("VIEW_FAIL");
    expect(analyzeOwnerView({ loadingForever: true })).toBe("VIEW_FAIL");
    expect(analyzeOwnerView({ ownerVisualApproval: false })).toBe("VIEW_FAIL");
    expect(analyzeOwnerView({ hasSkeleton: false })).toBe("VIEW_FAIL");
    expect(analyzeOwnerView({ hasImage: false })).toBe("VIEW_FAIL");
    expect(analyzeOwnerView({ hasPayNow: false })).toBe("VIEW_FAIL");
    expect(
      analyzeOwnerView({
        whiteScreen: false,
        emptyPage: false,
        brokenImage: false,
        noButton: false,
        noPreview: false,
        loadingForever: false,
        hasSkeleton: true,
        hasImage: true,
        hasPayNow: true,
        ownerVisualApproval: true,
      }),
    ).toBe("VIEW_PASS");
  });

  it("forbids user-facing white/null screens and requires skeleton fallback", () => {
    expect(isUserFacingFailureModeForbidden("WHITE_SCREEN")).toBe(true);
    expect(isUserFacingFailureModeForbidden("NULL_PAGE")).toBe(true);
    expect(VIEW_ANALYZER_V1.onFailureShow).toContain("SKELETON_UI");
    expect(VIEW_ANALYZER_V1.onFailureShow).toContain("ERROR_COMPONENT");
    expect(resolveFailureUiFallback()).toBe("SKELETON_UI");
  });

  it("wires into Blood III, Constitution, and Absolute Master Freeze", () => {
    expect(SUPREME_BLOOD_CODE_III_V1.childLaws).toMatchObject({
      viewAnalyzer: "lib/view-analyzer-v1.ts",
    });
    expect(ROVEXO_CONSTITUTION_V1.childLaws).toMatchObject({
      viewAnalyzer: "lib/view-analyzer-v1.ts",
    });
    expect(ABSOLUTE_MASTER_FREEZE_V1.childFreezes).toMatchObject({
      viewAnalyzer: "lib/view-analyzer-v1.ts",
    });
  });

  it("keeps always-apply Cursor rule and engineering doc in sync", () => {
    const rule = readSource(".cursor/rules/view-analyzer-v1.mdc");
    const doc = readSource("docs/engineering/VIEW_ANALYZER_V1.md");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("never white screen");
    expect(rule).toContain("lib/view-analyzer-v1.ts");
    expect(doc).toContain("DOES NOT EXIST");
    expect(doc).toContain("Fail Closed");
  });
});
