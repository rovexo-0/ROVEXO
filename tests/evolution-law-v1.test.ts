import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EVOLUTION_LAW_ABSOLUTE_RULE,
  EVOLUTION_LAW_GOLDEN_PRINCIPLE,
  EVOLUTION_LAW_MASTER_EQUATION,
  EVOLUTION_LAW_NEVER_BY,
  EVOLUTION_LAW_PATH,
  EVOLUTION_LAW_QUESTIONS,
  EVOLUTION_LAW_STATUS,
  EVOLUTION_LAW_VERSION,
  evolutionLawSnapshot,
} from "@/lib/master-engine/evolution-law-v1";

describe("Evolution Law v1.0", () => {
  it("locks in-place evolution gate order", () => {
    const snap = evolutionLawSnapshot();
    expect(snap.version).toBe("1.0");
    expect(EVOLUTION_LAW_VERSION).toBe("1.0");
    expect(snap.status).toBe(EVOLUTION_LAW_STATUS);
    expect(snap.absoluteRule).toBe(EVOLUTION_LAW_ABSOLUTE_RULE);
    expect(snap.masterEquation).toBe(EVOLUTION_LAW_MASTER_EQUATION);
    expect(EVOLUTION_LAW_PATH).toEqual([
      "PROTECT",
      "OPTIMIZE",
      "ADAPT",
      "SIMPLIFY",
      "CERTIFY",
      "DEPLOY",
    ]);
    expect(EVOLUTION_LAW_QUESTIONS).toHaveLength(5);
    expect(EVOLUTION_LAW_QUESTIONS[0]?.question).toBe("DOES IT ALREADY EXIST?");
    expect(EVOLUTION_LAW_QUESTIONS[4]?.no).toBe("DO NOT CREATE IT");
    expect(EVOLUTION_LAW_NEVER_BY).toContain("duplication");
    expect(EVOLUTION_LAW_NEVER_BY).toContain("parallel implementations");
    expect(EVOLUTION_LAW_GOLDEN_PRINCIPLE[0]).toContain("PROTECT IT");
    expect(snap.failExamples.some((e) => e.includes("Wallet v2"))).toBe(true);
    expect(snap.passExamples.some((e) => e.includes("same implementation"))).toBe(
      true,
    );
  });

  it("ships Cursor rule + master-engine export", () => {
    const rule = readFileSync(
      join(process.cwd(), ".cursor/rules/evolution-law-v1.mdc"),
      "utf8",
    );
    expect(rule).toContain("PROTECT → OPTIMIZE → ADAPT → SIMPLIFY");
    expect(rule).toContain("Does it already exist?");
    const index = readFileSync(join(process.cwd(), "lib/master-engine/index.ts"), "utf8");
    expect(index).toContain("evolutionLawSnapshot");
  });
});
