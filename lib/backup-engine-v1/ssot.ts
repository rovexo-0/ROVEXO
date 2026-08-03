/**
 * ROVEXO BACKUP ENGINE v1.0 — SSOT
 * Free-plan development backups (no Supabase Pro dependency).
 * Canonical: one engine · one report schema · Recovery Center reads reports only.
 */

export const BACKUP_ENGINE_V1 = {
  id: "backup-engine-v1",
  version: "1.0.0",
  status: "CANONICAL",
  equation: "ONE BACKUP ENGINE = ONE SSOT = FREE PLAN = NO SUPABASE PRO DEPENDENCY",
  rootDirName: ".rovexo-backups",
  latestReportFile: "latest.json",
  reportMarkdownFile: "BACKUP_REPORT.md",
  defaultRetentionCount: 30,
  envNamesOnlyFile: "env-names.json",
  envFileCopyName: "env.local.copy",
} as const;

export type BackupEngineScope = "full" | "db" | "storage" | "env" | "verify" | "restore";

export type BackupCheckResult = "PASS" | "FAIL" | "SKIP";

export type BackupEngineFileArtifact = {
  path: string;
  bytes: number;
  sha256: string;
  kind: "database" | "storage" | "environment" | "report" | "other";
};

export type BackupEngineReport = {
  engineId: typeof BACKUP_ENGINE_V1.id;
  version: typeof BACKUP_ENGINE_V1.version;
  runId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  scope: BackupEngineScope;
  result: "PASS" | "FAIL";
  database: {
    method: "pg_dump" | "supabase_cli" | "none";
    check: BackupCheckResult;
    artifact?: string;
    bytes?: number;
    sha256?: string;
    message: string;
  };
  storage: {
    check: BackupCheckResult;
    buckets: string[];
    files: number;
    bytes?: number;
    sha256?: string;
    artifact?: string;
    message: string;
  };
  environment: {
    check: BackupCheckResult;
    keysCount: number;
    artifact?: string;
    message: string;
  };
  verification: {
    check: BackupCheckResult;
    dumpExists: boolean;
    archiveIntegrity: boolean;
    storageCopied: boolean;
    checksumOk: boolean;
    message: string;
  };
  artifacts: BackupEngineFileArtifact[];
  retention: {
    kept: number;
    deleted: number;
    max: number;
  };
  /** Sanitized — never includes secrets or connection strings. */
  notes: string[];
};

export function formatBackupTimestamp(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

export function redactSecretText(input: string): string {
  return input
    .replace(/(postgres(?:ql)?:\/\/)([^@\s]+)@/gi, "$1***@")
    .replace(/((?:PASSWORD|SECRET|TOKEN|KEY|PRIVATE|DATABASE_URL|SERVICE_ROLE)[^=\s:]*)(=|:)\s*([^\s]+)/gi, "$1$2***")
    .replace(/\b(sk_live_|sk_test_|whsec_|re_[A-Za-z0-9]|sb_secret_|eyJ)[A-Za-z0-9._-]+/g, "***");
}
