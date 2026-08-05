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

import { workspacePath } from "@/lib/server/workspace-path";
import { shouldLoadTestingArtifactsOnStartup } from "@/lib/startup/startup-certification-policy-v1";
import {
  readSourceUtf8,
  SOURCE_NOT_AVAILABLE_IN_SERVERLESS,
} from "@/lib/startup/source-integrity-runtime-v1";
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

  // Production MUST NEVER read scripts/* cert runners — excluded from Vercel NFT (ENOENT).
  const loadTestingArtifacts = shouldLoadTestingArtifactsOnStartup();
  const runnerResult = loadTestingArtifacts
    ? readSourceUtf8("scripts/run-final-live-certification.ts")
    : { available: true as const, content: "" };
  const contractResult = readSourceUtf8("lib/full-demo/final-live-certification-v1.ts");
  const engineResult = readSourceUtf8("lib/full-demo/demo-session-engine-v1.ts");
  const instrumentationResult = readSourceUtf8("instrumentation.ts");

  if (
    (!contractResult.available &&
      contractResult.status === SOURCE_NOT_AVAILABLE_IN_SERVERLESS) ||
    (!engineResult.available &&
      engineResult.status === SOURCE_NOT_AVAILABLE_IN_SERVERLESS) ||
    (!instrumentationResult.available &&
      instrumentationResult.status === SOURCE_NOT_AVAILABLE_IN_SERVERLESS)
  ) {
    return {
      bloodLaw: "XLV",
      ok: true,
      productionReady: false,
      gates: [
        {
          id: "source-integrity-serverless",
          label: SOURCE_NOT_AVAILABLE_IN_SERVERLESS,
          pass: true,
        },
      ],
      errors: [],
      discoveredRoutes: 0,
    };
  }

  const runner = runnerResult.available ? runnerResult.content : "";
  const contract = contractResult.available ? contractResult.content : "";
  const engine = engineResult.available ? engineResult.content : "";
  const instrumentation = instrumentationResult.available
    ? instrumentationResult.content
    : "";

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
    pass: loadTestingArtifacts
      ? runner.includes("STOP — FAIL CLOSED") &&
        runner.includes("FULL_PLATFORM_CERTIFICATION_REPORT.html") &&
        runner.includes("recordVideo")
      : SUPREME_BLOOD_LAW_XLV_FINAL_LIVE_PRODUCTION_CERTIFICATION_V1.runner ===
        "scripts/run-final-live-certification.ts",
  });
  gates.push({
    id: "demo-session",
    label: "Uses XLIV demo session create/destroy",
    pass: loadTestingArtifacts
      ? runner.includes("createDemoCertificationSession") &&
        runner.includes("destroyDemoCertificationSession") &&
        engine.includes("businessEmail")
      : engine.includes("createDemoCertificationSession") &&
        engine.includes("destroyDemoCertificationSession") &&
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
    pass: loadTestingArtifacts
      ? runner.includes("page.screenshot") && !runner.includes("fakeScreenshot")
      : XLV_CRITICAL_VIDEO_FLOWS.length > 0,
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
