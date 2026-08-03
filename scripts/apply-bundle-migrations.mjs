#!/usr/bin/env node
/**
 * Apply Bundle Engine v1.0 SQL migrations only.
 * Requires DATABASE_URL or SUPABASE_DB_PASSWORD + pooler-url.
 *
 * Usage:
 *   SUPABASE_DB_PASSWORD=... node scripts/apply-bundle-migrations.mjs
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
  console.error("FAIL: package 'pg' required. npm i pg --no-save");
  process.exit(1);
}

const FILES = [
  "supabase/migrations/20260801160000_checkout_sessions_bundle_lines_v1.sql",
  "supabase/migrations/20260801180000_bundle_engine_v1.sql",
];

function loadEnvFile(path, into) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(m[1] in into) || !into[m[1]]) into[m[1]] = v;
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
    console.error("FAIL: no DATABASE_URL and no supabase/.temp/pooler-url");
    process.exit(1);
  }
  const u = new URL(readFileSync(poolerPath, "utf8").trim());
  if (!u.password && env.SUPABASE_DB_PASSWORD) u.password = env.SUPABASE_DB_PASSWORD;
  connectionString = u.toString();
}

if (!new URL(connectionString).password) {
  console.error("FAIL: database password missing (SUPABASE_DB_PASSWORD or DATABASE_URL).");
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  for (const rel of FILES) {
    const sql = readFileSync(join(root, rel), "utf8");
    console.log(`Applying ${rel}...`);
    await client.query(sql);
    console.log(`PASS ${rel}`);
  }
  console.log("PASS: Bundle migrations applied.");
} finally {
  await client.end();
}
