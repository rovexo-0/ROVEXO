#!/usr/bin/env node
/**
 * Publish pipeline diagnostic for the Sell flow.
 *
 * Prints the REAL backend state for the fields the publish insert touches, so
 * "Unable to publish listing" can be traced to an exact cause instead of guessed.
 *
 * Usage (from repo root, with .env.local containing your Supabase keys):
 *   node scripts/diagnose-publish.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (service role
 * bypasses RLS, so this checks the schema/columns, not row-level policies).
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();

function loadEnvFile(filename) {
  const path = join(ROOT, filename);
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local"), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local and retry.",
  );
  process.exit(2);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// Columns the publish insert writes to public.products.
const PRODUCT_COLUMNS = [
  "id",
  "seller_id",
  "slug",
  "title",
  "description",
  "category_id",
  "condition",
  "price",
  "accept_offers",
  "delivery_carriers",
  "shipping_method",
  "shipping_price",
  "parcel_size",
  "status",
  "stock",
  "listing_type",
];

async function checkColumn(table, column) {
  const { error } = await admin.from(table).select(column).limit(1);
  return { column, ok: !error, error: error?.message ?? null, code: error?.code ?? null };
}

async function main() {
  console.log("=== ROVEXO publish diagnostic ===\n");

  console.log("[products] column availability:");
  const missing = [];
  for (const column of PRODUCT_COLUMNS) {
    const result = await checkColumn("products", column);
    console.log(`  ${result.ok ? "OK  " : "FAIL"}  products.${column}${result.ok ? "" : `  ->  ${result.code ?? ""} ${result.error ?? ""}`}`);
    if (!result.ok) missing.push(result);
  }

  console.log("\n[product_images] column availability:");
  for (const column of ["product_id", "url", "thumbnail_url", "storage_path", "sort_order", "is_primary"]) {
    const result = await checkColumn("product_images", column);
    console.log(`  ${result.ok ? "OK  " : "FAIL"}  product_images.${column}${result.ok ? "" : `  ->  ${result.code ?? ""} ${result.error ?? ""}`}`);
  }

  // Sample the newest listings to confirm parcel_size + category are persisting.
  const { data: recent, error: recentError } = await admin
    .from("products")
    .select("id, title, category_id, parcel_size, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  console.log("\n[products] 5 most recent rows:");
  if (recentError) {
    console.log(`  ERROR: ${recentError.code ?? ""} ${recentError.message}`);
  } else {
    for (const row of recent ?? []) {
      console.log(
        `  ${row.created_at}  "${row.title}"  category_id=${row.category_id ?? "NULL"}  parcel_size=${row.parcel_size ?? "NULL"}  status=${row.status}`,
      );
    }
  }

  console.log("\n=== Verdict ===");
  if (missing.some((m) => m.column === "parcel_size")) {
    console.log(
      "ROOT CAUSE: products.parcel_size is MISSING. Apply the migration:\n" +
        "  npm run db:migrate   (or)   npm run db:push\n" +
        "This applies supabase/migrations/20250719000001_product_parcel_size.sql.",
    );
    process.exit(1);
  }
  if (missing.length > 0) {
    console.log(`Missing columns: ${missing.map((m) => m.column).join(", ")}. Apply pending migrations.`);
    process.exit(1);
  }
  console.log("All publish columns present. Schema is ready for publishing.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
