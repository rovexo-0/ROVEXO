/**
 * ROVEXO Source Integrity Runtime v1.0 — SINGLE architectural SSOT
 *
 * Serverless (Vercel NFT) does not ship monorepo source (*.ts / *.tsx / *.css).
 * Blood Law startup certification MUST NEVER abort boot with HTTP 500 for
 * source-tree ENOENT / missing-file assertions caused by NFT pruning.
 *
 * Covers Blood Laws XXXVII–XLV through ONE helper consumed by the startup gate
 * (and by brand/source readers). Not a per-law soft-fail fork.
 *
 * NEVER suppresses: database · Stripe · Supabase · env · security · permission ·
 * schema · runtime business logic failures.
 */

import { existsSync, readFileSync } from "node:fs";
import { workspacePath } from "@/lib/server/workspace-path";

export const SOURCE_INTEGRITY_RUNTIME_V1 = {
  version: "1.0",
  id: "source-integrity-runtime-v1",
  policy: "warn-and-continue-on-serverless-source-prune",
} as const;

/** Sentinel returned when source files are absent under NFT prune. */
export const SOURCE_NOT_AVAILABLE_IN_SERVERLESS =
  "SOURCE_NOT_AVAILABLE_IN_SERVERLESS" as const;

export type SourceNotAvailableInServerless =
  typeof SOURCE_NOT_AVAILABLE_IN_SERVERLESS;

export type SourceReadResult =
  | { available: true; content: string }
  | { available: false; status: SourceNotAvailableInServerless | "SOURCE_MISSING" };

/** Probe file: present in monorepo checkout, absent from typical Vercel /var/task NFT. */
const SOURCE_TREE_PROBE = [
  "features",
  "inbox",
  "components",
  "ConversationHub.tsx",
] as const;

let didLogStructuredWarning = false;

/**
 * True when source-tree Blood Law verification must not abort serverless boot.
 * Vercel always skips. Production without monorepo sources skips.
 * Certification mode / explicit block remain fail-closed.
 */
export function shouldSkipSourceTreeVerificationAtRuntime(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.ROVEXO_CERTIFICATION_MODE === "1" || env.ROVEXO_CERTIFICATION_MODE === "true") {
    return false;
  }
  if (env.ROVEXO_STARTUP_CERT_BLOCK === "1" || env.ROVEXO_STARTUP_CERT_BLOCK === "true") {
    return false;
  }
  // Vercel serverless packaging — source .ts/.tsx/.css not in /var/task
  // (checked before VITEST so production-simulation tests can set VERCEL=1)
  if (env.VERCEL === "1" || env.VERCEL === "true") {
    return true;
  }
  if (env.VITEST === "true" || env.VITEST === "1") {
    return false;
  }
  // Local/prod `next start` without a monorepo source tree (NFT-like layout)
  if (env.NODE_ENV === "production" && !isSourceTreeAvailable()) {
    return true;
  }
  return false;
}

/** @deprecated Prefer shouldSkipSourceTreeVerificationAtRuntime — brand alias. */
export function shouldSoftFailBrandIntegrityAtRuntime(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return shouldSkipSourceTreeVerificationAtRuntime(env);
}

/** True when monorepo source files needed for Blood Law disk scans exist. */
export function isSourceTreeAvailable(): boolean {
  return existsSync(workspacePath(...SOURCE_TREE_PROBE));
}

/**
 * Path is inside the application source tree (not node_modules, not arbitrary data).
 * Relative or absolute paths accepted.
 */
export function isSourceTreePath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  if (
    normalized.includes("node_modules/") ||
    normalized.includes("/node_modules/")
  ) {
    return false;
  }
  if (/\.(tsx?|jsx?|mjs|cjs|css|module\.css|sql)\b/i.test(normalized)) {
    return true;
  }
  return (
    /(^|\/)(app|components|features|lib|src|styles|supabase\/migrations)(\/|$)/i.test(
      normalized,
    ) ||
    /(^|\/)instrumentation\.ts$/i.test(normalized) ||
    /(^|\/)middleware\.ts$/i.test(normalized)
  );
}

/**
 * Startup gate labels for Blood Laws that certify by reading source trees.
 * Matched against instrumentation `runStartupCertificationGate("BLOOD …")` labels.
 */
export function isSourceIntegrityBloodLawLabel(label: string): boolean {
  return /\bBLOOD\s+(XXXVII|XXXVIII|XXXIX|XL|XLI|XLII|XLIII|XLIV|XLV)\b/i.test(
    label,
  );
}

/**
 * Exactly one structured warning per process for serverless source prune.
 */
