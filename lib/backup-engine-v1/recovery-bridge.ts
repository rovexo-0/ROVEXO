import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  BACKUP_ENGINE_V1,
  type BackupEngineReport,
} from "@/lib/backup-engine-v1/ssot";
import type { RecoveryBackupEntry } from "@/lib/recovery-center-engine/types";

function backupsRoot(cwd = process.cwd()): string {
  return path.join(cwd, BACKUP_ENGINE_V1.rootDirName);
}

/** Read latest Backup Engine report from disk (dev/ops host). Safe if missing. */
export function readLatestBackupEngineReport(cwd = process.cwd()): BackupEngineReport | null {
  const file = path.join(backupsRoot(cwd), BACKUP_ENGINE_V1.latestReportFile);
  if (!existsSync(file)) return null;
  try {
    const raw = JSON.parse(readFileSync(file, "utf8")) as BackupEngineReport;
    if (raw?.engineId !== BACKUP_ENGINE_V1.id) return null;
    return raw;
  } catch {
    return null;
  }
}

/** Map Backup Engine report → Recovery Center backup row (upgrade, not replace). */
export function mapBackupEngineReportToRecoveryEntry(
  report: BackupEngineReport,
): RecoveryBackupEntry {
  const verified = report.verification.check === "PASS" && report.result === "PASS";
  const sizeParts = [
    report.database.bytes != null ? `db=${formatBytes(report.database.bytes)}` : null,
    report.storage.bytes != null ? `storage=${formatBytes(report.storage.bytes)}` : null,
    `duration=${(report.durationMs / 1000).toFixed(1)}s`,
    `verify=${report.verification.check}`,
  ].filter(Boolean);

  return {
    id: `backup-engine-${report.runId}`,
    label: `Backup Engine v1 · ${report.result} · ${report.scope}`,
    type: report.scope === "db" ? "database" : report.scope === "storage" ? "media" : report.scope === "env" ? "environment" : "full",
    createdAt: report.finishedAt,
    scheduled: false,
    encrypted: false,
    incremental: false,
    sizeLabel: sizeParts.join(" · "),
    status: verified ? "verified" : report.result === "PASS" ? "completed" : "failed",
    rollbackAvailable: report.result === "PASS",
  };
}

export function mergeBackupEngineIntoRecoveryBackups(
  existing: RecoveryBackupEntry[],
  cwd = process.cwd(),
): RecoveryBackupEntry[] {
  const report = readLatestBackupEngineReport(cwd);
  if (!report) return existing;
  const mapped = mapBackupEngineReportToRecoveryEntry(report);
  const withoutDup = existing.filter((b) => b.id !== mapped.id && !b.id.startsWith("backup-engine-"));
  return [mapped, ...withoutDup];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
