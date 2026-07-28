#!/usr/bin/env node
/**
 * Apply ONLY Phase 3 Follow SQL (user_follows).
 * Does not touch orders / payments / wallet / auth.
 * Never prints connection strings or secrets.
 *
 * Usage: node scripts/apply-follow-migration-phase3.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = "supabase/migrations/20260726230000_marketplace_follow_phase3_only_v1.sql";

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

const env = { ...process.env };
loadEnvFile(join(root, ".env.local"), env);
loadEnvFile(join(root, ".env"), env);

let connectionString =
  env.DATABASE_URL || env.DIRECT_URL || env.POSTGRES_URL || env.SUPABASE_DB_URL || "";

if (!connectionString) {
  const poolerPath = join(root, "supabase/.temp/pooler-url");
  if (!existsSync(poolerPath)) {
    console.error("FAIL: database connection not configured");
    process.exit(1);
  }
  const u = new URL(readFileSync(poolerPath, "utf8").trim());
  if (!u.password && env.SUPABASE_DB_PASSWORD) {
    u.password = env.SUPABASE_DB_PASSWORD;
  }
  connectionString = u.toString();
}

try {
  const passLen = new URL(connectionString).password.length;
  if (!passLen) {
    console.error("FAIL: database password missing");
    process.exit(1);
  }
} catch {
  console.error("FAIL: invalid database connection");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log("CONNECTED");

const sql = readFileSync(join(root, FILE), "utf8");
console.log("APPLY", FILE);
await client.query(sql);
console.log("OK", FILE);

const checks = await client.query(`
  select
    to_regclass('public.user_follows') is not null as table_exists,
    exists (
      select 1 from pg_constraint
      where conname = 'user_follows_unique'
    ) as unique_ok,
    exists (
      select 1 from pg_constraint
      where conname = 'user_follows_no_self'
    ) as no_self_ok,
    exists (
      select 1 from pg_indexes
      where indexname = 'user_follows_follower_idx'
    ) as follower_idx_ok,
    exists (
      select 1 from pg_indexes
      where indexname = 'user_follows_following_idx'
    ) as following_idx_ok,
    exists (
      select 1 from pg_trigger
      where tgname = 'user_follows_sync_counts'
    ) as trigger_ok,
    exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = 'follower_count'
    ) as follower_col_ok,
    exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = 'following_count'
    ) as following_col_ok
`);

const row = checks.rows[0];
console.log("VERIFY", JSON.stringify(row));

const allPass = Object.values(row).every(Boolean);
await client.end();

if (!allPass) {
  console.error("FAIL: follow schema verification incomplete");
  process.exit(1);
}

console.log("PASS: follow schema ready");
process.exit(0);
