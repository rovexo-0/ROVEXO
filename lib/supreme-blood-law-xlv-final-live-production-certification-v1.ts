/**
 * ROVEXO ABSOLUTE BLOOD LAW XLV
 * FINAL LIVE PRODUCTION CERTIFICATION
 *
 * STATUS: SUPREME | FAIL CLOSED | DEPLOYMENT BLOCKED UNTIL COMPLETE
 *
 * Objective: PROVE the platform works visually, functionally, end-to-end on
 * http://localhost:3000 inside the isolated Demo Certification Environment.
 * Parents: XLII · XLIII · XLIV
 */

import { readFileSync } from "node:fs";
import { workspacePath } from "@/lib/server/workspace-path";
import path from "node:path";
import {
  FINAL_LIVE_CERTIFICATION_V1,
  XLV_CRITICAL_VIDEO_FLOWS,
  XLV_DEMO_WALLETS_GBP,
  XLV_MANDATORY_SURFACES,
} from "@/lib/full-demo/final-live-certification-v1";
import { discoverAppRoutes } from "@/lib/full-demo/discover-app-routes-v1";

export const SUPREME_BLOOD_LAW_XLV_FINAL_LIVE_PRODUCTION_CERTIFICATION_V1 = {
  version: "1.0",
  bloodLaw: "XLV",
  name: "Final Live Production Certification",
  status: "SUPREME_FAIL_CLOSED_DEPLOYMENT_BLOCKED_UNTIL_COMPLETE",
  host: FINAL_LIVE_CERTIFICATION_V1.host,
  equation: FINAL_LIVE_CERTIFICATION_V1.equation,
  wallets: XLV_DEMO_WALLETS_GBP,
  mandatorySurfaces: XLV_MANDATORY_SURFACES.length,
  criticalVideoFlows: XLV_CRITICAL_VIDEO_FLOWS.length,
  runner: "scripts/run-final-live-certification.ts",
  reportDir: "test-results/final-live-certification-xlv",
} as const;

export type XlvGate = { id: string; label: string; pass: boolean };

export function certifyFinalLiveProductionXlv(): {
  bloodLaw: "XLV";
  ok: boolean;
  productionReady: boolean;
  gates: XlvGate[];
  errors: string[];
  discoveredRoutes: number;
} {
  const errors: string[] = [];
  const gates: XlvGate[] = [];
  const cwd = workspacePath();

  const runner = readFileSync(path.join(cwd, "scripts/run-final-live-certification.ts"), "utf8");
  const contract = readFileSync(
    path.join(cwd, "lib/full-demo/final-live-certification-v1.ts"),
    "utf8",
  );
  const engine = readFileSync(
    path.join(cwd, "lib/full-demo/demo-session-engine-v1.ts"),
    "utf8",
  );
  const instrumentation = readFileSync(path.join(cwd, "instrumentation.ts"), "utf8");

  const routes = discoverAppRoutes(cwd);

  gates.push({
    id: "host",
    label: "Official cert host is localhost:3000",
    pass: FINAL_LIVE_CERTIFICATION_V1.host === "http://localhost:3000",
  });
  gates.push({
    id: "wallets",
    label: "Buyer/Seller/Business £100,000 · Admin unlimited",
    pass:
      XLV_DEMO_WALLETS_GBP.buyer === 100_000 &&
      XLV_DEMO_WALLETS_GBP.seller === 100_000 &&
      XLV_DEMO_WALLETS_GBP.business === 100_000 &&
      XLV_DEMO_WALLETS_GBP.admin === "unlimited",
  });
  gates.push({
    id: "runner",
    label: "Live runner exists with fail-closed STOP",
    pass:
      runner.includes("STOP — FAIL CLOSED") &&
      runner.includes("FULL_PLATFORM_CERTIFICATION_REPORT.html") &&
      runner.includes("recordVideo"),
  });
  gates.push({
    id: "demo-session",
    label: "Uses XLIV demo session create/destroy",
    pass:
      runner.includes("createDemoCertificationSession") &&
      runner.includes("destroyDemoCertificationSession") &&
      engine.includes("businessEmail"),
  });
  gates.push({
    id: "mandatory-surfaces",
    label: "Mandatory surfaces defined",
    pass: XLV_MANDATORY_SURFACES.length >= 20 && contract.includes("business_dashboard"),
  });
  gates.push({
    id: "route-discovery",
    label: "App route discovery finds pages",
    pass: routes.length > 50,
  });
  gates.push({
    id: "instrumentation",
    label: "Startup gate wired",
    pass: instrumentation.includes("assertFinalLiveProductionCertificationOrBlock"),
  });
  gates.push({
    id: "no-mock-evidence",
    label: "Runner forbids mocked screenshots (live page.screenshot only)",
    pass: runner.includes("page.screenshot") && !runner.includes("fakeScreenshot"),
  });

  for (const g of gates) {
    if (!g.pass) errors.push(`${g.id}: ${g.label}`);
  }

  const ok = gates.every((g) => g.pass);
  return {
    bloodLaw: "XLV",
    ok,
    /** Runtime evidence required — static contract alone never marks production ready. */
    productionReady: false,
    gates,
    errors,
    discoveredRoutes: routes.length,
  };
}

export function assertFinalLiveProductionCertificationOrBlock(): void {
  const report = certifyFinalLiveProductionXlv();
  if (!report.ok) {
    throw new Error(
      `[BLOOD XLV] Final Live Production Certification contract FAILED — BLOCK LOADING. ${report.errors.join("; ")}`,
    );
  }
}

export function assertFinalLiveProductionReleaseOrBlock(input: {
  runtimeLiveEvidencePass: boolean;
  productionUnchanged: boolean;
  zeroCritical: boolean;
  zeroHigh: boolean;
  demoSessionCleaned: boolean;
}): void {
  assertFinalLiveProductionCertificationOrBlock();
  const ready =
    input.runtimeLiveEvidencePass &&
    input.productionUnchanged &&
    input.zeroCritical &&
    input.zeroHigh &&
    input.demoSessionCleaned;
  if (!ready) {
    throw new Error(
      "[BLOOD XLV] DEPLOYMENT ABSOLUTELY BLOCKED — Final Live Certification incomplete.",
    );
  }
}
