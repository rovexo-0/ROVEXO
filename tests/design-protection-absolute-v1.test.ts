import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DESIGN_PROTECTION_ABSOLUTE_RULE,
  DESIGN_PROTECTION_ABSOLUTE_STATUS,
  DESIGN_PROTECTION_ABSOLUTE_VERSION,
  DESIGN_PROTECTION_CANONICAL_FORBIDDEN,
  DESIGN_PROTECTION_ENGINE_FORBIDDEN,
  DESIGN_PROTECTION_EQUATION,
  DESIGN_PROTECTION_FORBIDDEN_SYSTEMS,
  DESIGN_PROTECTION_GOLDEN_RULE,
  designProtectionAbsoluteSnapshot,
} from "@/lib/master-engine/design-protection-absolute-v1";

describe("Design Protection Absolute v1.1", () => {
  it("locks protect-never-redesign contract", () => {
    const snap = designProtectionAbsoluteSnapshot();
    expect(snap.version).toBe("1.1");
    expect(DESIGN_PROTECTION_ABSOLUTE_VERSION).toBe("1.1");
    expect(snap.status).toBe(DESIGN_PROTECTION_ABSOLUTE_STATUS);
    expect(snap.equation).toBe(DESIGN_PROTECTION_EQUATION);
    expect(snap.absoluteRule).toBe(DESIGN_PROTECTION_ABSOLUTE_RULE);
    expect(snap.goldenRule).toBe(DESIGN_PROTECTION_GOLDEN_RULE);
    expect(DESIGN_PROTECTION_FORBIDDEN_SYSTEMS).toContain("Cursor Agents");
    expect(DESIGN_PROTECTION_FORBIDDEN_SYSTEMS).toContain("Full Width Engine");
    expect(DESIGN_PROTECTION_CANONICAL_FORBIDDEN).toContain("creating Balance v2");
    expect(DESIGN_PROTECTION_ENGINE_FORBIDDEN).toContain("redesign components");
    expect(snap.fullWidthDoesNotMean).toContain("redesign 100%");
    expect(snap.chain).toContain("DESIGN NEVER ADAPTS TO ENGINE");
  });

  it("ships Cursor rule + master-engine export", () => {
    const rule = readFileSync(
      join(process.cwd(), ".cursor/rules/design-protection-absolute-v1.mdc"),
      "utf8",
    );
    expect(rule).toContain("v1.1");
    expect(rule).toContain("PROTECT IT");
    expect(rule).toContain("shall never adapt to the Responsive Engine");
    const index = readFileSync(join(process.cwd(), "lib/master-engine/index.ts"), "utf8");
    expect(index).toContain("designProtectionAbsoluteSnapshot");
    expect(index).toContain("DESIGN_PROTECTION_GOLDEN_RULE");
  });
});
