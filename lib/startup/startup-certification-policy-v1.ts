/**
 * ROVEXO Startup Certification Policy v1.0
 *
 * Certification ALWAYS executes. Blocking is environment-aware only.
 *
 * Development (`npm run dev`):
 *   PASS → continue
 *   FAIL → log full report → continue (do not kill the server)
 *
 * Vercel Preview:
 *   PASS → continue
 *   FAIL → log / warn / collect evidence → continue boot (never fail-close)
 *
 * Production / Certification mode:
 *   PASS → continue
 *   FAIL → throw → block startup
 *
 * Testing artifacts (e2e/ · playwright · *.spec.ts · cert runners under scripts/):
 *   Load ONLY when NODE_ENV !== "production", or ROVEXO_CERTIFICATION_MODE is set.
 *   Production MUST NEVER readFileSync / import Playwright or E2E files (ENOENT on Vercel —
 *   outputFileTracingExcludes ships without ./e2e/** and ./scripts/**).
 *
 * Does not remove, skip, or weaken certification engines or assertions.
 */

export const STARTUP_CERTIFICATION_POLICY_V1 = {
  version: "1.1",
  id: "startup-certification-policy-v1",
  developmentOnFail: "log-and-continue",
  productionOnFail: "throw-and-block",
  certificationModeOnFail: "throw-and-block",
  testingArtifacts: "development-or-certification-mode-only",
} as const;

/**
 * True when startup may read Playwright / E2E / certification runner files from disk.
 * False in Production — those paths are excluded from the serverless bundle.
 */
export function shouldLoadTestingArtifactsOnStartup(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.ROVEXO_CERTIFICATION_MODE === "1" || env.ROVEXO_CERTIFICATION_MODE === "true") {
    return true;
  }
  // Production runtime (Vercel production / `next start`) — never touch e2e/scripts artifacts.
  if (env.NODE_ENV === "production") {
    return false;
  }
  // development · test (Vitest) · unset
  return true;
}

/**
 * True when a failed startup certification must abort process boot.
 * False in ordinary local development so `npm run dev` remains usable.
 */
export function shouldBlockStartupOnCertificationFailure(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  // Explicit Owner/ops overrides
  if (env.ROVEXO_STARTUP_CERT_BLOCK === "1" || env.ROVEXO_STARTUP_CERT_BLOCK === "true") {
    return true;
  }
  if (env.ROVEXO_STARTUP_CERT_BLOCK === "0" || env.ROVEXO_STARTUP_CERT_BLOCK === "false") {
    return false;
  }

  // Vercel Preview must boot for smoke. Local Full Platform XLII remains
  // localhost:3000-only (Absolute Localhost Certification). Instrumentation
  // runs Production Runtime XLII only; Preview still runs gates and logs
  // failures — it must not kill the serverless process.
  if (env.VERCEL_ENV === "preview") {
    return false;
  }

  if (env.NODE_ENV === "production") {
    return true;
  }

  // Certification / private-launch simulation remains fail-closed
  if (
    env.ROVEXO_LAUNCH_PRIVATE_MODE === "1" ||
    env.ROVEXO_LAUNCH_PRIVATE_MODE === "true" ||
    env.NEXT_PUBLIC_ROVEXO_LAUNCH_PRIVATE_MODE === "1" ||
    env.NEXT_PUBLIC_ROVEXO_LAUNCH_PRIVATE_MODE === "true" ||
    env.ROVEXO_CERTIFICATION_MODE === "1" ||
    env.ROVEXO_CERTIFICATION_MODE === "true"
  ) {
    return true;
  }

  return false;
}

export type StartupCertificationGateResult = {
  ok: boolean;
  blocked: boolean;
  label: string;
  error?: string;
};

/**
 * Run a startup certification assertion under the canonical policy.
 * The assertion function itself stays fail-closed (throws on FAIL).
 * This wrapper decides whether the throw aborts boot or is logged.
 */
export function runStartupCertificationGate(
  label: string,
  assertFn: () => void,
  env: NodeJS.ProcessEnv = process.env,
): StartupCertificationGateResult {
  try {
    assertFn();
    return { ok: true, blocked: false, label };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const mustBlock = shouldBlockStartupOnCertificationFailure(env);

    if (mustBlock) {
      throw error instanceof Error ? error : new Error(message);
    }

    console.error(
      [
        "",
        `[ROVEXO STARTUP CERTIFICATION] ${label} FAILED`,
        `Policy: ${STARTUP_CERTIFICATION_POLICY_V1.id}`,
        env.VERCEL_ENV === "preview"
          ? "Preview → log and continue (never fail-close)"
          : "Development → log and continue · Production / Certification → throw and block",
        message,
        "",
      ].join("\n"),
    );

    return { ok: false, blocked: false, label, error: message };
  }
}
