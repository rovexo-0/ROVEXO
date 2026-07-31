/**
 * ROVEXO Phase D.2 — Live Deployment Certification (Post-Deploy).
 *
 * STATUS: BLOCKED · PREREQUISITES NOT MET · NO PRODUCTION LOCK
 *
 * Execute ONLY after Phase D PASS · Phase D.1 PASS · Owner GitHub Push ·
 * Owner Vercel Production Deploy. This phase does not deploy or lock.
 */

import { OWNER_PREVIEW_ORIGIN, PRODUCTION_ORIGIN } from "@/lib/preview/owner-preview-ssot";
import { phaseD1GoNoGo, phaseD1HasOpenOwnerGates } from "@/lib/phase-d1-live-production-certification-v1";
import { phaseDExternalBlockersOpen } from "@/lib/phase-d-production-preparation-v1";

export const PHASE_D2_LIVE_DEPLOYMENT_CERTIFICATION_V1 = {
  id: "phase-d2-live-deployment-certification-v1",
  version: "1.0.0",
  status: "BLOCKED",
  officialOrigin: OWNER_PREVIEW_ORIGIN,
  productionOrigin: PRODUCTION_ORIGIN,
  forbiddenWithoutFullPass: ["PRODUCTION_LOCK", "ROVEXO_V1_0_TAG", "RELEASE_ARCHIVE"] as const,

  /**
   * Gate evidence captured at Phase D.2 entry (2026-07-30).
   * Post-deploy tasks MUST NOT run until every prerequisite is PASS.
   */
  prerequisites: {
    phaseD: "NOT_PASS" as "PASS" | "NOT_PASS",
    phaseD1: "NOT_PASS" as "PASS" | "NOT_PASS",
    ownerGithubPushAuthorized: false,
    ownerVercelProductionDeployAuthorized: false,
    githubPushCompleted: false,
    vercelProductionDeployCompleted: false,
  },

  liveEvidenceAtEntry: {
    origin: "https://www.rovexo.co.uk",
    sitemapXmlRoot: "404",
    businessSellerTermsStillServed: "200",
    workspaceUncommittedPathsApprox: 186,
    headCommit: "18d64708",
    branch: "develop",
    aheadBehindOrigin: "0 0 (local dirty; certified Phases A–D.1 not pushed)",
  } as const,

  blockedReasons: [
    "PHASE_D_EXTERNAL_BLOCKERS_OPEN",
    "PHASE_D1_OWNER_GATES_OPEN",
    "PHASE_D1_GO_NO_GO_IS_NO_GO",
    "OWNER_GITHUB_PUSH_NOT_AUTHORIZED",
    "OWNER_VERCEL_PRODUCTION_DEPLOY_NOT_AUTHORIZED",
    "CERTIFIED_WORKSPACE_NOT_ON_LIVE",
    "GIT_WORKING_TREE_DIRTY",
  ] as const,
} as const;

export type PhaseD2LiveDeploymentCertificationV1 =
  typeof PHASE_D2_LIVE_DEPLOYMENT_CERTIFICATION_V1;

export function phaseD2PrerequisitesPass(): boolean {
  const p = PHASE_D2_LIVE_DEPLOYMENT_CERTIFICATION_V1.prerequisites;
  return (
    p.phaseD === "PASS" &&
    p.phaseD1 === "PASS" &&
    p.ownerGithubPushAuthorized &&
    p.ownerVercelProductionDeployAuthorized &&
    p.githubPushCompleted &&
    p.vercelProductionDeployCompleted &&
    !phaseDExternalBlockersOpen() &&
    !phaseD1HasOpenOwnerGates() &&
    phaseD1GoNoGo() === "GO"
  );
}

export function phaseD2GoNoGo(): "NO-GO" | "GO" {
  if (!phaseD2PrerequisitesPass()) return "NO-GO";
  if (PHASE_D2_LIVE_DEPLOYMENT_CERTIFICATION_V1.status === "BLOCKED") return "NO-GO";
  return "GO";
}

export function phaseD2ProductionLockAuthorized(): boolean {
  return false;
}
