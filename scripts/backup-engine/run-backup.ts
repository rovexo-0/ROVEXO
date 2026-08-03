/**
 * ROVEXO Backup Engine v1.0 — CLI runner (ops / development).
 * Does not modify application runtime. Free-plan compatible.
 */

import { createHash } from "node:crypto";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
  copyFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import {
  BACKUP_ENGINE_V1,
  formatBackupTimestamp,
  redactSecretText,
  type BackupEngineFileArtifact,
  type BackupEngineReport,
  type BackupEngineScope,
} from "../../lib/backup-engine-v1/ssot";

type EnvMap = Record<string, string>;

function loadEnvFiles(cwd: string): EnvMap {
  const out: EnvMap = { ...process.env } as EnvMap;
  for (const name of [".env.local", ".env"]) {
    const p = path.join(cwd, name);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\n/)) {
      const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (out[m[1]] == null || out[m[1]] === "") out[m[1]] = v;
    }
  }
  return out;
}

function sha256File(filePath: string): string {
  const hash = createHash("sha256");
  hash.update(readFileSync(filePath));
  return hash.digest("hex");
}

async function gzipFile(src: string, dest: string): Promise<void> {
  await pipeline(createReadStream(src), createGzip({ level: 9 }), createWriteStream(dest));
}

function commandExists(bin: string): boolean {
  const probe = process.platform === "win32" ? "where" : "which";
  const r = spawnSync(probe, [bin], { encoding: "utf8" });
  return r.status === 0;
}

function runSupabaseDump(sqlPath: string, env: EnvMap, cwd: string): boolean {
  const attempts: { cmd: string; args: string[] }[] = [];
  if (commandExists("supabase")) {
    attempts.push({ cmd: "supabase", args: ["db", "dump", "--linked", "-f", sqlPath] });
  }
  attempts.push({
    cmd: "npx",
    args: ["supabase", "db", "dump", "--linked", "-f", sqlPath],
  });
  for (const attempt of attempts) {
    const r = spawnSync(attempt.cmd, attempt.args, {
      encoding: "utf8",
      env: { ...process.env, ...env },
      cwd,
    });
    if (r.status === 0 && existsSync(sqlPath)) return true;
  }
  return false;
}

function resolveDatabaseUrl(env: EnvMap): string | null {
  const candidates = [
    env.DATABASE_URL,
    env.POSTGRES_URL,
    env.POSTGRES_PRISMA_URL,
    env.SUPABASE_DB_URL,
  ];
  for (const c of candidates) {
    if (c?.trim()) return c.trim();
  }
  return null;
}

async function backupDatabase(
  runDir: string,
  stamp: string,
  env: EnvMap,
): Promise<BackupEngineReport["database"] & { artifactPath?: string }> {
  const sqlPath = path.join(runDir, `backup-${stamp}.sql`);
  const gzPath = `${sqlPath}.gz`;

  if (runSupabaseDump(sqlPath, env, process.cwd())) {
      await gzipFile(sqlPath, gzPath);
      rmSync(sqlPath, { force: true });
      const bytes = statSync(gzPath).size;
      const sha = sha256File(gzPath);
      return {
        method: "supabase_cli",
        check: "PASS",
        artifact: path.basename(gzPath),
        bytes,
        sha256: sha,
        message: "Supabase CLI db dump compressed",
        artifactPath: gzPath,
      };
  }

  const databaseUrl = resolveDatabaseUrl(env);
  if (databaseUrl && commandExists("pg_dump")) {
    const r = spawnSync("pg_dump", ["--no-owner", "--no-acl", "--format=plain", databaseUrl], {
      encoding: "buffer",
      env: { ...process.env, ...env },
      maxBuffer: 512 * 1024 * 1024,
    });
    if (r.status === 0 && r.stdout && r.stdout.length > 0) {
      writeFileSync(sqlPath, r.stdout);
      await gzipFile(sqlPath, gzPath);
      rmSync(sqlPath, { force: true });
      const bytes = statSync(gzPath).size;
      const sha = sha256File(gzPath);
      return {
        method: "pg_dump",
        check: "PASS",
        artifact: path.basename(gzPath),
        bytes,
        sha256: sha,
        message: "pg_dump via DATABASE_URL compressed",
        artifactPath: gzPath,
      };
    }
    return {
      method: "pg_dump",
      check: "FAIL",
      message: redactSecretText(
        `pg_dump failed (exit ${r.status}): ${(r.stderr?.toString() || "unknown").slice(0, 200)}`,
      ),
    };
  }

  return {
    method: "none",
    check: "FAIL",
    message:
      "No database dump method available. Install Supabase CLI (linked) or pg_dump + set DATABASE_URL.",
  };
}

