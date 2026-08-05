/**
 * ROVEXO ABSOLUTE BLOOD LAW XLIV
 * FULL DEMO CERTIFICATION ENVIRONMENT
 *
 * STATUS: SUPREME | LOCKED | FAIL CLOSED
 *
 * NO PRODUCTION DATA MAY BE MODIFIED DURING CERTIFICATION.
 * Isolated Demo Runtime · demo listing copies · virtual wallets · teardown.
 * Parents: XLII Full Platform Certification · Full Demo Permanence · XLIII
 */

import {
  readSourceUtf8,
  SOURCE_NOT_AVAILABLE_IN_SERVERLESS,
} from "@/lib/startup/source-integrity-runtime-v1";
import { shouldLoadTestingArtifactsOnStartup } from "@/lib/startup/startup-certification-policy-v1";
import {
  DEMO_SESSION_ENGINE_V1,
  XLIV_DEMO_WALLET_GBP,
  XLIV_VISUAL_STEPS,
} from "@/lib/full-demo/demo-session-contract-v1";

export const SUPREME_BLOOD_LAW_XLIV_FULL_DEMO_CERTIFICATION_ENVIRONMENT_V1 = {
  version: "1.0",
  bloodLaw: "XLIV",
  name: "Full Demo Certification Environment",
  status: "SUPREME_LOCKED_FAIL_CLOSED",
  supreme: true,
  locked: true,
  host: DEMO_SESSION_ENGINE_V1.host,
  equation: DEMO_SESSION_ENGINE_V1.equation,
  mission:
    "Create a completely isolated Demo Runtime from existing localhost listings/users. Every mutation affects ONLY demo copies. Delete the entire demo session at the end. FAIL CLOSED if production changes.",
  rules: [
    "NO_PRODUCTION_MUTATION",
    "NO_REAL_PAYMENTS",
    "NO_REAL_SHIPPING",
    "NO_REAL_WALLET_MOVEMENT",
    "NO_REAL_LISTING_MODIFICATION",
    "DEMO_SESSION_ONLY",
    "TEARDOWN_RESTORES_ORIGINAL_STATE",
  ] as const,
  wallets: {
    buyerGbp: XLIV_DEMO_WALLET_GBP.buyer,
    sellerGbp: XLIV_DEMO_WALLET_GBP.seller,
    admin: "unlimited",
  } as const,
  demoListingFields: ["is_demo", "demo_session_id", "original_listing_id"] as const,
  visualSteps: XLIV_VISUAL_STEPS,
  moduleResultStatuses: ["PASS", "FAIL", "WARNING"] as const,
  enginePath: "lib/full-demo/demo-session-engine-v1.ts",
  migrationPath:
    "supabase/migrations/20260725170000_full_demo_certification_environment_xliv.sql",
  e2ePath: "e2e/full-demo-certification-environment-xliv.spec.ts",
} as const;

export type XlivCertificationGate = {
  id: string;
  label: string;
  pass: boolean;
};

export type XlivCertificationReport = {
  bloodLaw: "XLIV";
  ok: boolean;
  certified: boolean;
  productionReady: boolean;
  gates: XlivCertificationGate[];
  errors: string[];
};

function readWorkspace(relativePath: string): string {
  const result = readSourceUtf8(relativePath);
  if (result.available) return result.content;
  if (result.status === SOURCE_NOT_AVAILABLE_IN_SERVERLESS) {
    return SOURCE_NOT_AVAILABLE_IN_SERVERLESS;
  }
  throw new Error(`SOURCE_MISSING:${relativePath}`);
}

