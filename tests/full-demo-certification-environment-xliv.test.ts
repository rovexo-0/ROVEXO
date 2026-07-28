import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  SUPREME_BLOOD_LAW_XLIV_FULL_DEMO_CERTIFICATION_ENVIRONMENT_V1,
  certifyFullDemoCertificationEnvironmentXliv,
  assertFullDemoCertificationEnvironmentOrBlock,
  assertFullDemoCertificationEnvironmentProductionOrBlock,
  formatFullDemoCertificationEnvironmentReport,
} from "@/lib/supreme-blood-law-xliv-full-demo-certification-environment-v1";
import {
  DEMO_SESSION_ENGINE_V1,
  XLIV_DEMO_WALLET_GBP,
  XLIV_VISUAL_STEPS,
} from "@/lib/full-demo/demo-session-contract-v1";

describe("Absolute Blood Law XLIV — Full Demo Certification Environment", () => {
  it("locks XLIV contract: £100k wallets, 20 visual steps, no production mutation", () => {
    const law = SUPREME_BLOOD_LAW_XLIV_FULL_DEMO_CERTIFICATION_ENVIRONMENT_V1;
    expect(law.bloodLaw).toBe("XLIV");
    expect(DEMO_SESSION_ENGINE_V1.bloodLaw).toBe("XLIV");
    expect(XLIV_DEMO_WALLET_GBP.buyer).toBe(100_000);
    expect(XLIV_DEMO_WALLET_GBP.seller).toBe(100_000);
    expect(XLIV_DEMO_WALLET_GBP.business).toBe(100_000);
    expect(XLIV_VISUAL_STEPS).toHaveLength(20);
    expect(law.rules).toContain("NO_PRODUCTION_MUTATION");
    expect(law.demoListingFields).toEqual([
      "is_demo",
      "demo_session_id",
      "original_listing_id",
    ]);
    expect(law.moduleResultStatuses).toContain("WARNING");
  });

  it("keeps Demo Session Engine server-only and clones not edits", () => {
    const engine = readFileSync(
      path.join(process.cwd(), "lib/full-demo/demo-session-engine-v1.ts"),
      "utf8",
    );
    const barrel = readFileSync(path.join(process.cwd(), "lib/full-demo/index.ts"), "utf8");
    expect(engine).toContain('import "server-only"');
    expect(engine).toContain("createDemoCertificationSession");
    expect(engine).toContain("destroyDemoCertificationSession");
    expect(engine).toContain("is_demo: true");
    expect(engine).toContain("PRODUCTION_MUTATION_DETECTED");
    expect(barrel).not.toMatch(/export\s+\{[^}]*createDemoCertificationSession/);
  });

  it("passes XLIV certification gate and wires instrumentation", () => {
    const report = certifyFullDemoCertificationEnvironmentXliv();
    expect(report.ok, report.errors.join("; ")).toBe(true);
    expect(report.productionReady).toBe(false);
    expect(() => assertFullDemoCertificationEnvironmentOrBlock()).not.toThrow();
    expect(() =>
      assertFullDemoCertificationEnvironmentProductionOrBlock({
        runtimeE2eEvidencePass: false,
        productionUnchanged: true,
      }),
    ).toThrow(/BLOCK DEPLOYMENT/);
    expect(formatFullDemoCertificationEnvironmentReport(report)).toContain(
      "FULL PLATFORM CERTIFICATION REPORT",
    );

    const instrumentation = readFileSync(
      path.join(process.cwd(), "instrumentation.ts"),
      "utf8",
    );
    expect(instrumentation).toContain("assertFullDemoCertificationEnvironmentOrBlock");
  });
});