export function warnSourceIntegrityServerlessOnce(detail?: string): void {
  if (didLogStructuredWarning) return;
  didLogStructuredWarning = true;
  console.warn(
    JSON.stringify({
      level: "warn",
      event: SOURCE_NOT_AVAILABLE_IN_SERVERLESS,
      policy: SOURCE_INTEGRITY_RUNTIME_V1.id,
      message:
        "Source-tree Blood Law verification skipped at serverless runtime (NFT prune). Boot continues.",
      detail: detail ?? null,
    }),
  );
}

/** Test-only: reset one-shot warning latch. */
export function __resetSourceIntegrityWarningLatchForTests(): void {
  didLogStructuredWarning = false;
}

/**
 * Soft-read UTF-8 source. Never throws ENOENT for source-tree paths on serverless.
 * Returns SOURCE_NOT_AVAILABLE_IN_SERVERLESS when NFT-pruned; SOURCE_MISSING when
 * absent locally (caller fail-closes).
 */
export function readSourceUtf8(relativePath: string): SourceReadResult {
  const absolute = workspacePath(
    ...relativePath.split("/").filter(Boolean),
  );
  try {
    if (!existsSync(absolute)) {
      if (
        shouldSkipSourceTreeVerificationAtRuntime() &&
        isSourceTreePath(relativePath)
      ) {
        warnSourceIntegrityServerlessOnce(relativePath);
        return { available: false, status: SOURCE_NOT_AVAILABLE_IN_SERVERLESS };
      }
      return { available: false, status: "SOURCE_MISSING" };
    }
    return { available: true, content: readFileSync(absolute, "utf8") };
  } catch (error) {
    if (
      shouldSkipSourceTreeVerificationAtRuntime() &&
      isSourceTreeEnoentError(error) &&
      isSourceTreePath(relativePath)
    ) {
      warnSourceIntegrityServerlessOnce(relativePath);
      return { available: false, status: SOURCE_NOT_AVAILABLE_IN_SERVERLESS };
    }
    throw error;
  }
}

/** Safe source read — never throws ENOENT (returns empty string). Brand/UI scanners. */
export function readUtf8SourceOrEmpty(filePath: string): string {
  try {
    if (!existsSync(filePath)) return "";
    return readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

export function warnBrandIntegrityAndContinue(bloodLaw: string, errors: string[]): void {
  warnSourceIntegrityServerlessOnce(`BLOOD ${bloodLaw}`);
  console.warn(
    [
      `[ROVEXO STARTUP] BLOOD ${bloodLaw} brand integrity soft-fail — warn and continue (never HTTP 500).`,
      `Policy: ${SOURCE_INTEGRITY_RUNTIME_V1.id}`,
      ...errors.map((e) => ` - ${e}`),
    ].join("\n"),
  );
}

/** Detect NFT-pruned source tree open failures (Node ENOENT). */
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
  return isSourceTreePath(blob);
}

/**
 * True when a thrown Blood Law failure is source-tree certification (NFT class),
 * not Stripe/DB/env/security. Used by the startup gate soft-continue path.
 */
export function isSourceTreeCertificationFailure(error: unknown): boolean {
  if (isSourceTreeEnoentError(error)) return true;
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes(SOURCE_NOT_AVAILABLE_IN_SERVERLESS)) return true;

  // XLIII-style: "ConversationHub file missing (features/inbox/...tsx)"
  if (/file missing/i.test(message) && isSourceTreePath(message)) {
    return true;
  }

  // Assert report failures that only cite missing source paths under lib/features/app/…
  if (
    /BLOCK LOADING/i.test(message) &&
    isSourceTreePath(message) &&
    /(missing|ENOENT|Source verification skipped|not found|no such file)/i.test(
      message,
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Architectural entry: skip running a source-integrity Blood Law assert when
 * the monorepo source tree is unavailable under serverless NFT prune.
 * Returns true when the caller must skip (do not throw).
 */
export function skipSourceTreeBloodLawIfUnavailable(label: string): boolean {
  if (!shouldSkipSourceTreeVerificationAtRuntime()) return false;
  if (!isSourceIntegrityBloodLawLabel(label) && !/^BLOOD\s+XL/i.test(label)) {
    // Also accept bare roman labels from internal callers
    if (!/\b(XXXVII|XXXVIII|XXXIX|XL|XLI|XLII|XLIII|XLIV|XLV)\b/i.test(label)) {
      return false;
    }
  }
  if (isSourceTreeAvailable()) return false;
  warnSourceIntegrityServerlessOnce(label);
  return true;
}
