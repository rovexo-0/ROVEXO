#!/usr/bin/env node
/**
 * ROVEXO v1.0 — Apply ONLY the 3 canonical View migrations.
 * Usage:
 *   SUPABASE_DB_PASSWORD=... node scripts/apply-view-migrations.mjs
 * or:
 *   DATABASE_URL=postgres://... node scripts/apply-view-migrations.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILES = [
  "supabase/migrations/20260721200000_product_view_system_v1.sql",
  "supabase/migrations/20260721210000_product_view_production_lock_v1.sql",
  "supabase/migrations/20260721220000_view_master_architect_l7_v1.sql",
  // OWNER = 0 canonical — restores seller forever-block without editing SQL #1–#3
  "supabase/migrations/20260721230000_view_owner_zero_canonical_v1.sql",
];

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
loadEnvFile(join(root, ".env.local.placeholder-disabled"), env);

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

const passLen = new URL(connectionString).password.length;
if (!passLen) {
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

for (const rel of FILES) {
  const file = join(root, rel);
  console.log("APPLY", rel);
  await client.query(readFileSync(file, "utf8"));
  console.log("OK", rel);
}

const table = await client.query(
  `select to_regclass('public.product_view_events') as t`,
);
const rpc = await client.query(
  `select count(*)::int as c
   from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'record_unique_product_view'`,
);

console.log(
  JSON.stringify(
    {
      table: table.rows[0]?.t,
      rpcCount: rpc.rows[0]?.c,
      pass: Boolean(table.rows[0]?.t) && Number(rpc.rows[0]?.c) > 0,
    },
    null,
    2,
  ),
);

await client.end();
process.exit(table.rows[0]?.t && Number(rpc.rows[0]?.c) > 0 ? 0 : 2);
