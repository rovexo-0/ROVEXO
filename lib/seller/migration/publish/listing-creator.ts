import { createAdminClient } from "@/lib/supabase/admin";
import { resolveCategoryIdBySlugPath } from "@/lib/categories/server";
import type { MigrationNormalizedListing } from "@/lib/seller/migration/engine/types";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";

function slugify(title: string): string {
  return `${title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)}-${Date.now().toString(36)}`;
}

async function resolveBrandId(brand?: string): Promise<string | null> {
  if (!brand?.trim()) return null;
  const admin = createAdminClient();
  const slug = brand.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const { data: existing } = await admin.from("brands").select("id").eq("slug", slug).maybeSingle();
  if (existing?.id) return existing.id;
  const { data: created } = await admin
    .from("brands")
    .insert({ name: brand.trim(), slug })
    .select("id")
    .single();
  return created?.id ?? null;
}

export async function createMigrationListing(input: {
  sellerId: string;
  listing: MigrationNormalizedListing;
  status: "draft" | "published";
}): Promise<string | null> {
  const admin = createAdminClient();
  const { listing, sellerId, status } = input;

  let categoryId: string | null = null;
  if (listing.categorySlug) {
    categoryId = await resolveCategoryIdBySlugPath([listing.categorySlug]);
  }

  const brandId = await resolveBrandId(listing.brand);
  const slug = slugify(listing.title);
  const stock = listing.quantity ?? 1;

  const { data: product, error } = await admin
    .from("products")
    .insert({
      seller_id: sellerId,
      slug,
      title: listing.title,
      description: listing.description ?? listing.title,
      brand_id: brandId,
      category_id: categoryId,
      color: listing.colour ?? null,
      size: listing.size ?? null,
      condition: listing.condition ?? "used",
      price: listing.price,
      accept_offers: false,
      delivery_carriers: ["Royal Mail", "Evri"],
      status,
      stock,
      sku: listing.sku ?? null,
      low_stock_alert: 5,
      sections: status === "published" ? ["new"] : [],
      listing_type: "fixed",
    })
    .select("id")
    .single();

  if (error || !product) return null;

  const images = listing.processedImages?.length
    ? listing.processedImages
    : (listing.imageUrls ?? []).map((url, index) => ({
        url,
        thumbnailUrl: url,
        sortOrder: index,
        optimized: false,
      }));

  if (images.length) {
    await admin.from("product_images").insert(
      images.map((image, index) => ({
        product_id: product.id,
        url: image.url || PRODUCT_IMAGE_FALLBACK,
        thumbnail_url: image.thumbnailUrl || image.url || PRODUCT_IMAGE_FALLBACK,
        storage_path: `migration/${sellerId}/${product.id}/${index}.jpg`,
        sort_order: image.sortOrder ?? index,
        is_primary: index === 0,
      })),
    );
  }

  return product.id;
}

export async function deleteMigrationDraftListing(
  sellerId: string,
  productId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("products")
    .select("id, status")
    .eq("id", productId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (!data || data.status !== "draft") return false;

  await admin.from("product_images").delete().eq("product_id", productId);
  const { error } = await admin.from("products").delete().eq("id", productId);
  return !error;
}
