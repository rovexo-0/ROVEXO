/**
 * ROVEXO Brand Integrity Runtime Hotfix v1.0
 *
 * Production serverless (Vercel NFT) does not ship application source `.tsx`/`.css`.
 * Startup brand blood laws must NEVER `readFileSync` crash or fatal-assert boot
 * when those sources are absent — log a warning and continue.
 *
 * Vitest / certification mode remain fail-closed (source tree present).
 */

import { existsSync, readFileSync } from "node:fs";
import { workspacePath } from "@/lib/server/workspace-path";

export const BRAND_INTEGRITY_RUNTIME_V1 = {
  version: "1.0",
  id: "brand-integrity-runtime-v1",
  policy: "warn-and-continue-on-serverless-source-prune",
} as const;

/**
 * True when brand source-integrity failures must not abort boot.
 * Vercel always soft-fails (NFT prunes sources). Production without source tree soft-fails.
 */
export function shouldSoftFailBrandIntegrityAtRuntime(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.ROVEXO_CERTIFICATION_MODE === "1" || env.ROVEXO_CERTIFICATION_MODE === "true") {
    return false;
  }
  if (env.ROVEXO_STARTUP_CERT_BLOCK === "1" || env.ROVEXO_STARTUP_CERT_BLOCK === "true") {
    return false;
  }
  // Vercel serverless / edge packaging — source .tsx not in /var/task
  // (checked before VITEST so production-simulation tests can set VERCEL=1)
  if (env.VERCEL === "1") {
    return true;
  }
  if (env.VITEST === "true" || env.VITEST === "1") {
    return false;
  }
  if (env.NODE_ENV === "production") {
    return !existsSync(
      workspacePath("components", "branding", "RovexoBrandLogo.tsx"),
    );
  }
  return false;
}

/** Safe source read — never throws ENOENT (returns empty string). */
export function readUtf8SourceOrEmpty(filePath: string): string {
  try {
    if (!existsSync(filePath)) return "";
    return readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

export function warnBrandIntegrityAndContinue(bloodLaw: string, errors: string[]): void {
  console.warn(
    [
      `[ROVEXO STARTUP] BLOOD ${bloodLaw} brand integrity soft-fail — warn and continue (never HTTP 500).`,
      `Policy: ${BRAND_INTEGRITY_RUNTIME_V1.id}`,
      ...errors.map((e) => ` - ${e}`),
    ].join("\n"),
  );
}

/** Detect NFT-pruned source tree open failures from instrumentation. */
export function isSourceTreeEnoentError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as NodeJS.ErrnoException & { message?: string };
  const pathHint = typeof err.path === "string" ? err.path : "";
  const message = typeof err.message === "string" ? err.message : String(error);
  const blob = `${pathHint}\n${message}`;
  const isEnoent =
    err.code === "ENOENT" ||
    message.includes("ENOENT") ||
    message.includes("no such file or directory");
  if (!isEnoent) return false;
  return (
    /\.(tsx|ts|css|mjs|js)$/i.test(blob) ||
    blob.includes("components/branding/") ||
    blob.includes("components/header/") ||
    blob.includes("features/auth/") ||
    blob.includes("styles/rovexo/")
  );
}
