#!/usr/bin/env node
/**
 * ROVEXO Inventory Engine v1.0 — Apply ONLY inventory reserved SQL.
 * Absolute Law: Inventory SQL Sync only. Does not touch Checkout/Payment/UI.
 *
 * Usage:
 *   SUPABASE_DB_PASSWORD=... node scripts/apply-inventory-migrations.mjs
 * or:
 *   DATABASE_URL=postgres://... node scripts/apply-inventory-migrations.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

let Client;
try {
  ({ Client } = require("pg"));
} catch {
  console.error(
    "FAIL: package 'pg' not installed. Run: npm i pg --no-save\nThen: SUPABASE_DB_PASSWORD=... node scripts/apply-inventory-migrations.mjs",
  );
  process.exit(1);
}

const FILES = [
  "supabase/migrations/20260724223000_inventory_engine_reserved_enum_v1.sql",
  "supabase/migrations/20260724223100_inventory_engine_reserved_rpc_v1.sql",
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
loadEnvFile(join(root, ".env"), env);

let connectionString =
  env.DATABASE_URL ||
  env.DIRECT_URL ||
  env.POSTGRES_URL ||
  env.SUPABASE_DB_URL ||
  "";

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

const client = new Client({
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

const col = await client.query(`
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'reserved'
  ) as ok
`);

const enumVal = await client.query(`
  select exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'product_status'
      and e.enumlabel = 'reserved'
  ) as ok
`);

const rpcs = await client.query(`
  select p.proname
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in (
      'reserve_product_inventory',
      'release_product_inventory',
      'mark_product_sold'
    )
  order by p.proname
`);

const reserveBody = await client.query(`
  select pg_get_functiondef(p.oid) as def
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'reserve_product_inventory'
  limit 1
`);

const def = String(reserveBody.rows[0]?.def || "");
const reserveContract =
  def.includes("status = 'reserved'") &&
  def.includes("reserved = true") &&
  !/stock\s*=\s*stock\s*-/.test(def);

const markBody = await client.query(`
  select pg_get_functiondef(p.oid) as def
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'mark_product_sold'
  limit 1
`);
const markDef = String(markBody.rows[0]?.def || "");
const markSoldContract =
  markDef.includes("status = 'sold'") &&
  markDef.includes("reserved = false") &&
  /stock\s*=\s*stock\s*-\s*p_quantity/.test(markDef) &&
  !/stock\s*=\s*0/.test(markDef);

const enumRequired = await client.query(`
  select e.enumlabel
  from pg_enum e
  join pg_type t on t.oid = e.enumtypid
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public' and t.typname = 'product_status'
  order by e.enumsortorder
`);
const enumLabels = enumRequired.rows.map((r) => r.enumlabel);
const requiredEnums = [
  "draft",
  "published",
  "reserved",
  "paused",
  "sold",
  "deleted",
];
const enumComplete = requiredEnums.every((v) => enumLabels.includes(v));

const names = rpcs.rows.map((r) => r.proname);
const pass =
  Boolean(col.rows[0]?.ok) &&
  Boolean(enumVal.rows[0]?.ok) &&
  enumComplete &&
  names.includes("reserve_product_inventory") &&
  names.includes("release_product_inventory") &&
  names.includes("mark_product_sold") &&
  reserveContract &&
  markSoldContract;

console.log(
  JSON.stringify(
    {
      products_reserved_column: Boolean(col.rows[0]?.ok),
      product_status_reserved_enum: Boolean(enumVal.rows[0]?.ok),
      product_status_enum_values: enumLabels,
      product_status_enum_complete: enumComplete,
      rpcs: names,
      reserve_contract_status_reserved_not_sold: reserveContract,
      mark_sold_contract_stock_decrement: markSoldContract,
      pass,
    },
    null,
    2,
  ),
);

await client.end();
process.exit(pass ? 0 : 2);
