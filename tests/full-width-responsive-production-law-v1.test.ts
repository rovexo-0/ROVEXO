import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FULL_WIDTH_RESPONSIVE_PRODUCTION_ABSOLUTE_RULE,
  FULL_WIDTH_RESPONSIVE_PRODUCTION_FORBIDDEN_CREATE,
  FULL_WIDTH_RESPONSIVE_PRODUCTION_FORBIDDEN_REDESIGN,
  FULL_WIDTH_RESPONSIVE_PRODUCTION_GOLDEN_RULE,
  FULL_WIDTH_RESPONSIVE_PRODUCTION_LAW_LEVEL,
  FULL_WIDTH_RESPONSIVE_PRODUCTION_LAW_STATUS,
  FULL_WIDTH_RESPONSIVE_PRODUCTION_LAW_VERSION,
  FULL_WIDTH_RESPONSIVE_PRODUCTION_ZERO,
  fullWidthResponsiveProductionLawSnapshot,
} from "@/lib/master-engine/full-width-responsive-production-law-v1";

describe("Full Width + Responsive Production Law v1.0", () => {
  it("locks engine-adapts-to-design production contract", () => {
    const snap = fullWidthResponsiveProductionLawSnapshot();
    expect(snap.version).toBe("1.0");
    expect(FULL_WIDTH_RESPONSIVE_PRODUCTION_LAW_VERSION).toBe("1.0");
    expect(snap.level).toBe(8);
    expect(FULL_WIDTH_RESPONSIVE_PRODUCTION_LAW_LEVEL).toBe(8);
    expect(snap.status).toBe(FULL_WIDTH_RESPONSIVE_PRODUCTION_LAW_STATUS);
    expect(snap.absoluteRule).toBe(FULL_WIDTH_RESPONSIVE_PRODUCTION_ABSOLUTE_RULE);
    expect(snap.goldenRule).toBe(FULL_WIDTH_RESPONSIVE_PRODUCTION_GOLDEN_RULE);
    expect(FULL_WIDTH_RESPONSIVE_PRODUCTION_FORBIDDEN_REDESIGN).toContain(
      "redesign tokens",
    );
    expect(FULL_WIDTH_RESPONSIVE_PRODUCTION_FORBIDDEN_CREATE).toContain("v2");
    expect(FULL_WIDTH_RESPONSIVE_PRODUCTION_ZERO).toContain("overflow");
    expect(snap.everyPageMustUse).toContain("100% SAFE AREA SUPPORT");
    expect(snap.engineWithout).toContain("changing design tokens");
    expect(snap.singularity).toContain("ONE FULL WIDTH ENGINE");
  });

  it("ships Cursor rule + master-engine export", () => {
    const rule = readFileSync(
      join(process.cwd(), ".cursor/rules/full-width-responsive-production-law-v1.mdc"),
      "utf8",
    );
    expect(rule).toContain("Do not modify the design");
    expect(rule).toContain("modify the engine");
    const index = readFileSync(join(process.cwd(), "lib/master-engine/index.ts"), "utf8");
    expect(index).toContain("fullWidthResponsiveProductionLawSnapshot");
  });
});