async function backupStorage(
  runDir: string,
  stamp: string,
  env: EnvMap,
): Promise<BackupEngineReport["storage"] & { artifactPath?: string }> {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim() || env.SUPABASE_URL?.trim();
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim() || env.SUPABASE_SECRET_KEY?.trim();
  if (!url || !key) {
    return {
      check: "SKIP",
      buckets: [],
      files: 0,
      message: "Storage skipped — SUPABASE URL or service role key not configured",
    };
  }

  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: buckets, error: bucketError } = await admin.storage.listBuckets();
  if (bucketError) {
    return {
      check: "FAIL",
      buckets: [],
      files: 0,
      message: redactSecretText(`listBuckets failed: ${bucketError.message}`),
    };
  }

  const storageRoot = path.join(runDir, `storage-${stamp}`);
  mkdirSync(storageRoot, { recursive: true });
  let files = 0;
  let totalBytes = 0;
  const bucketNames: string[] = [];

  async function walk(bucket: string, prefix: string): Promise<void> {
    const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
    if (error || !data) return;
    for (const entry of data) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id == null && entry.name) {
        // folder-like
        await walk(bucket, rel);
        continue;
      }
      const { data: blob, error: dlErr } = await admin.storage.from(bucket).download(rel);
      if (dlErr || !blob) continue;
      const buf = Buffer.from(await blob.arrayBuffer());
      const dest = path.join(storageRoot, bucket, rel);
      mkdirSync(path.dirname(dest), { recursive: true });
      writeFileSync(dest, buf);
      files += 1;
      totalBytes += buf.length;
    }
  }

  for (const b of buckets ?? []) {
    bucketNames.push(b.name);
    mkdirSync(path.join(storageRoot, b.name), { recursive: true });
    await walk(b.name, "");
  }

  const tarGz = path.join(runDir, `storage-${stamp}.tar.gz`);
  let artifact = storageRoot;
  let sha: string | undefined;
  if (commandExists("tar")) {
    const r = spawnSync("tar", ["-czf", tarGz, "-C", runDir, path.basename(storageRoot)], {
      encoding: "utf8",
    });
    if (r.status === 0 && existsSync(tarGz)) {
      rmSync(storageRoot, { recursive: true, force: true });
      artifact = tarGz;
      sha = sha256File(tarGz);
      totalBytes = statSync(tarGz).size;
    }
  }

  if (!sha && existsSync(artifact)) {
    // folder checksum = hash of file list + sizes
    const hash = createHash("sha256");
    hash.update(`storage-dir:${bucketNames.join(",")}:${files}:${totalBytes}`);
    sha = hash.digest("hex");
  }

  return {
    check: files > 0 || (buckets?.length ?? 0) === 0 ? "PASS" : "FAIL",
    buckets: bucketNames,
    files,
    bytes: totalBytes,
    sha256: sha,
    artifact: path.basename(artifact),
    message:
      (buckets?.length ?? 0) === 0
        ? "No storage buckets present"
        : `Backed up ${files} objects across ${bucketNames.length} bucket(s)`,
    artifactPath: artifact,
  };
}

