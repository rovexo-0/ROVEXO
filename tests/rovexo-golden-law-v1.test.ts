import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROVEXO_GOLDEN_LAW_V1 } from "@/lib/rovexo-golden-law-v1";
import { ABSOLUTE_MASTER_FREEZE_V1 } from "@/lib/absolute-master-freeze-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Golden Law v1.0 — LEVEL 8", () => {
  it("locks Owner-approved golden law status", () => {
    expect(ROVEXO_GOLDEN_LAW_V1.status).toBe("OWNER_APPROVED_LOCKED_FROZEN");
    expect(ROVEXO_GOLDEN_LAW_V1.approvedByOwner).toBe(true);
    expect(ROVEXO_GOLDEN_LAW_V1.freezeLocked).toBe(true);
    expect(ROVEXO_GOLDEN_LAW_V1.level).toBe(8);
    expect(ROVEXO_GOLDEN_LAW_V1.productionDeployForbiddenIfAnyGateFails).toBe(
      true,
    );
  });

  it("locks the six-step singularity chain", () => {
    expect(ROVEXO_GOLDEN_LAW_V1.chain).toHaveLength(6);
    expect(ROVEXO_GOLDEN_LAW_V1.chain[0]).toContain("ONE OWNER");
    expect(ROVEXO_GOLDEN_LAW_V1.chain[5]).toContain(
      "PRODUCTION DEPLOY IS FORBIDDEN",
    );
    expect(ROVEXO_GOLDEN_LAW_V1.equation).toContain("ONE OWNER");
    expect(ROVEXO_GOLDEN_LAW_V1.equation).toContain("ONE PRODUCTION GATE");
  });

  it("locks singularity examples for core domains", () => {
    expect(ROVEXO_GOLDEN_LAW_V1.singularityExamples.header.allowed).toBe(
      "ONE HEADER",
    );
    expect(ROVEXO_GOLDEN_LAW_V1.singularityExamples.search.forbidden).toBe(
      "2 SEARCH ENGINES",
    );
    expect(ROVEXO_GOLDEN_LAW_V1.singularityExamples.auth.allowed).toBe(
      "ONE AUTH SYSTEM",
    );
    expect(ROVEXO_GOLDEN_LAW_V1.singularityExamples.session.allowed).toBe(
      "ONE SESSION OWNER",
    );
    expect(ROVEXO_GOLDEN_LAW_V1.singularityExamples.database.allowed).toBe(
      "ONE DATABASE OWNER",
    );
    expect(ROVEXO_GOLDEN_LAW_V1.singularityExamples.payments.allowed).toBe(
      "ONE PAYMENT OWNER",
    );
  });

  it("forbids v2/v3/Pro/Manager evolution forks", () => {
    expect(ROVEXO_GOLDEN_LAW_V1.evolutionForbidden).toContain("Header v2");
    expect(ROVEXO_GOLDEN_LAW_V1.evolutionForbidden).toContain("Search Pro");
    expect(ROVEXO_GOLDEN_LAW_V1.evolutionForbidden).toContain("Auth v5");
    expect(ROVEXO_GOLDEN_LAW_V1.evolutionForbidden).toContain("Session Manager");
    expect(ROVEXO_GOLDEN_LAW_V1.evolutionAllowed.pattern).toBe(
      "FEATURE → optimized",
    );
  });

  it("locks remove-until-one and principle ladder", () => {
    expect(ROVEXO_GOLDEN_LAW_V1.finalRule.removeUntilOneRemains).toContain(
      "duplicated code",
    );
    expect(ROVEXO_GOLDEN_LAW_V1.principle[0]).toBe("SIMPLER");
    expect(ROVEXO_GOLDEN_LAW_V1.principle.at(-1)).toBe("MORE LONGEVITY");
  });

  it("links Absolute Master Freeze and cursor rule on disk", () => {
    expect(ABSOLUTE_MASTER_FREEZE_V1.freezeLocked).toBe(true);
    expect(existsSync(join(process.cwd(), ROVEXO_GOLDEN_LAW_V1.ssot.law))).toBe(
      true,
    );
    expect(
      existsSync(join(process.cwd(), ROVEXO_GOLDEN_LAW_V1.ssot.absoluteFreeze)),
    ).toBe(true);
    const rule = readSource(".cursor/rules/rovexo-golden-law-v1.mdc");
    expect(rule).toContain("GOLDEN LAW");
    expect(rule).toContain("PRODUCTION DEPLOY");
  });
});
