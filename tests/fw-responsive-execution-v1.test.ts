import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FW_RESPONSIVE_EXECUTION_AUTO_FIX_WITHOUT,
  FW_RESPONSIVE_EXECUTION_AUTO_STEPS,
  FW_RESPONSIVE_EXECUTION_FAIL_IF,
  FW_RESPONSIVE_EXECUTION_LEVEL,
  FW_RESPONSIVE_EXECUTION_MANDATE,
  FW_RESPONSIVE_EXECUTION_VERSION,
  fwResponsiveExecutionSnapshot,
} from "@/lib/master-engine/fw-responsive-execution-v1";
import { getFullWidthEngineSnapshot } from "@/lib/master-engine/full-width-engine";

describe("Level 8 Full Width + Responsive Execution v1.0", () => {
  it("locks calculate→adapt steps and fail-closed certification", () => {
    const snap = fwResponsiveExecutionSnapshot();
    expect(snap.version).toBe("1.0");
    expect(FW_RESPONSIVE_EXECUTION_VERSION).toBe("1.0");
    expect(snap.level).toBe(8);
    expect(FW_RESPONSIVE_EXECUTION_LEVEL).toBe(8);
    expect(FW_RESPONSIVE_EXECUTION_AUTO_STEPS).toHaveLength(6);
    expect(FW_RESPONSIVE_EXECUTION_AUTO_STEPS[0]?.action).toBe(
      "USE 100% OF AVAILABLE WIDTH",
    );
    expect(FW_RESPONSIVE_EXECUTION_FAIL_IF).toContain("1 overflow problem");
    expect(FW_RESPONSIVE_EXECUTION_AUTO_FIX_WITHOUT).toContain("redesign");
    expect(FW_RESPONSIVE_EXECUTION_MANDATE).toContain("DO NOT REDESIGN");
    expect(snap.certification).toContain("100% PRODUCTION READY");
    expect(getFullWidthEngineSnapshot().level8Execution.level).toBe(8);
  });

  it("ships CSS safe-area + overflow protection without redesign tokens", () => {
    const css = readFileSync(
      join(process.cwd(), "styles/rovexo/full-width-engine-v1.css"),
      "utf8",
    );
    expect(css).toContain("--fw-safe-top");
    expect(css).toContain("overflow-x: clip");
    expect(css).toContain("min-width: 0");
    expect(css).toContain("--fw-pad-x: 16px");
    expect(css).toContain("--homepage-pad-x: 24px");
    expect(css).toContain("--fw-width: 100%");
    const rule = readFileSync(
      join(process.cwd(), ".cursor/rules/fw-responsive-execution-v1.mdc"),
      "utf8",
    );
    expect(rule).toContain("Engine adapts to it");
  });
});
