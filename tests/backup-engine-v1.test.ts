import { describe, expect, it } from "vitest";
import {
  BACKUP_ENGINE_V1,
  formatBackupTimestamp,
  redactSecretText,
  type BackupEngineReport,
} from "@/lib/backup-engine-v1/ssot";
import { mapBackupEngineReportToRecoveryEntry } from "@/lib/backup-engine-v1/recovery-bridge";

function sampleReport(overrides: Partial<BackupEngineReport> = {}): BackupEngineReport {
  return {
    engineId: BACKUP_ENGINE_V1.id,
    version: BACKUP_ENGINE_V1.version,
    runId: "20260802230000",
    startedAt: "2026-08-02T23:00:00.000Z",
    finishedAt: "2026-08-02T23:00:04.000Z",
    durationMs: 4000,
    scope: "full",
    result: "PASS",
    database: {
      method: "pg_dump",
      check: "PASS",
      artifact: "backup-20260802230000.sql.gz",
      bytes: 1024,
      sha256: "abc",
      message: "ok",
    },
    storage: {
      check: "PASS",
      buckets: ["images"],
      files: 2,
      bytes: 2048,
      sha256: "def",
      message: "ok",
    },
    environment: { check: "PASS", keysCount: 10, message: "ok" },
    verification: {
      check: "PASS",
      dumpExists: true,
      archiveIntegrity: true,
      storageCopied: true,
      checksumOk: true,
      message: "Verification PASS",
    },
    artifacts: [],
    retention: { kept: 1, deleted: 0, max: 30 },
    notes: [],
    ...overrides,
  };
}

describe("backup-engine-v1", () => {
  it("formats timestamp for dump filenames", () => {
    const stamp = formatBackupTimestamp(new Date("2026-08-02T23:00:00.000Z"));
    expect(stamp).toMatch(/2026/);
    expect(stamp.includes("-")).toBe(true);
  });

  it("redacts connection strings and secrets from text", () => {
    const raw =
      "postgres://user:SuperSecret@host:5432/db DATABASE_URL=postgres://x:y@z sk_live_abc123token";
    const out = redactSecretText(raw);
    expect(out).not.toContain("SuperSecret");
    expect(out).not.toContain("sk_live_abc123token");
    expect(out).toContain("***");
  });

  it("maps report into Recovery Center backup entry", () => {
    const entry = mapBackupEngineReportToRecoveryEntry(sampleReport());
    expect(entry.id).toBe("backup-engine-20260802230000");
    expect(entry.status).toBe("verified");
    expect(entry.sizeLabel).toContain("db=");
    expect(entry.sizeLabel).toContain("storage=");
    expect(entry.sizeLabel).toContain("verify=PASS");
    expect(entry.rollbackAvailable).toBe(true);
  });

  it("marks failed verification as failed recovery status", () => {
    const entry = mapBackupEngineReportToRecoveryEntry(
      sampleReport({
        result: "FAIL",
        verification: {
          check: "FAIL",
          dumpExists: false,
          archiveIntegrity: false,
          storageCopied: false,
          checksumOk: false,
          message: "fail",
        },
      }),
    );
    expect(entry.status).toBe("failed");
    expect(entry.rollbackAvailable).toBe(false);
  });

  it("keeps singularity constants", () => {
    expect(BACKUP_ENGINE_V1.id).toBe("backup-engine-v1");
    expect(BACKUP_ENGINE_V1.rootDirName).toBe(".rovexo-backups");
    expect(BACKUP_ENGINE_V1.defaultRetentionCount).toBe(30);
  });
});
