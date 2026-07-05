/**
 * Diagnose why published listings may be excluded from the homepage feed.
 * Usage: npx tsx scripts/diagnose-homepage-listings.ts
 */
import { loadDotEnvFiles } from "../scripts/playwright-env.mjs";
import { createAdminClient } from "../lib/supabase/admin";
import { HomepageEligibility } from "../lib/homepage/homepage-eligibility";
import { resolveHomepageMode } from "../lib/homepage/config";

loadDotEnvFiles();

async function main() {
  const admin = createAdminClient();
  const mode = resolveHomepageMode();

  console.log(`Homepage mode: ${mode}`);

  const { data: rows, error } = await admin
    .from("products")
    .select(
      `slug, title, description, status, price, category_id, moderation_status,
       profiles!products_seller_id_fkey ( email, username, verified, account_status, role ),
       product_images ( url, thumbnail_url )`,
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Query failed:", error.message);
    process.exit(1);
  }

  if (!rows?.length) {
    console.log("No published listings found.");
    return;
  }

  let eligible = 0;
  for (const row of rows) {
    const input = HomepageEligibility.fromRow({
      slug: row.slug,
      title: row.title,
      description: row.description,
      status: row.status,
      price: Number(row.price),
      category_id: row.category_id,
      moderation_status: row.moderation_status,
      profiles: row.profiles as never,
      product_images: row.product_images as never,
    });
    const result = HomepageEligibility.evaluate(input);
    if (result.eligible) {
      eligible += 1;
      console.log(`✓ ${row.slug} — eligible`);
    } else {
      console.log(`✗ ${row.slug} — ${result.reason} (moderation=${row.moderation_status}, verified=${(row.profiles as { verified?: boolean } | null)?.verified})`);
    }
  }

  console.log(`\nSummary: ${eligible}/${rows.length} recent published listings are homepage-eligible.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