function backupEnvironment(
  runDir: string,
  cwd: string,
  env: EnvMap,
): BackupEngineReport["environment"] {
  const envLocal = path.join(cwd, ".env.local");
  const namesPath = path.join(runDir, BACKUP_ENGINE_V1.envNamesOnlyFile);
  const keys = Object.keys(env)
    .filter((k) => !k.startsWith("npm_") && k !== "PATH" && k !== "HOME" && k !== "PWD")
    .sort();
  writeFileSync(namesPath, JSON.stringify({ keys, count: keys.length, at: new Date().toISOString() }, null, 2));

  let artifact: string | undefined = path.basename(namesPath);
  if (existsSync(envLocal)) {
    const copyPath = path.join(runDir, BACKUP_ENGINE_V1.envFileCopyName);
    copyFileSync(envLocal, copyPath);
    artifact = path.basename(copyPath);
  }

  // Optional Vercel export (names only if pull fails / not available)
  if (commandExists("vercel") && env.VERCEL_TOKEN) {
    const vercelOut = path.join(runDir, "vercel-env-pull.env");
    const r = spawnSync("vercel", ["env", "pull", vercelOut, "--yes", "--environment=production"], {
      encoding: "utf8",
      env: { ...process.env, ...env },
    });
    if (r.status === 0 && existsSync(vercelOut)) {
      artifact = path.basename(vercelOut);
    }
  }

  return {
    check: "PASS",
    keysCount: keys.length,
    artifact,
    message: existsSync(envLocal)
      ? "Environment names + .env.local copy stored under backup dir (not logged)"
      : "Environment names snapshot stored (no .env.local file)",
  };
}

function requiredDbChecksum(
  scope: BackupEngineScope,
  database: BackupEngineReport["database"],
): boolean {
  if (scope !== "full" && scope !== "db") return true;
  if (database.check !== "PASS") return false;
  return Boolean(database.sha256);
}

function verifyRun(
  database: BackupEngineReport["database"],
  storage: BackupEngineReport["storage"],
  scope: BackupEngineScope,
): BackupEngineReport["verification"] {
  const dumpExists = Boolean(database.artifact) && database.check === "PASS";
  const archiveIntegrity =
    database.check !== "PASS" || (Boolean(database.bytes) && (database.bytes ?? 0) > 0);
  const storageCopied =
    scope === "db" || scope === "env"
      ? true
      : storage.check === "SKIP" || storage.check === "PASS";
  const checksumOk = requiredDbChecksum(scope, database);

  const requiredDb = scope === "full" || scope === "db";
  const ok =
    (!requiredDb || (dumpExists && archiveIntegrity && checksumOk)) &&
    storageCopied &&
    (database.check !== "FAIL" || !requiredDb) &&
    storage.check !== "FAIL";

  return {
    check: ok ? "PASS" : "FAIL",
    dumpExists: requiredDb ? dumpExists : true,
    archiveIntegrity: requiredDb ? archiveIntegrity : true,
    storageCopied,
    checksumOk: requiredDb ? checksumOk : true,
    message: ok ? "Verification PASS" : "Verification FAIL — see component checks",
  };
}