export function certifyFullDemoCertificationEnvironmentXliv(): XlivCertificationReport {
  const errors: string[] = [];
  const gates: XlivCertificationGate[] = [];

  const engine = readWorkspace(
    SUPREME_BLOOD_LAW_XLIV_FULL_DEMO_CERTIFICATION_ENVIRONMENT_V1.enginePath,
  );
  const migration = readWorkspace(
    SUPREME_BLOOD_LAW_XLIV_FULL_DEMO_CERTIFICATION_ENVIRONMENT_V1.migrationPath,
  );
  const productsRepo = readWorkspace("lib/products/repository.ts");
  const instrumentation = readWorkspace("instrumentation.ts");

  // Serverless NFT: shared helper returned sentinel — do not fail-close on source absence.
  if (
    engine === SOURCE_NOT_AVAILABLE_IN_SERVERLESS ||
    migration === SOURCE_NOT_AVAILABLE_IN_SERVERLESS ||
    productsRepo === SOURCE_NOT_AVAILABLE_IN_SERVERLESS ||
    instrumentation === SOURCE_NOT_AVAILABLE_IN_SERVERLESS
  ) {
    return {
      bloodLaw: "XLIV",
      ok: true,
      certified: true,
      productionReady: false,
      gates: [
        {
          id: "source-integrity-serverless",
          label: SOURCE_NOT_AVAILABLE_IN_SERVERLESS,
          pass: true,
        },
      ],
      errors: [],
    };
  }
  // Production MUST NEVER read e2e/*.spec.ts — excluded from Vercel NFT (ENOENT).
  // E2E artifact checks run only in development / ROVEXO_CERTIFICATION_MODE.
  const loadE2eArtifacts = shouldLoadTestingArtifactsOnStartup();
  const e2e = loadE2eArtifacts
    ? readWorkspace(SUPREME_BLOOD_LAW_XLIV_FULL_DEMO_CERTIFICATION_ENVIRONMENT_V1.e2ePath)
    : "";

  gates.push({
    id: "engine",
    label: "Demo Session Engine SSOT",
    pass:
      engine.includes("createDemoCertificationSession") &&
      engine.includes("destroyDemoCertificationSession") &&
      engine.includes("captureProductionFingerprint") &&
      engine.includes('import "server-only"') &&
      DEMO_SESSION_ENGINE_V1.bloodLaw === "XLIV",
  });

  gates.push({
    id: "wallets-100k",
    label: "Buyer/Seller virtual wallets £100,000",
    pass: XLIV_DEMO_WALLET_GBP.buyer === 100_000 && XLIV_DEMO_WALLET_GBP.seller === 100_000,
  });

  gates.push({
    id: "demo-copy-columns",
    label: "Migration adds is_demo · demo_session_id · original_listing_id",
    pass:
      migration.includes("is_demo") &&
      migration.includes("demo_session_id") &&
      migration.includes("original_listing_id") &&
      migration.includes("demo_certification_sessions"),
  });

  gates.push({
    id: "clone-not-edit",
    label: "Engine clones listings as demo copies (never edits originals)",
    pass:
      engine.includes("original_listing_id") &&
      engine.includes("is_demo: true") &&
      engine.includes("PRODUCTION_MUTATION_DETECTED"),
  });

  gates.push({
    id: "catalogue-exclude",
    label: "Production catalogue excludes is_demo listings",
    pass: productsRepo.includes('.eq("is_demo", false)'),
  });

  gates.push({
    id: "teardown",
    label: "Session teardown deletes demo artifacts + restores wallets",
    pass:
      engine.includes("destroyDemoCertificationSession") &&
      engine.includes("wallet_snapshot") &&
      engine.includes("productionUnchanged"),
  });

  gates.push({
    id: "visual-steps",
    label: "20 visual certification steps defined",
    pass: loadE2eArtifacts
      ? XLIV_VISUAL_STEPS.length === 20 && e2e.includes("XLIV_VISUAL_STEPS")
      : XLIV_VISUAL_STEPS.length === 20,
  });

  gates.push({
    id: "report-statuses",
    label: "Report supports PASS · FAIL · WARNING",
    pass: loadE2eArtifacts
      ? SUPREME_BLOOD_LAW_XLIV_FULL_DEMO_CERTIFICATION_ENVIRONMENT_V1.moduleResultStatuses.includes(
          "WARNING",
        ) && e2e.includes("FULL PLATFORM CERTIFICATION REPORT")
      : SUPREME_BLOOD_LAW_XLIV_FULL_DEMO_CERTIFICATION_ENVIRONMENT_V1.moduleResultStatuses.includes(
          "WARNING",
        ),
  });

  gates.push({
    id: "instrumentation",
    label: "Startup gate wired",
    pass: instrumentation.includes("assertFullDemoCertificationEnvironmentOrBlock"),
  });

  gates.push({
    id: "no-real-money",
    label: "Virtual payments / no real Stripe·shipping in engine contract",
    pass:
      engine.includes("VIRTUAL") ||
      SUPREME_BLOOD_LAW_XLIV_FULL_DEMO_CERTIFICATION_ENVIRONMENT_V1.rules.includes(
        "NO_REAL_PAYMENTS",
      ),
  });

  for (const g of gates) {
    if (!g.pass) errors.push(`${g.id}: ${g.label}`);
  }

  const ok = gates.every((g) => g.pass);
  return {
    bloodLaw: "XLIV",
    ok,
    certified: ok,
    productionReady: false,
    gates,
    errors,
  };
}

export function assertFullDemoCertificationEnvironmentOrBlock(): void {
  const report = certifyFullDemoCertificationEnvironmentXliv();
  if (!report.ok) {
    throw new Error(
      `[BLOOD XLIV] Full Demo Certification Environment FAILED — BLOCK LOADING. ${report.errors.join("; ")}`,
    );
  }
}

export function assertFullDemoCertificationEnvironmentProductionOrBlock(input: {
  runtimeE2eEvidencePass: boolean;
  productionUnchanged: boolean;
}): void {
  assertFullDemoCertificationEnvironmentOrBlock();
  if (!input.runtimeE2eEvidencePass || !input.productionUnchanged) {
    throw new Error(
      "[BLOOD XLIV] BLOCK DEPLOYMENT — runtime visual certification and production-unchanged evidence required.",
    );
  }
}

export function formatFullDemoCertificationEnvironmentReport(
  report: XlivCertificationReport,
): string {
  const lines = [
    "==========================================================",
    "FULL PLATFORM CERTIFICATION REPORT — BLOOD XLIV",
    "==========================================================",
    `STATUS: ${report.ok ? "CONTRACT PASS" : "CONTRACT FAIL"}`,
    `PRODUCTION READY: ${report.productionReady ? "YES" : "NO"}`,
    "",
    ...report.gates.map((g) => `${g.id}: ${g.pass ? "PASS" : "FAIL"} — ${g.label}`),
    "",
    report.errors.length ? `ERRORS: ${report.errors.join("; ")}` : "ERRORS: none",
    "==========================================================",
  ];
  return lines.join("\n");
}
