#!/usr/bin/env node
/**
 * ROVEXO v1.0 — Apply ONLY OWNER = 0 canonical RPC fix (SQL #4).
 * Does not modify SQL #1 / #2 / #3 files.
 *
 * Usage:
 *   SUPABASE_DB_PASSWORD=... node scripts/apply-view-owner-zero.mjs
 * or:
 *   DATABASE_URL=postgres://... node scripts/apply-view-owner-zero.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILE =
  "supabase/migrations/20260721230000_view_owner_zero_canonical_v1.sql";

function loadEnvFile(path, into) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(m[1] in into) || !into[m[1]]) into[m[1]] = v;
  }
}

const env = { ...process.env };
loadEnvFile(join(root, ".env.local"), env);

let connectionString =
  env.DATABASE_URL || env.DIRECT_URL || env.POSTGRES_URL || env.SUPABASE_DB_URL || "";

if (!connectionString) {
  const poolerPath = join(root, "supabase/.temp/pooler-url");
  if (!existsSync(poolerPath)) {
    console.error("FAIL: no DATABASE_URL and no supabase/.temp/pooler-url");
    process.exit(1);
  }
  const u = new URL(readFileSync(poolerPath, "utf8").trim());
  if (!u.password && env.SUPABASE_DB_PASSWORD) {
    u.password = env.SUPABASE_DB_PASSWORD;
  }
  connectionString = u.toString();
}

if (!new URL(connectionString).password) {
  console.error(
    "FAIL: database password missing. Set SUPABASE_DB_PASSWORD or DATABASE_URL.",
  );
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log("CONNECTED");
console.log("APPLY", FILE);
await client.query(readFileSync(join(root, FILE), "utf8"));
console.log("OK", FILE);

const def = await client.query(`
  select pg_get_functiondef(p.oid) as def
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'record_unique_product_view'
  limit 1
`);
const body = def.rows[0]?.def ?? "";
const hasOwner =
  body.includes("v_seller_id") && body.includes("p_viewer_user_id = v_seller_id");
console.log("OWNER_BLOCK", hasOwner ? "PRESENT" : "MISSING");
await client.end();
process.exit(hasOwner ? 0 : 1);