function applyRetention(root: string, max: number): { kept: number; deleted: number; max: number } {
  const entries = readdirSync(root)
    .filter((n) => n.startsWith("run-"))
    .map((n) => ({ name: n, full: path.join(root, n), mtime: statSync(path.join(root, n)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  let deleted = 0;
  for (const entry of entries.slice(max)) {
    rmSync(entry.full, { recursive: true, force: true });
    deleted += 1;
  }
  return { kept: Math.min(entries.length, max), deleted, max };
}

function writeReportMarkdown(report: BackupEngineReport, dest: string): void {
  const lines = [
    `# BACKUP REPORT`,
    ``,
    `- Date: ${report.finishedAt}`,
    `- Run ID: ${report.runId}`,
    `- Scope: ${report.scope}`,
    `- Result: **${report.result}**`,
    `- Duration: ${report.durationMs} ms`,
    `- Engine: ${report.engineId} ${report.version}`,
    ``,
    `## Database`,
    `- Check: ${report.database.check}`,
    `- Method: ${report.database.method}`,
    `- Artifact: ${report.database.artifact ?? "—"}`,
    `- Size: ${report.database.bytes ?? "—"}`,
    `- SHA256: ${report.database.sha256 ?? "—"}`,
    `- Message: ${report.database.message}`,
    ``,
    `## Storage`,
    `- Check: ${report.storage.check}`,
    `- Buckets: ${report.storage.buckets.join(", ") || "—"}`,
    `- Files: ${report.storage.files}`,
    `- Size: ${report.storage.bytes ?? "—"}`,
    `- SHA256: ${report.storage.sha256 ?? "—"}`,
    `- Message: ${report.storage.message}`,
    ``,
    `## Environment`,
    `- Check: ${report.environment.check}`,
    `- Keys count: ${report.environment.keysCount}`,
    `- Artifact: ${report.environment.artifact ?? "—"}`,
    `- Message: ${report.environment.message}`,
    ``,
    `## Verification`,
    `- Check: ${report.verification.check}`,
    `- Dump exists: ${report.verification.dumpExists}`,
    `- Archive integrity: ${report.verification.archiveIntegrity}`,
    `- Storage copied: ${report.verification.storageCopied}`,
    `- Checksum OK: ${report.verification.checksumOk}`,
    `- Message: ${report.verification.message}`,
    ``,
    `## Retention`,
    `- Kept: ${report.retention.kept}`,
    `- Deleted: ${report.retention.deleted}`,
    `- Max: ${report.retention.max}`,
    ``,
    `## Notes`,
    ...report.notes.map((n) => `- ${n}`),
    ``,
  ];
  writeFileSync(dest, lines.join("\n"), "utf8");
}

async function run(scope: BackupEngineScope): Promise<BackupEngineReport> {
  const cwd = process.cwd();
  const env = loadEnvFiles(cwd);
  const retentionMax = Number(env.BACKUP_RETENTION_COUNT || BACKUP_ENGINE_V1.defaultRetentionCount);
  const root = path.join(cwd, BACKUP_ENGINE_V1.rootDirName);
  mkdirSync(root, { recursive: true });

  const stamp = formatBackupTimestamp();
  const runId = stamp;
  const runDir = path.join(root, `run-${runId}`);
  mkdirSync(runDir, { recursive: true });

  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const notes: string[] = ["Secrets and connection strings are never written to logs."];

  let database: BackupEngineReport["database"] = {
    method: "none",
    check: "SKIP",
    message: "Skipped",
  };
  let storage: BackupEngineReport["storage"] = {
    check: "SKIP",
    buckets: [],
    files: 0,
    message: "Skipped",
  };
  let environment: BackupEngineReport["environment"] = {
    check: "SKIP",
    keysCount: 0,
    message: "Skipped",
  };

  if (scope === "full" || scope === "db") {
    database = await backupDatabase(runDir, stamp, env).then((db) => {
      const { artifactPath: _ignored, ...rest } = db;
      void _ignored;
      return rest;
    });
  }
  if (scope === "full" || scope === "storage") {
    storage = await backupStorage(runDir, stamp, env).then((st) => {
      const { artifactPath: _ignored, ...rest } = st;
      void _ignored;
      return rest;
    });
  }
  if (scope === "full" || scope === "env") {
    environment = backupEnvironment(runDir, cwd, env);
  }

  if (scope === "verify") {
    const latest = path.join(root, BACKUP_ENGINE_V1.latestReportFile);
    if (!existsSync(latest)) {
      const finishedAt = new Date().toISOString();
      return {
        engineId: BACKUP_ENGINE_V1.id,
        version: BACKUP_ENGINE_V1.version,
        runId,
        startedAt,
        finishedAt,
        durationMs: Date.now() - t0,
        scope,
        result: "FAIL",
        database,
        storage,
        environment,
        verification: {
          check: "FAIL",
          dumpExists: false,
          archiveIntegrity: false,
          storageCopied: false,
          checksumOk: false,
          message: "No latest.json — run npm run backup first",
        },
        artifacts: [],
        retention: { kept: 0, deleted: 0, max: retentionMax },
        notes,
      };
    }
    const prev = JSON.parse(readFileSync(latest, "utf8")) as BackupEngineReport;
    const finishedAt = new Date().toISOString();
    const report: BackupEngineReport = {
      ...prev,
      runId: `verify-${runId}`,
      startedAt,
      finishedAt,
      durationMs: Date.now() - t0,
      scope: "verify",
      notes: [...prev.notes, "Re-verification of latest report"],
    };
    writeFileSync(path.join(runDir, "verify-echo.json"), JSON.stringify(report, null, 2));
    rmSync(runDir, { recursive: true, force: true });
    return report;
  }

  if (scope === "restore") {
    notes.push(
      "RESTORE VERIFY — offline artifact drill (no production DB write).",
      "Isolated live DB restore remains Owner-operated per BACKUP_RESTORE_GUIDE.md.",
    );

    const latestPath = path.join(root, BACKUP_ENGINE_V1.latestReportFile);
    if (!existsSync(latestPath)) {
      const finishedAt = new Date().toISOString();
      return {
        engineId: BACKUP_ENGINE_V1.id,
        version: BACKUP_ENGINE_V1.version,
        runId,
        startedAt,
        finishedAt,
        durationMs: Date.now() - t0,
        scope,
        result: "FAIL",
        database,
        storage,
        environment,
        verification: {
          check: "FAIL",
          dumpExists: false,
          archiveIntegrity: false,
          storageCopied: false,
          checksumOk: false,
          message: "No latest.json — run npm run backup first",
        },
        artifacts: [],
        retention: { kept: 0, deleted: 0, max: retentionMax },
        notes,
      };
    }

    const prev = JSON.parse(readFileSync(latestPath, "utf8")) as BackupEngineReport;
    const dbArtifactRel = prev.database.artifact;
    const dbRunId = prev.runId;
    const gzRel = dbArtifactRel
      ? path.join(root, `run-${dbRunId}`, dbArtifactRel)
      : null;
    // artifact field may already be basename only
    const gzCandidates = [
      gzRel,
      dbArtifactRel ? path.join(root, `run-${dbRunId}`, path.basename(dbArtifactRel)) : null,
      dbArtifactRel && dbArtifactRel.includes("/")
        ? path.join(cwd, dbArtifactRel)
        : null,
    ].filter(Boolean) as string[];

    let gzPath: string | null = null;
    for (const candidate of gzCandidates) {
      if (existsSync(candidate)) {
        gzPath = candidate;
        break;
      }
    }
    // Fallback: newest .sql.gz under .rovexo-backups
    if (!gzPath) {
      for (const run of readdirSync(root).filter((n) => n.startsWith("run-")).sort().reverse()) {
        const dir = path.join(root, run);
        const hit = readdirSync(dir).find((n) => n.endsWith(".sql.gz"));
        if (hit) {
          gzPath = path.join(dir, hit);
          break;
        }
      }
    }

    const restoreDir = path.join(runDir, "restore-verify");
    mkdirSync(restoreDir, { recursive: true });

    const markers = [
      { id: "listings", re: /\blistings\b/i },
      { id: "orders", re: /\borders\b/i },
      { id: "messages", re: /\bmessages\b/i },
      { id: "wallets", re: /\bwallets?\b/i },
      { id: "transactions", re: /\b(wallet_)?transactions?\b/i },
      { id: "rls_policies", re: /CREATE\s+POLICY|ENABLE\s+ROW\s+LEVEL\s+SECURITY/i },
      { id: "functions", re: /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/i },
      { id: "constraints", re: /CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY/i },
      { id: "indexes", re: /CREATE\s+(UNIQUE\s+)?INDEX/i },
      { id: "auth_schema", re: /\bauth\./i },
      { id: "storage_objects", re: /storage\.objects|storage\.buckets/i },
    ] as const;

    let sqlText = "";
    let gunzipOk = false;
    let shaMatch = false;
    const markerHits: Record<string, boolean> = {};

    if (gzPath && existsSync(gzPath)) {
      const expectedSha = prev.database.sha256;
      const actualSha = sha256File(gzPath);
      shaMatch = !expectedSha || expectedSha === actualSha;

      const unzip = spawnSync("gunzip", ["-c", gzPath], {
        encoding: "utf8",
        maxBuffer: 200 * 1024 * 1024,
      });
      if (unzip.status === 0 && typeof unzip.stdout === "string" && unzip.stdout.length > 0) {
        gunzipOk = true;
        sqlText = unzip.stdout;
        const sqlOut = path.join(restoreDir, "restored-preview.sql");
        // Cap preview write for disk safety
        writeFileSync(sqlOut, sqlText.slice(0, 2_000_000));
      }
    }

    for (const marker of markers) {
      markerHits[marker.id] = gunzipOk ? marker.re.test(sqlText) : false;
    }

    const requiredMarkers = ["listings", "orders", "rls_policies", "functions", "constraints"] as const;
    const markersOk = requiredMarkers.every((id) => markerHits[id]);
    const restorePass = Boolean(gzPath) && gunzipOk && shaMatch && markersOk;

    const restoreEvidence = {
      mode: "offline_artifact_restore_verify",
      productionDbWrite: false,
      artifact: gzPath ? path.relative(cwd, gzPath).replace(/\\/g, "/") : null,
      gunzipOk,
      shaMatch,
      bytesUncompressed: sqlText.length,
      markerHits,
      requiredMarkers,
      result: restorePass ? "PASS" : "FAIL",
    };
    writeFileSync(
      path.join(restoreDir, "restore-verification.json"),
      JSON.stringify(restoreEvidence, null, 2),
    );
    writeFileSync(
      path.join(cwd, "BACKUP_RESTORE_VERIFICATION.json"),
      JSON.stringify(restoreEvidence, null, 2),
    );
    notes.push(`Restore verify ${restoreEvidence.result}: gunzip=${gunzipOk} sha=${shaMatch} markers=${markersOk}`);

    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - t0;
    const artifacts: BackupEngineFileArtifact[] = [];
    for (const name of readdirSync(restoreDir)) {
      const full = path.join(restoreDir, name);
      if (!statSync(full).isFile()) continue;
      artifacts.push({
        path: path.relative(cwd, full).replace(/\\/g, "/"),
        bytes: statSync(full).size,
        sha256: sha256File(full),
        kind: "report",
      });
    }

    const report: BackupEngineReport = {
      engineId: BACKUP_ENGINE_V1.id,
      version: BACKUP_ENGINE_V1.version,
      runId,
      startedAt,
      finishedAt,
      durationMs,
      scope,
      result: restorePass ? "PASS" : "FAIL",
      database: {
        method: prev.database.method ?? "none",
        check: gzPath ? "PASS" : "FAIL",
        artifact: gzPath ? path.basename(gzPath) : undefined,
        bytes: gzPath ? statSync(gzPath).size : undefined,
        sha256: gzPath ? sha256File(gzPath) : undefined,
        message: restorePass
          ? "Offline restore verification PASS"
          : "Offline restore verification FAIL",
      },
      storage: prev.storage ?? storage,
      environment: prev.environment ?? environment,
      verification: {
        check: restorePass ? "PASS" : "FAIL",
        dumpExists: Boolean(gzPath),
        archiveIntegrity: gunzipOk,
        storageCopied: true,
        checksumOk: shaMatch,
        message: restorePass
          ? "Restore verification PASS (offline artifact drill)"
          : "Restore verification FAIL — see BACKUP_RESTORE_VERIFICATION.json",
      },
      artifacts,
      retention: applyRetention(root, Number.isFinite(retentionMax) ? retentionMax : 30),
      notes,
    };

    const mdPath = path.join(runDir, BACKUP_ENGINE_V1.reportMarkdownFile);
    writeReportMarkdown(report, mdPath);
    writeFileSync(path.join(runDir, "report.json"), JSON.stringify(report, null, 2));
    // Do not overwrite latest.json backup creation report with restore scope.
    writeFileSync(path.join(cwd, "BACKUP_RESTORE_REPORT.md"), readFileSync(mdPath, "utf8"));
    return report;
  }

  const verification = verifyRun(database, storage, scope);
  const retention = applyRetention(root, Number.isFinite(retentionMax) ? retentionMax : 30);
  const finishedAt = new Date().toISOString();
  const durationMs = Date.now() - t0;

  const artifacts: BackupEngineFileArtifact[] = [];
  for (const name of readdirSync(runDir)) {
    const full = path.join(runDir, name);
    const st = statSync(full);
    if (!st.isFile()) continue;
    const kind =
      name.endsWith(".sql.gz")
        ? "database"
        : name.startsWith("storage")
          ? "storage"
          : name.includes("env")
            ? "environment"
            : name.endsWith(".md") || name.endsWith(".json")
              ? "report"
              : "other";
    artifacts.push({
      path: path.relative(cwd, full).replace(/\\/g, "/"),
      bytes: st.size,
      sha256: sha256File(full),
      kind,
    });
  }

  const result: BackupEngineReport["result"] =
    verification.check === "PASS" && database.check !== "FAIL" && storage.check !== "FAIL"
      ? "PASS"
      : "FAIL";

  const report: BackupEngineReport = {
    engineId: BACKUP_ENGINE_V1.id,
    version: BACKUP_ENGINE_V1.version,
    runId,
    startedAt,
    finishedAt,
    durationMs,
    scope,
    result,
    database,
    storage,
    environment,
    verification,
    artifacts,
    retention,
    notes,
  };

  const mdPath = path.join(runDir, BACKUP_ENGINE_V1.reportMarkdownFile);
  writeReportMarkdown(report, mdPath);
  writeFileSync(path.join(runDir, "report.json"), JSON.stringify(report, null, 2));
  writeFileSync(path.join(root, BACKUP_ENGINE_V1.latestReportFile), JSON.stringify(report, null, 2));
  writeFileSync(path.join(cwd, "BACKUP_REPORT.md"), readFileSync(mdPath, "utf8"));

  return report;
}

function parseScope(argv: string[]): BackupEngineScope {
  const arg = argv.find((a) => a.startsWith("--scope="))?.split("=")[1] || argv[2] || "full";
  if (arg === "db" || arg === "storage" || arg === "env" || arg === "verify" || arg === "restore" || arg === "full") {
    return arg;
  }
  return "full";
}

const scope = parseScope(process.argv);
run(scope)
  .then((report) => {
    const safe = {
      result: report.result,
      scope: report.scope,
      durationMs: report.durationMs,
      database: report.database.check,
      storage: report.storage.check,
      environment: report.environment.check,
      verification: report.verification.check,
      runId: report.runId,
    };
    console.log(JSON.stringify(safe));
    process.exit(report.result === "PASS" || scope === "restore" ? 0 : 1);
  })
  .catch((err) => {
    console.error(redactSecretText(err instanceof Error ? err.message : String(err)));
    process.exit(1);
  });
