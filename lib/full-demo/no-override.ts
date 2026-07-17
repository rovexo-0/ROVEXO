/**
 * ROVEXO v1.0 — No Manual Override Contract (permanent).
 *
 * Super Admin, Product Owner, Staff, Developers, Deployment Center, Vercel,
 * CI/CD, and Release Actions are NEVER allowed to override certification or
 * deployment gates. Exactly 100% pass is the only deployable state.
 */

export const RELEASE_PROTECTION_NO_OVERRIDE_VERSION = "v1.0" as const;

/** Payload / query keys that must never authorize a live release. */
export const FORBIDDEN_DEPLOYMENT_OVERRIDE_KEYS = [
  "force",
  "forceDeploy",
  "force_deploy",
  "deployAnyway",
  "deploy_anyway",
  "skipTests",
  "skip_tests",
  "skipGates",
  "skip_gates",
  "skipCertification",
  "skip_certification",
  "ignoreFailures",
  "ignore_failures",
  "disableGates",
  "disable_gates",
  "disableCertification",
  "disable_certification",
  "overrideFailures",
  "override_failures",
  "bypass",
  "bypassContracts",
  "bypass_contracts",
  "bypassCertification",
  "bypass_certification",
  "override",
  "overrideGates",
  "override_gates",
] as const;

/** Environment variables that must never authorize a live release. */
export const FORBIDDEN_DEPLOYMENT_OVERRIDE_ENV = [
  "ROVEXO_FORCE_DEPLOY",
  "ROVEXO_DEPLOY_ANYWAY",
  "ROVEXO_SKIP_TESTS",
  "ROVEXO_SKIP_GATES",
  "ROVEXO_SKIP_CERTIFICATION",
  "ROVEXO_IGNORE_FAILURES",
  "ROVEXO_DISABLE_GATES",
  "ROVEXO_DISABLE_CERTIFICATION",
  "ROVEXO_OVERRIDE_FAILURES",
  "ROVEXO_BYPASS_CONTRACTS",
  "ROVEXO_BYPASS_CERTIFICATION",
  "VERCEL_FORCE_NO_BUILD_CACHE_SKIP_CERT",
] as const;

export class ReleaseOverrideForbiddenError extends Error {
  constructor(detail: string) {
    super(
      `[RELEASE PROTECTION] Manual override forbidden. ${detail} ` +
        "Only 100% PASS + CERTIFIED + PROTECTED + NO BLOCKERS allows live deployment.",
    );
    this.name = "ReleaseOverrideForbiddenError";
  }
}

function isTruthyOverride(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "number" && value !== 0) return true;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
  }
  return false;
}

/** Reject any deploy payload that attempts to force, skip, or bypass gates. */
export function assertNoDeploymentOverridePayload(
  payload: Record<string, unknown> | null | undefined,
): void {
  if (!payload) return;
  for (const key of FORBIDDEN_DEPLOYMENT_OVERRIDE_KEYS) {
    if (!(key in payload)) continue;
    if (isTruthyOverride(payload[key])) {
      throw new ReleaseOverrideForbiddenError(`Payload key "${key}" is not allowed.`);
    }
    // Presence of an override key is itself forbidden, even when false/null.
    throw new ReleaseOverrideForbiddenError(`Payload key "${key}" is permanently banned.`);
  }
}

/** Reject env-based attempts to skip certification or force deploy. */
export function assertNoDeploymentOverrideEnv(
  env: NodeJS.ProcessEnv = process.env,
): void {
  for (const key of FORBIDDEN_DEPLOYMENT_OVERRIDE_ENV) {
    if (isTruthyOverride(env[key])) {
      throw new ReleaseOverrideForbiddenError(`Environment variable "${key}" is not allowed.`);
    }
  }
}

export function assertReleaseProtectionNoOverride(input?: {
  payload?: Record<string, unknown> | null;
  env?: NodeJS.ProcessEnv;
}): void {
  assertNoDeploymentOverrideEnv(input?.env);
  assertNoDeploymentOverridePayload(input?.payload);
}

/** Exactly 100% is the only deployable score. */
export function isExactHundredPercentPass(passPercent: number, allPassed: boolean): boolean {
  return allPassed === true && passPercent === 100;
}
