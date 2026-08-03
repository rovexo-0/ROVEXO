#!/usr/bin/env node
/**
 * Apply realtime REPLICA IDENTITY FULL migration (Realtime Certification v1.0).
 * Never prints connection strings or secrets.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = "supabase/migrations/20260802033000_realtime_replica_identity_full_v1.sql";

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

const sql = readFileSync(join(root, FILE), "utf8");
const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("OK: realtime replica identity FULL applied");
} catch (error) {
  console.error("FAIL:", error instanceof Error ? error.message : String(error));
  process.exit(1);
} finally {
  await client.end().catch(() => undefined);
}
