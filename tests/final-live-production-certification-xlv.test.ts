import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  SUPREME_BLOOD_LAW_XLV_FINAL_LIVE_PRODUCTION_CERTIFICATION_V1,
  certifyFinalLiveProductionXlv,
  assertFinalLiveProductionCertificationOrBlock,
  assertFinalLiveProductionReleaseOrBlock,
} from "@/lib/supreme-blood-law-xlv-final-live-production-certification-v1";
import { discoverAppRoutes } from "@/lib/full-demo/discover-app-routes-v1";
import { XLV_DEMO_WALLETS_GBP } from "@/lib/full-demo/final-live-certification-v1";

describe("Absolute Blood Law XLV — Final Live Production Certification", () => {
  it("locks final live certification contract", () => {
    const law = SUPREME_BLOOD_LAW_XLV_FINAL_LIVE_PRODUCTION_CERTIFICATION_V1;
    expect(law.bloodLaw).toBe("XLV");
    expect(law.host).toBe("http://localhost:3000");
    expect(XLV_DEMO_WALLETS_GBP.business).toBe(100_000);
    expect(law.mandatorySurfaces).toBeGreaterThanOrEqual(20);
    expect(discoverAppRoutes().length).toBeGreaterThan(50);
  });

  it("passes XLV contract gate and wires instrumentation", () => {
    const report = certifyFinalLiveProductionXlv();
    expect(report.ok, report.errors.join("; ")).toBe(true);
    expect(report.productionReady).toBe(false);
    expect(() => assertFinalLiveProductionCertificationOrBlock()).not.toThrow();
    expect(() =>
      assertFinalLiveProductionReleaseOrBlock({
        runtimeLiveEvidencePass: false,
        productionUnchanged: true,
        zeroCritical: true,
        zeroHigh: true,
        demoSessionCleaned: true,
      }),
    ).toThrow(/DEPLOYMENT ABSOLUTELY BLOCKED/);

    const instrumentation = readFileSync(
      path.join(process.cwd(), "instrumentation.ts"),
      "utf8",
    );
    expect(instrumentation).toContain("assertFinalLiveProductionCertificationOrBlock");
  });
});
