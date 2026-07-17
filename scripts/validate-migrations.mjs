#!/usr/bin/env node

/**
 * Fail-closed, scan-only migration certification.
 * Never applies migrations or modifies a database.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const migrationsDir = join(root, "supabase/migrations");
const failures = [];

if (!existsSync(migrationsDir)) {
  failures.push("supabase/migrations directory is missing");
} else {
  const files = readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();
  const versions = new Map();

  if (files.length === 0) failures.push("No SQL migrations found");

  for (const file of files) {
    const match = /^(\d{14})_[a-z0-9][a-z0-9_-]*\.sql$/i.exec(file);
    if (!match) {
      failures.push(`${file}: invalid migration filename`);
      continue;
    }

    const duplicates = versions.get(match[1]) ?? [];
    duplicates.push(file);
    versions.set(match[1], duplicates);

    const sql = readFileSync(join(migrationsDir, file), "utf8");
    if (!sql.trim()) failures.push(`${file}: migration is empty`);
    if (/^(<{7}|={7}|>{7})/m.test(sql)) {
      failures.push(`${file}: unresolved merge-conflict marker`);
    }

    const mentionsFullDemo = /demo\.(buyer|seller)@rovexo\.co\.uk/i.test(sql);
    const destructiveAccountMutation =
      /(delete\s+from\s+(?:auth\.)?users|delete\s+from\s+profiles|truncate\s+(?:table\s+)?(?:auth\.)?users|account_status\s*=\s*['"](?:suspended|deleted|disabled)['"]|banned_until|raw_app_meta_data)/i.test(
        sql,
      );
    if (mentionsFullDemo && destructiveAccountMutation) {
      failures.push(`${file}: destructive Full Demo account mutation is forbidden`);
    }
  }

  for (const [version, filesForVersion] of versions) {
    if (filesForVersion.length > 1) {
      failures.push(`${version}: duplicate migration version (${filesForVersion.join(", ")})`);
    }
  }
}

const report = {
  passed: failures.length === 0,
  deploymentBlocked: failures.length > 0,
  failures,
};

console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exit(1);
