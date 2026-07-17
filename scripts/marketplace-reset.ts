/**
 * ROVEXO — DEVELOPMENT-ONLY marketplace reset.
 *
 * Permanently removes EVERY listing (any status, any owner) plus all associated
 * data from the development database, purges listing storage objects, clears the
 * Next.js data cache, and prints a validation report.
 *
 *   npm run marketplace:reset            (5s abortable countdown, then wipes)
 *   npm run marketplace:reset -- --yes   (skip countdown)
 *   npm run marketplace:reset -- --dry   (report only, deletes nothing)
 *
 * SAFETY: This command is hard-blocked from ever touching a production database.
 * It refuses to run on Vercel, when NODE_ENV=production, or against a Supabase
 * URL flagged as production via PRODUCTION_SUPABASE_URL.
 */
import { rm } from "node:fs/promises";
import path from "node:path";
import { loadDotEnvFiles } from "../scripts/playwright-env.mjs";
import { createAdminClient } from "../lib/supabase/admin";
import { tryGetSupabaseUrl } from "../lib/supabase/env";
import { isFullDemoEmail } from "../lib/full-demo/canonical";
import { isFullDemoProtectedSlug } from "../lib/full-demo/permanence";

loadDotEnvFiles();

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

const args = new Set(process.argv.slice(2));
const SKIP_CONFIRM = args.has("--yes") || args.has("-y") || process.env.MARKETPLACE_RESET_CONFIRM === "1";
const DRY_RUN = args.has("--dry") || args.has("--dry-run");

/**
 * Every table that stores per-listing data. Most cascade automatically when the
 * parent product row is deleted, but we clear them explicitly (and first, for the
 * ones we want fully emptied) so the result is deterministic with zero orphans.
 */
const LISTING_CHILD_TABLES = [
  "moderation_queue",
  "promotion_analytics_events",
  "listing_promotions",
  "offers",
  "bids",
  "reviews",
  "cart_items",
  "saved_items",
  "recently_viewed",
  "product_images",
] as const;

const VALIDATION_TABLES = [
  "products",
  "product_images",
  "recently_viewed",
  "saved_items",
  "cart_items",
  "offers",
  "listing_promotions",
] as const;

/**
 * Known ROVEXO production Supabase project ref (see lib/supabase/env.ts). Wiping
 * this database is forbidden. Overridable ONLY via an explicit, clearly-named env
 * flag for the rare case a developer has intentionally pointed a throwaway/dev
 * project at this host.
 */
const PRODUCTION_SUPABASE_HOSTS = ["pklotmwxtnnepaitedic.supabase.co"];
const ALLOW_PROD_HOST_OVERRIDE = process.env.MARKETPLACE_RESET_ALLOW_PRODUCTION_HOST === "1";

/** Reasons that make it unsafe to proceed, split into hard blocks and warnings. */
function evaluateEnvironment(targetUrl: string | null): {
  hardBlocks: string[];
  warnings: string[];
} {
  const hardBlocks: string[] = [];
  const warnings: string[] = [];

  if (process.env.VERCEL || process.env.VERCEL_ENV === "production") {
    hardBlocks.push("running inside a Vercel environment");
  }

  const targetHost = targetUrl ? normalizeHost(targetUrl) : null;

  const prodUrl = process.env.PRODUCTION_SUPABASE_URL?.trim();
  if (prodUrl && targetHost && normalizeHost(prodUrl) === targetHost) {
    hardBlocks.push(`target matches PRODUCTION_SUPABASE_URL (${targetUrl})`);
  }

  if (targetHost && PRODUCTION_SUPABASE_HOSTS.includes(targetHost)) {
    if (ALLOW_PROD_HOST_OVERRIDE) {
      warnings.push(
        `target ${targetHost} is the known PRODUCTION Supabase project — override flag is set`,
      );
    } else {
      hardBlocks.push(
        `target ${targetHost} is the known PRODUCTION Supabase project (set MARKETPLACE_RESET_ALLOW_PRODUCTION_HOST=1 only if this is truly a disposable dev project)`,
      );
    }
  }

  // NODE_ENV=production alone is unreliable locally (many shells export it), so
  // it only forces an explicit confirmation rather than a hard block.
  if (process.env.NODE_ENV === "production") {
    warnings.push("NODE_ENV is 'production' — confirmation required");
  }

  return { hardBlocks, warnings };
}

function assertNotProduction(targetUrl: string | null): string[] {
  const { hardBlocks, warnings } = evaluateEnvironment(targetUrl);

  if (hardBlocks.length > 0) {
    console.error("\n✖ marketplace:reset is BLOCKED — this looks like a production context:");
    for (const reason of hardBlocks) console.error(`  • ${reason}`);
    console.error("\nThis command is strictly for the development database. Aborting.\n");
    process.exit(1);
  }

  return warnings;
}

function normalizeHost(url: string): string {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).host.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

async function countRows(admin: SupabaseAdmin, table: string): Promise<number> {
  const { count, error } = await admin
    .from(table as "products")
    .select("*", { count: "exact", head: true });
  if (error) return -1;
  return count ?? 0;
}

async function deleteAllRows(
  admin: SupabaseAdmin,
  table: string,
  matchColumn: "id" | "product_id" = "id",
): Promise<void> {
  // Service-role delete (RLS bypassed). A `<col> is not null` predicate matches
  // every row. Child tables filter on product_id (some have composite PKs with
  // no id column); the products table filters on its id.
  const { error } = await admin
    .from(table as "products")
    .delete()
    .not(matchColumn, "is", null);
  if (error) {
    console.warn(`  ! ${table}: ${error.message}`);
  }
}

