import { createAdminClient } from "@/lib/supabase/admin";
import { searchCategories } from "@/lib/taxonomy/category-search";
import type { MigrationNormalizedListing } from "@/lib/seller/migration/engine/types";

export async function getRememberedCategoryMapping(
  sellerId: string,
  platform: string,
  sourceCategory: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("store_migration_category_mappings")
    .select("rovexo_category_slug")
    .eq("seller_id", sellerId)
    .eq("platform", platform)
    .eq("source_category", sourceCategory)
    .maybeSingle();

  return data?.rovexo_category_slug ?? null;
}

export async function rememberCategoryMapping(
  sellerId: string,
  platform: string,
  sourceCategory: string,
  rovexoCategorySlug: string,
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("store_migration_category_mappings").upsert(
    {
      seller_id: sellerId,
      platform,
      source_category: sourceCategory,
      rovexo_category_slug: rovexoCategorySlug,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "seller_id,platform,source_category" },
  );
}

export async function mapListingCategory(
  listing: MigrationNormalizedListing,
  sellerId: string,
  platform: string,
): Promise<MigrationNormalizedListing> {
  const sourceCategory = listing.sourceCategory?.trim();
  if (!sourceCategory) {
    return { ...listing, warnings: [...listing.warnings, "Category not mapped"] };
  }

  const remembered = await getRememberedCategoryMapping(sellerId, platform, sourceCategory);
  if (remembered) {
    return {
      ...listing,
      categorySlug: remembered,
      categoryPath: [remembered],
    };
  }

  const results = searchCategories(sourceCategory, { limit: 3 });
  const top = results[0]?.category;
  if (top?.slug) {
    await rememberCategoryMapping(sellerId, platform, sourceCategory, top.slug);
    return {
      ...listing,
      categorySlug: top.slug,
      categoryPath: [top.slug],
    };
  }

  return {
    ...listing,
    warnings: [...listing.warnings, `Unmapped category: ${sourceCategory}`],
  };
}
