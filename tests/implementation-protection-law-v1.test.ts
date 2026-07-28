import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  IMPLEMENTATION_PROTECTION_ABSOLUTE_RULE,
  IMPLEMENTATION_PROTECTION_ALLOWED,
  IMPLEMENTATION_PROTECTION_FIVE_QUESTIONS,
  IMPLEMENTATION_PROTECTION_FORBIDDEN,
  IMPLEMENTATION_PROTECTION_GOLDEN_RULE,
  IMPLEMENTATION_PROTECTION_LAW_LEVEL,
  IMPLEMENTATION_PROTECTION_LAW_STATUS,
  IMPLEMENTATION_PROTECTION_LAW_VERSION,
  IMPLEMENTATION_PROTECTION_NO_REGRESSION_RULE,
  IMPLEMENTATION_PROTECTION_OPTIMIZE_FIRST_QUESTION,
  implementationProtectionLawSnapshot,
} from "@/lib/master-engine/implementation-protection-law-v1";

describe("Implementation Protection Law v1.1", () => {
  it("locks whole-implementation protection + five questions", () => {
    const snap = implementationProtectionLawSnapshot();
    expect(snap.version).toBe("1.1");
    expect(IMPLEMENTATION_PROTECTION_LAW_VERSION).toBe("1.1");
    expect(snap.level).toBe(8);
    expect(IMPLEMENTATION_PROTECTION_LAW_LEVEL).toBe(8);
    expect(snap.status).toBe(IMPLEMENTATION_PROTECTION_LAW_STATUS);
    expect(snap.goldenRule).toBe(IMPLEMENTATION_PROTECTION_GOLDEN_RULE);
    expect(snap.absoluteRule).toBe(IMPLEMENTATION_PROTECTION_ABSOLUTE_RULE);
    expect(snap.noRegressionRule).toBe(IMPLEMENTATION_PROTECTION_NO_REGRESSION_RULE);
    expect(snap.optimizeFirstQuestion).toBe(
      IMPLEMENTATION_PROTECTION_OPTIMIZE_FIRST_QUESTION,
    );
    expect(IMPLEMENTATION_PROTECTION_FIVE_QUESTIONS).toHaveLength(5);
    expect(IMPLEMENTATION_PROTECTION_FIVE_QUESTIONS[0]?.ifNo).toBe("STOP");
    expect(IMPLEMENTATION_PROTECTION_FORBIDDEN).toContain("duplicate it");
    expect(IMPLEMENTATION_PROTECTION_FORBIDDEN).toContain(
      "create duplicated engines",
    );
    expect(IMPLEMENTATION_PROTECTION_ALLOWED).toContain("optimization in place");
    expect(snap.integrity).toContain("Financial Logic");
    expect(snap.fiveAbsolute).toContain("100/100 ONLY");
    expect(snap.fourGolden).toContain("OPTIMIZE BEFORE REBUILD");
  });

  it("ships Cursor rule + master-engine export", () => {
    const rule = readFileSync(
      join(process.cwd(), ".cursor/rules/implementation-protection-law-v1.mdc"),
      "utf8",
    );
    expect(rule).toContain("v1.1");
    expect(rule).toContain("Root cause?");
    expect(rule).toContain("Better or identical");
    const index = readFileSync(join(process.cwd(), "lib/master-engine/index.ts"), "utf8");
    expect(index).toContain("implementationProtectionLawSnapshot");
    expect(index).toContain("IMPLEMENTATION_PROTECTION_FIVE_QUESTIONS");
  });
});
