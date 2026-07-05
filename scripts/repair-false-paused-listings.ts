import { loadDotEnvFiles } from "./playwright-env.mjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { scanListingBeforePublish } from "@/lib/moderation/scan-listing";

loadDotEnvFiles();

async function main(): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .select(
      "id, seller_id, slug, title, description, status, moderation_status, brands(name), product_images(storage_path, url)",
    )
    .eq("status", "paused")
    .eq("moderation_status", "blocked")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  let repaired = 0;
  for (const row of data ?? []) {
    const brand = (row.brands as { name?: string } | null)?.name;
    const images =
      (row.product_images as Array<{ storage_path: string | null; url: string }> | null) ?? [];

    const scan = await scanListingBeforePublish({
      sellerId: row.seller_id,
      productId: row.id,
      title: row.title,
      description: row.description ?? "",
      brand,
      imageNames: images.map((image) => image.storage_path || image.url),
    });

    if (scan.result.decision === "blocked") {
      console.log(`KEEP paused: ${row.slug} (${scan.result.summary})`);
      continue;
    }

    const { error: updateError } = await admin
      .from("products")
      .update({
        status: "published",
        moderation_status: scan.result.decision,
        moderation_summary: "Re-published after moderation false-positive correction",
        sections: ["new", "trending", "recommended"],
      })
      .eq("id", row.id);

    if (updateError) {
      console.error(`FAIL ${row.slug}:`, updateError.message);
      continue;
    }

    repaired += 1;
    console.log(`REPUBLISHED: ${row.slug}`);
  }

  console.log(JSON.stringify({ repaired, scanned: data?.length ?? 0 }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
