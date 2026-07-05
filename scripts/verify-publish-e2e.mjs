#!/usr/bin/env node
/**
 * End-to-end publish verification for the Sell flow.
 *
 * Mirrors the exact write path in lib/listings/repository.ts#createSellerListing
 * (products insert WITH parcel_size + product_images insert), then:
 *   1. confirms the row persists with parcel_size,
 *   2. confirms it is visible via the marketplace-style published query,
 *   3. deletes the temporary test listing so the live marketplace is not polluted.
 *
 * Usage (from repo root, with .env.local containing your Supabase keys):
 *   node scripts/verify-publish-e2e.mjs
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
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(2);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

function fail(msg, extra) {
  console.log(`\nFAIL: ${msg}`);
  if (extra) console.log(extra);
  process.exit(1);
}

async function main() {
  console.log("=== ROVEXO publish end-to-end verification ===\n");

  // Reuse a real seller + a real leaf category so FK/NOT NULL constraints pass,
  // exactly like a genuine publish would.
  const { data: seller } = await admin
    .from("products")
    .select("seller_id")
    .not("seller_id", "is", null)
    .limit(1)
    .single();
  if (!seller?.seller_id) fail("Could not find an existing seller_id to test with.");

  const { data: category } = await admin
    .from("categories")
    .select("id, path_label")
    .limit(1)
    .single();
  if (!category?.id) fail("Could not find an existing category to test with.");

  console.log(`seller_id  = ${seller.seller_id}`);
  console.log(`category_id= ${category.id} (${category.path_label ?? "n/a"})`);

  const stamp = Date.now().toString(36);
  const slug = `e2e-parcel-test-${stamp}`;

  // Same shape as repository.createSellerListing productInsert, with parcel_size set.
  const productInsert = {
    seller_id: seller.seller_id,
    slug,
    title: "E2E parcel-size publish test",
    description: "Temporary listing created by verify-publish-e2e.mjs to confirm parcel_size persists.",
    category_id: category.id,
    condition: "good",
    price: 9.99,
    accept_offers: false,
    delivery_carriers: ["Royal Mail", "Evri"],
    shipping_method: "delivery_available",
    shipping_price: null,
    parcel_size: "medium",
    status: "published",
    stock: 1,
    low_stock_alert: 5,
    sections: ["new", "trending", "recommended"],
    listing_type: "fixed",
  };

  console.log("\n[1/4] Inserting product WITH parcel_size='medium' ...");
  const { data: product, error: insertError } = await admin
    .from("products")
    .insert(productInsert)
    .select("id")
    .single();

  if (insertError || !product) {
    fail("product insert failed (this is the real publish error).", JSON.stringify(insertError, null, 2));
  }
  console.log(`      inserted product id=${product.id}`);

  // Mirror the product_images insert.
  const { error: imageError } = await admin.from("product_images").insert({
    product_id: product.id,
    url: "https://example.com/e2e-test.jpg",
    thumbnail_url: "https://example.com/e2e-test.jpg",
    storage_path: `e2e/${slug}.jpg`,
    sort_order: 0,
    is_primary: true,
  });
  if (imageError) fail("product_images insert failed.", JSON.stringify(imageError, null, 2));
  console.log("      inserted 1 product image (primary)");

  console.log("\n[2/4] Reading row back to confirm parcel_size persisted ...");
  const { data: readback, error: readError } = await admin
    .from("products")
    .select("id, title, parcel_size, category_id, status")
    .eq("id", product.id)
    .single();
  if (readError) fail("readback failed.", JSON.stringify(readError, null, 2));
  console.log(`      parcel_size=${readback.parcel_size}  status=${readback.status}  category_id=${readback.category_id}`);
  if (readback.parcel_size !== "medium") fail(`parcel_size did not persist (got ${readback.parcel_size}).`);

  console.log("\n[3/4] Confirming marketplace visibility (status=published query) ...");
  const { data: visible, error: visibleError } = await admin
    .from("products")
    .select("id, title, price, status, product_images ( url, is_primary )")
    .eq("id", product.id)
    .eq("status", "published")
    .single();
  if (visibleError || !visible) fail("listing not visible in published query.", JSON.stringify(visibleError, null, 2));
  console.log(`      visible: "${visible.title}"  £${visible.price}  images=${visible.product_images?.length ?? 0}`);

  console.log("\n[4/4] Cleaning up temporary test listing ...");
  await admin.from("product_images").delete().eq("product_id", product.id);
  const { error: delError } = await admin.from("products").delete().eq("id", product.id);
  if (delError) {
    console.log(`      WARNING: cleanup failed, remove manually: product id=${product.id}`);
  } else {
    console.log("      removed test product + image");
  }

  console.log("\n=== RESULT ===");
  console.log("PASS: publish write path works end-to-end with parcel_size persisted and marketplace-visible.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
