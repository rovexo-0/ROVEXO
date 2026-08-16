import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ROVEXO_APP_VERSION,
  ROVEXO_RELEASE_CODE,
  ROVEXO_RELEASE_LABEL,
  ROVEXO_SW_CACHE_NAME,
} from "@/lib/app/version";
import {
  ROVEXO_V1_RC1_FREEZE_V1,
  rc1IsCodeFreezeActive,
  rc1IsMasterCodeFreezeActive,
  rc1IsStructurallyFrozen,
} from "@/lib/release/rovexo-v1-rc1-freeze-v1";
import {
  RC1_INFRASTRUCTURE_CLASSIFICATION_V1,
  RC1_OPTIONAL_INFRA_SERVICES,
  RC1_REQUIRED_INFRA_SERVICES,
} from "@/lib/ops/rc1-infrastructure-classification-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO v1.0.0 RC1 — Master Code Freeze Certificate", () => {
  it("aligns package · SSOT · SW cache · release label", () => {
    expect(ROVEXO_APP_VERSION).toBe("1.0.0-rc.1");
    expect(ROVEXO_RELEASE_CODE).toBe("RC1");
    expect(ROVEXO_RELEASE_LABEL).toContain("Release Candidate 1");
    expect(ROVEXO_SW_CACHE_NAME).toBe("rovexo-static-v17");
    expect(JSON.parse(readSource("package.json")).version).toBe(ROVEXO_APP_VERSION);
    expect(readSource("public/sw.js")).toContain(ROVEXO_SW_CACHE_NAME);
    expect(readSource("lib/app/version.ts")).toContain(ROVEXO_APP_VERSION);
  });

  it("records MASTER CODE FREEZE ACTIVE and Owner certificate surfaces", () => {
    expect(rc1IsStructurallyFrozen()).toBe(true);
    expect(rc1IsCodeFreezeActive()).toBe(true);
    expect(rc1IsMasterCodeFreezeActive()).toBe(true);
    expect(ROVEXO_V1_RC1_FREEZE_V1.status).toBe("MASTER_CODE_FREEZE_ACTIVE");
    expect(ROVEXO_V1_RC1_FREEZE_V1.masterCodeFreeze).toBe("ACTIVE");
    expect(ROVEXO_V1_RC1_FREEZE_V1.development).toBe("COMPLETE");
    expect(ROVEXO_V1_RC1_FREEZE_V1.releaseCandidate).toBe("RC1");
    expect(ROVEXO_V1_RC1_FREEZE_V1.releasePackage).toBe("READY");
    expect(ROVEXO_V1_RC1_FREEZE_V1.infrastructure).toBe("PASS");
    expect(ROVEXO_V1_RC1_FREEZE_V1.frozenModules).toContain("Homepage");
    expect(ROVEXO_V1_RC1_FREEZE_V1.frozenModules).toContain("Admin Command Centre");
    expect(ROVEXO_V1_RC1_FREEZE_V1.frozenModules).toContain("Super Admin Command Centre");
    expect(ROVEXO_V1_RC1_FREEZE_V1.frozenModules).toContain("Unified White Theme");
    expect(ROVEXO_V1_RC1_FREEZE_V1.frozenModules).toContain("Profile Footer Banner");
    expect(ROVEXO_V1_RC1_FREEZE_V1.frozenModules).toContain("Health Engine");
    expect(ROVEXO_V1_RC1_FREEZE_V1.frozenModules).toContain("Infrastructure Classification SSOT");
    expect(ROVEXO_V1_RC1_FREEZE_V1.frozenModules).toContain("Rovexo Ideas UI");
    expect(ROVEXO_V1_RC1_FREEZE_V1.forbiddenUntilOwnerApproval).toEqual([
      "GITHUB_PUSH",
      "VERCEL_PRODUCTION_DEPLOY",
      "PRODUCTION_LOCK",
      "GIT_TAG_V1_0_0",
    ]);
    expect(ROVEXO_V1_RC1_FREEZE_V1.meta.productionLock).toBe(false);
    expect(ROVEXO_V1_RC1_FREEZE_V1.deferredToNextCycle).toContain(
      "Google OAuth live configuration (RC1-OD-001)",
    );
    expect(ROVEXO_V1_RC1_FREEZE_V1.deferredToNextCycle).toContain(
      "Apple OAuth live configuration (RC1-OD-001)",
    );
    expect(ROVEXO_V1_RC1_FREEZE_V1.qualityGatesRecorded.HealthEngine).toBe("PASS");
  });

  it("keeps RC1 infrastructure classification SSOT aligned", () => {
    expect(RC1_INFRASTRUCTURE_CLASSIFICATION_V1.id).toBe("rc1-infrastructure-classification-v1");
    expect([...RC1_REQUIRED_INFRA_SERVICES]).toEqual([
      "api",
      "database",
      "storage",
      "authentication",
      "stripe",
    ]);
    expect(RC1_OPTIONAL_INFRA_SERVICES).toContain("redis");
    expect(RC1_OPTIONAL_INFRA_SERVICES).toContain("email");
    expect(ROVEXO_V1_RC1_FREEZE_V1.infrastructureClassification.noFalseAlarms).toBe(true);
    expect(ROVEXO_V1_RC1_FREEZE_V1.infrastructureClassification.ssot).toBe(
      "lib/ops/rc1-infrastructure-classification-v1.ts",
    );
  });

  it("ships RC1 documentation set including Master Code Freeze Certificate", () => {
    for (const rel of Object.values(ROVEXO_V1_RC1_FREEZE_V1.documentation)) {
      if (rel === "docs/releases/rc1") {
        expect(existsSync(join(process.cwd(), rel))).toBe(true);
        continue;
      }
      expect(existsSync(join(process.cwd(), rel)), rel).toBe(true);
      expect(readSource(rel).length).toBeGreaterThan(100);
    }
    const cert = readSource("docs/releases/rc1/CODE_FREEZE_CERTIFICATE.md");
    expect(cert).toContain("MASTER CODE FREEZE ACTIVE");
    expect(cert).toContain("Health Engine");
  });

  it("references RC1 version from PWA manifest source", () => {
    const manifest = readSource("app/manifest.ts");
    expect(manifest).toContain("ROVEXO_APP_VERSION");
    expect(manifest).toContain("ROVEXO_RELEASE_CODE");
  });
});
