#!/usr/bin/env node
/**
 * Realtime Certification v1.1 — Phase 1 infra gate + Phase 3 REPLICA IDENTITY audit.
 * Never prints secrets. Exit 1 on missing DB credentials or incomplete FULL identity.
 *
 * Usage:
 *   node scripts/audit-realtime-replica-identity.mjs
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const EVIDENCE_DIR = join(root, "test-results/realtime-certification-v1");
const REQUIRED_TABLES = [
  "conversations",
  "messages",
  "notifications",
  "offers",
  "orders",
  "wallets",
  "products",
  "user_follows",
  "reviews",
];
const OPTIONAL_TABLES = ["bundles", "listings", "wallet_transactions"];

function loadEnvFile(path, into) {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(key in into) || !into[key]) into[key] = v;
  }
}

function resolveConnectionString(env) {
  let connectionString =
    env.DATABASE_URL || env.DIRECT_URL || env.POSTGRES_URL || env.SUPABASE_DB_URL || "";
  if (connectionString) return { connectionString, source: "DATABASE_URL_FAMILY" };

  const poolerPath = join(root, "supabase/.temp/pooler-url");
  if (!existsSync(poolerPath)) {
    return { connectionString: "", source: "NONE" };
  }
  const u = new URL(readFileSync(poolerPath, "utf8").trim());
  if (!u.password && env.SUPABASE_DB_PASSWORD) {
    u.password = env.SUPABASE_DB_PASSWORD;
  }
  return {
    connectionString: u.toString(),
    source: "POOLER",
    passwordPresent: Boolean(u.password && String(u.password).length > 0),
  };
}

const env = { ...process.env };
loadEnvFile(join(root, ".env.local"), env);
loadEnvFile(join(root, ".env"), env);

const missing = [];
if (
  !env.DATABASE_URL &&
  !env.DIRECT_URL &&
  !env.POSTGRES_URL &&
  !env.SUPABASE_DB_URL
) {
  missing.push("DATABASE_URL (or DIRECT_URL / POSTGRES_URL / SUPABASE_DB_URL)");
}
const resolved = resolveConnectionString(env);
if (resolved.source === "POOLER" && resolved.passwordPresent === false) {
  missing.push("SUPABASE_DB_PASSWORD (pooler-url has no password)");
}
if (!env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

mkdirSync(EVIDENCE_DIR, { recursive: true });

if (missing.length || !resolved.connectionString) {
  const report = {
    phase: "PHASE_1_INFRASTRUCTURE",
    overall: "FAIL",
    missing,
    migrationFile: "supabase/migrations/20260802033000_realtime_replica_identity_full_v1.sql",
    migrationExists: existsSync(
      join(root, "supabase/migrations/20260802033000_realtime_replica_identity_full_v1.sql"),
    ),
    generatedAt: new Date().toISOString(),
    verdict: "REALTIME CERTIFICATION = FAIL",
    blocker:
      "Phase 1 STOP — database connection credentials missing. Cannot apply migration or audit REPLICA IDENTITY.",
  };
  writeFileSync(join(EVIDENCE_DIR, "phase1-infra.json"), JSON.stringify(report, null, 2));
  writeFileSync(
    join(EVIDENCE_DIR, "PHASE1_INFRA.md"),
    [
      `# Realtime Certification v1.1 — Phase 1 Infrastructure`,
      ``,
      `Overall: **FAIL**`,
      ``,
      `## Missing variables`,
      ...missing.map((m) => `- \`${m}\``),
      ``,
      `## Blocker`,
      report.blocker,
      ``,
      `## Verdict`,
      ``,
      `REALTIME CERTIFICATION = FAIL`,
      ``,
    ].join("\n"),
  );
  console.error("PHASE 1 FAIL — missing:");
  for (const m of missing) console.error(`  - ${m}`);
  process.exit(1);
}

const client = new pg.Client({
  connectionString: resolved.connectionString,
  ssl: resolved.connectionString.includes("localhost")
    ? undefined
    : { rejectUnauthorized: false },
});

try {
  await client.connect();
  const { rows } = await client.query(
    `
    select c.relname as table_name,
           case c.relreplident
             when 'd' then 'DEFAULT'
             when 'n' then 'NOTHING'
             when 'f' then 'FULL'
             when 'i' then 'INDEX'
             else 'UNKNOWN'
           end as replica_identity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname = any($1::text[])
    order by c.relname
    `,
    [[...REQUIRED_TABLES, ...OPTIONAL_TABLES]],
  );

  const byName = Object.fromEntries(rows.map((r) => [r.table_name, r.replica_identity]));
  const defects = [];
  for (const table of REQUIRED_TABLES) {
    const identity = byName[table];
    if (!identity) defects.push(`${table}: MISSING_TABLE`);
    else if (identity !== "FULL") defects.push(`${table}: ${identity} (need FULL)`);
  }

  const report = {
    phase: "PHASE_3_REPLICA_IDENTITY",
    overall: defects.length === 0 ? "PASS" : "FAIL",
    tables: byName,
    defects,
    generatedAt: new Date().toISOString(),
    verdict:
      defects.length === 0
        ? "REPLICA IDENTITY AUDIT = PASS"
        : "REPLICA IDENTITY AUDIT = FAIL",
  };
  writeFileSync(join(EVIDENCE_DIR, "replica-identity.json"), JSON.stringify(report, null, 2));
  console.log(report.verdict);
  if (defects.length) {
    for (const d of defects) console.error(`  - ${d}`);
    process.exit(1);
  }
} catch (error) {
  console.error("FAIL:", error instanceof Error ? error.message : String(error));
  process.exit(1);
} finally {
  await client.end().catch(() => undefined);
}
