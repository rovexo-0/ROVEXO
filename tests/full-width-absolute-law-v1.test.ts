import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FULL_WIDTH_ABSOLUTE_GOLDEN_RULE,
  FULL_WIDTH_ABSOLUTE_LAW_STATUS,
  FULL_WIDTH_ABSOLUTE_LAW_VERSION,
  FULL_WIDTH_ABSOLUTE_RULE,
  FULL_WIDTH_ABSOLUTE_SHALL_USE,
  FULL_WIDTH_ABSOLUTE_WITHOUT_CHANGING,
  FULL_WIDTH_ABSOLUTE_ZERO_TARGETS,
  fullWidthAbsoluteLawSnapshot,
} from "@/lib/master-engine/full-width-absolute-law-v1";

describe("Full Width Absolute Law v1.0", () => {
  it("locks 100% width/height without redesign", () => {
    const snap = fullWidthAbsoluteLawSnapshot();
    expect(snap.version).toBe("1.0");
    expect(FULL_WIDTH_ABSOLUTE_LAW_VERSION).toBe("1.0");
    expect(snap.status).toBe(FULL_WIDTH_ABSOLUTE_LAW_STATUS);
    expect(snap.absoluteRule).toBe(FULL_WIDTH_ABSOLUTE_RULE);
    expect(snap.goldenRule).toBe(FULL_WIDTH_ABSOLUTE_GOLDEN_RULE);
    expect(FULL_WIDTH_ABSOLUTE_SHALL_USE).toContain("100% AVAILABLE WIDTH");
    expect(FULL_WIDTH_ABSOLUTE_SHALL_USE).toContain("100% AVAILABLE HEIGHT");
    expect(FULL_WIDTH_ABSOLUTE_WITHOUT_CHANGING).toContain("TOKENS");
    expect(FULL_WIDTH_ABSOLUTE_ZERO_TARGETS).toContain("ZERO REDESIGN");
    expect(snap.engineAdaptsTo).toContain("SAFE AREAS");
    expect(snap.displayTargets).toContain("ALL FOLD DEVICES");
  });

  it("ships Cursor rule + master-engine export", () => {
    const rule = readFileSync(
      join(process.cwd(), ".cursor/rules/full-width-absolute-law-v1.mdc"),
      "utf8",
    );
    expect(rule).toContain("ZERO REDESIGN");
    expect(rule).toContain("Engine always adapts to the design");
    const index = readFileSync(join(process.cwd(), "lib/master-engine/index.ts"), "utf8");
    expect(index).toContain("fullWidthAbsoluteLawSnapshot");
  });
});