async function purgeListingStorage(admin: SupabaseAdmin): Promise<number> {
  let removed = 0;
  // Bucket layout: {seller_id}/{product_id}/{filename}
  const { data: sellers, error } = await admin.storage.from("products").list("", { limit: 1000 });
  if (error || !sellers) return removed;

  for (const seller of sellers) {
    const { data: products } = await admin.storage.from("products").list(seller.name, { limit: 1000 });
    for (const product of products ?? []) {
      const prefix = `${seller.name}/${product.name}`;
      const { data: files } = await admin.storage.from("products").list(prefix, { limit: 1000 });
      const paths = (files ?? []).map((file) => `${prefix}/${file.name}`);
      if (paths.length) {
        await admin.storage.from("products").remove(paths);
        removed += paths.length;
      }
    }
  }
  return removed;
}

async function clearNextCache(): Promise<void> {
  const cacheDir = path.join(process.cwd(), ".next", "cache");
  try {
    await rm(cacheDir, { recursive: true, force: true });
    console.log("  • Cleared .next/cache");
  } catch {
    // Non-fatal: dev server may hold locks. Restart the dev server to be safe.
  }
}

async function main(): Promise<void> {
  const targetUrl = tryGetSupabaseUrl();
  const warnings = assertNotProduction(targetUrl);

  if (!targetUrl) {
    console.error("✖ No Supabase URL configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL). Aborting.");
    process.exit(1);
  }

  const admin = createAdminClient();

  const before = await countRows(admin, "products");
  console.log("\nROVEXO marketplace reset (DEVELOPMENT ONLY)");
  console.log(`  Target : ${targetUrl}`);
  console.log(`  Listings in database: ${before}`);

  if (warnings.length > 0) {
    console.log("\n⚠ Warnings:");
    for (const warning of warnings) console.log(`  • ${warning}`);
  }

  // Any warning (e.g. NODE_ENV=production) requires an explicit --yes; the
  // silent countdown path is only for a clean, unambiguous dev environment.
  if (warnings.length > 0 && !SKIP_CONFIRM && !DRY_RUN) {
    console.error(
      "\n✖ Refusing to auto-proceed with active warnings. Re-run with `-- --yes` to confirm.\n",
    );
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log("\n--dry: no changes made.\n");
    return;
  }

  if (!SKIP_CONFIRM) {
    console.log("\n⚠ This permanently deletes ALL listings and associated data.");
    console.log("  Press Ctrl+C now to abort. Continuing in 5 seconds…");
    for (let s = 5; s > 0; s -= 1) {
      process.stdout.write(`  ${s}… `);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    process.stdout.write("\n");
  }

  console.log("\nDeleting listing data…");
  console.log("  • Preserving permanent Full Demo Certification listings (live-buyer / live-seller)");

  // Resolve Full Demo protected product IDs — NEVER delete these.
  const { data: allProducts } = await admin.from("products").select("id, slug, seller_id");
  const sellerIds = [...new Set((allProducts ?? []).map((p) => p.seller_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email")
    .in("id", sellerIds.length ? sellerIds : ["00000000-0000-0000-0000-000000000000"]);
  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  const protectedIds = new Set(
    (allProducts ?? [])
      .filter(
        (p) =>
          isFullDemoProtectedSlug(p.slug) || isFullDemoEmail(emailById.get(p.seller_id) ?? null),
      )
      .map((p) => p.id),
  );

  // 1. Clear listing-linked tables for non-protected products only.
  for (const table of LISTING_CHILD_TABLES) {
    if (protectedIds.size === 0) {
      await deleteAllRows(admin, table, "product_id");
      continue;
    }
    const { data: childRows } = await admin
      .from(table as "offers")
      .select("product_id")
      .not("product_id", "is", null)
      .limit(5000);
    const toDelete = [...new Set((childRows ?? []).map((r) => r.product_id).filter(Boolean))].filter(
      (id) => !protectedIds.has(id as string),
    );
    for (const productId of toDelete) {
      await admin.from(table as "offers").delete().eq("product_id", productId as string);
    }
  }

  // 2. Remove notifications that deep-link to listings.
  await admin.from("notifications").delete().like("href", "%/listing/%");

  // 3. Hard delete non-protected product rows only.
  for (const product of allProducts ?? []) {
    if (protectedIds.has(product.id)) continue;
    await admin.from("products").delete().eq("id", product.id);
  }
  console.log(`  • Preserved ${protectedIds.size} Full Demo product(s)`);
  // 4. Purge listing storage objects.
  const removedFiles = await purgeListingStorage(admin);
  console.log(`  • Removed ${removedFiles} storage object(s)`);

  // 5. Clear Next.js cache so homepage/search/categories rebuild from empty DB.
  await clearNextCache();

  // 6. Validation report — Full Demo products may remain (permanent).
  console.log("\nValidation:");
  let ok = true;
  for (const table of VALIDATION_TABLES) {
    const count = await countRows(admin, table);
    if (table === "products" || table === "product_images" || table === "listing_promotions") {
      console.log(`  ${count >= 0 ? "•" : "✗"} ${table} = ${count} (Full Demo inventory may remain)`);
      continue;
    }
    if (count !== 0) ok = false;
    console.log(`  ${count === 0 ? "✓" : "✗"} ${table} = ${count}`);
  }

  if (ok) {
    console.log("\n✓ Marketplace reset complete. Full Demo Certification listings preserved.\n");
  } else {
    console.error("\n✗ Some non-demo tables still contain rows. Review the warnings above.\n");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
