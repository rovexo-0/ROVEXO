import { createClient } from "@/lib/supabase/server";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/types/database";
import { getProductCategorySlug } from "@/lib/saved/categories";
import {
  assertSavedRowsAbsent,
  assertSavedRowsPresent,
  resolveProductIdBySlug,
} from "@/lib/saved/check";
import type { SavedItem } from "@/lib/saved/types";
import type { Product } from "@/lib/products/types";
import { isForbiddenMarketplaceInventory } from "@/lib/listings/forbidden-marketplace-inventory";
import { resolvePublicUsernameLabel } from "@/lib/profile/public-display-name-v1";
import { enrichProductsWithCanonicalSellerRating } from "@/lib/products/canonical-seller-rating-v1";

type SavedProductJoin = Tables<"products"> & {
  profiles: Pick<Tables<"profiles">, "full_name" | "avatar_url" | "verified" | "username"> | null;
  product_images: Pick<Tables<"product_images">, "url" | "is_primary" | "sort_order">[];
  categories: Pick<Tables<"categories">, "slug"> | null;
};

type SavedRow = Tables<"saved_items"> & {
  products: SavedProductJoin | null;
};

export type SavedMutationResult =
  | { ok: true; verified: true; items: SavedItem[]; saved: boolean }
  | { ok: false; verified: false; items: SavedItem[]; error: string; saved?: boolean };

function mapSavedRow(row: SavedRow & { products: SavedProductJoin }): SavedItem {
  const images = [...(row.products.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );

  const product: Product = {
    id: row.products.id,
    slug: row.products.slug,
    title: row.products.title,
    price: Number(row.products.price),
    originalPrice: row.products.original_price != null ? Number(row.products.original_price) : null,
    condition: row.products.condition,
    sellerName: resolvePublicUsernameLabel(row.products.profiles?.username, "Seller"),
    sellerId: row.products.seller_id,
    sellerUsername: row.products.profiles?.username ?? null,
    sellerAvatar: row.products.profiles?.avatar_url,
    sellerVerified: row.products.profiles?.verified,
    rating: Number(row.products.rating),
    reviewCount: row.products.review_count,
    views: row.products.views,
    likes: row.products.likes,
    imageUrl: images[0]?.url ?? "",
    sections: (row.products.sections ?? []) as Product["sections"],
  };

  return {
    productSlug: row.products.slug,
    savedAt: row.saved_at,
    lastViewedAt: row.last_viewed_at ?? row.saved_at,
    categorySlug: row.products.categories?.slug ?? getProductCategorySlug(row.products.slug),
    listingStatus: row.products.status,
    product,
  };
}

const SOLD_PRODUCT_SELECT = `
  *,
  profiles!products_seller_id_fkey ( full_name, avatar_url, verified, username ),
  product_images ( url, is_primary, sort_order ),
  categories ( slug )
`;

async function hydrateSoldProducts(
  productIds: string[],
): Promise<Map<string, SavedProductJoin>> {
  const admin = tryCreateAdminClient();
  const unique = [...new Set(productIds.filter(Boolean))];
  if (!admin || unique.length === 0) return new Map();

  const { data, error } = await admin
    .from("products")
    .select(SOLD_PRODUCT_SELECT)
    .in("id", unique)
    .eq("status", "sold");

  if (error || !data) return new Map();
  return new Map((data as SavedProductJoin[]).map((row) => [row.id, row]));
}

export async function listSavedItems(userId: string): Promise<SavedItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_items")
    .select(
      `
      *,
      products (
        *,
        profiles!products_seller_id_fkey ( full_name, avatar_url, verified, username ),
        product_images ( url, is_primary, sort_order ),
        categories ( slug )
      )
    `,
    )
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  const rows = (data as SavedRow[] | null) ?? [];
  const orphanProductIds: string[] = [];
  const live: SavedItem[] = [];
  const missingIds = rows.filter((row) => !row.products).map((row) => row.product_id);
  const soldMap = await hydrateSoldProducts(missingIds);

  for (const row of rows) {
    let product = row.products;
    // Keep sold Saved items visible even when RLS still hides sold from the join.
    if (!product) {
      product = soldMap.get(row.product_id) ?? null;
    }
    if (!product || product.status === "deleted") {
      orphanProductIds.push(row.product_id);
      continue;
    }
    if (
      isForbiddenMarketplaceInventory({
        slug: product.slug,
        title: product.title,
        description: product.description,
      })
    ) {
      continue;
    }
    live.push(mapSavedRow({ ...row, products: product }));
  }

  const boundProducts = await enrichProductsWithCanonicalSellerRating(live.map((item) => item.product));
  for (let index = 0; index < live.length; index += 1) {
    live[index] = { ...live[index], product: boundProducts[index] };
  }

  if (orphanProductIds.length) {
    void supabase
      .from("saved_items")
      .delete()
      .eq("user_id", userId)
      .in("product_id", orphanProductIds);
  }

  return live;
}

/**
 * CEO P0 unsave:
 * 1) DELETE · 2) SELECT verify absent · 3) caller clears cache · 4) refetch list.
 */
export async function removeSavedItemsVerified(
  userId: string,
  productSlugs: string[],
): Promise<SavedMutationResult> {
  const current = await listSavedItems(userId);
  if (!productSlugs.length) {
    return { ok: true, verified: true, items: current, saved: false };
  }

  const supabase = await createClient();
  const { data: products, error: lookupError } = await supabase
    .from("products")
    .select("id, slug")
    .in("slug", productSlugs);

  if (lookupError) {
    return {
      ok: false,
      verified: false,
      items: current,
      error: "Unable to resolve listing.",
      saved: true,
    };
  }

  const productIds = products?.map((product) => product.id) ?? [];

  // Nothing in DB for these slugs → already FALSE (authority satisfied).
  if (!productIds.length) {
    const items = await listSavedItems(userId);
    return { ok: true, verified: true, items, saved: false };
  }

  // STEP 1 — DELETE
  const { error: deleteError } = await supabase
    .from("saved_items")
    .delete()
    .eq("user_id", userId)
    .in("product_id", productIds);

  if (deleteError) {
    return {
      ok: false,
      verified: false,
      items: current,
      error: "DELETE failed.",
      saved: true,
    };
  }

  // STEP 2 — READ AGAIN (must not exist)
  const verify = await assertSavedRowsAbsent(userId, productIds);
  if (!verify.ok) {
    return {
      ok: false,
      verified: false,
      items: current,
      error: "VERIFY failed — saved_items row still present.",
      saved: true,
    };
  }

  // STEP 4 — REFETCH (DB only)
  const items = await listSavedItems(userId);
  const stillListed = items.some((item) => productSlugs.includes(item.productSlug));
  if (stillListed) {
    return {
      ok: false,
      verified: false,
      items,
      error: "VERIFY failed — listing still in saved list.",
      saved: true,
    };
  }

  return { ok: true, verified: true, items, saved: false };
}

/** @deprecated Prefer removeSavedItemsVerified — kept for callers expecting list only. */
export async function removeSavedItems(
  userId: string,
  productSlugs: string[],
): Promise<SavedItem[]> {
  const result = await removeSavedItemsVerified(userId, productSlugs);
  return result.items;
}

/**
 * CEO P0 save:
 * 1) UPSERT · 2) SELECT verify present · 3) caller clears cache · 4) refetch list.
 */
export async function saveItemVerified(
  userId: string,
  productSlug: string,
): Promise<SavedMutationResult> {
  const current = await listSavedItems(userId);

  // CEO: demo / showcase / mock listings must never enter saved_items.
  if (
    productSlug.startsWith("demo-") ||
    productSlug.includes("demo-listing") ||
    productSlug.startsWith("canonical-demo")
  ) {
    return {
      ok: false,
      verified: false,
      items: current,
      error: "Listing unavailable.",
      saved: false,
    };
  }

  const productId = await resolveProductIdBySlug(productSlug);
  if (!productId) {
    return {
      ok: false,
      verified: false,
      items: current,
      error: "Listing unavailable.",
      saved: false,
    };
  }

  if (productId.startsWith("demo-")) {
    return {
      ok: false,
      verified: false,
      items: current,
      error: "Listing unavailable.",
      saved: false,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("saved_items").upsert({
    user_id: userId,
    product_id: productId,
    saved_at: new Date().toISOString(),
  });

  if (error) {
    return {
      ok: false,
      verified: false,
      items: current,
      error: "SAVE failed.",
      saved: false,
    };
  }

  const verify = await assertSavedRowsPresent(userId, [productId]);
  if (!verify.ok) {
    return {
      ok: false,
      verified: false,
      items: current,
      error: "VERIFY failed — saved_items row missing after save.",
      saved: false,
    };
  }

  const items = await listSavedItems(userId);
  const present = items.some((item) => item.productSlug === productSlug);
  if (!present) {
    return {
      ok: false,
      verified: false,
      items,
      error: "VERIFY failed — listing missing from saved list.",
      saved: false,
    };
  }

  // Spring 2: seller sees "Added to favourites" with product image → listing page
  void (async () => {
    try {
      const { data: product } = await supabase
        .from("products")
        .select(
          "id, slug, title, seller_id, product_images ( url, is_primary, sort_order )",
        )
        .eq("id", productId)
        .maybeSingle();
      if (!product || product.seller_id === userId) return;
      const images = (
        product as {
          product_images?: Array<{
            url: string;
            is_primary: boolean | null;
            sort_order: number | null;
          }>;
        }
      ).product_images;
      const productImageUrl = [...(images ?? [])].sort(
        (a, b) =>
          Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)) ||
          (a.sort_order ?? 0) - (b.sort_order ?? 0),
      )[0]?.url;
      const { emitSmartNotification } = await import("@/lib/notifications/events");
      await emitSmartNotification({
        userId: product.seller_id,
        eventType: "listing_sold",
        idempotencyKey: `favourite:${productId}:${userId}`,
        notificationType: "system",
        title: "Added to favourites",
        subtitle: "Someone favourited your listing",
        detail: product.title,
        href: `/listing/${encodeURIComponent(product.slug)}`,
        avatarUrl: productImageUrl,
        avatarName: product.title,
        payload: { productId, productSlug: product.slug },
      });
    } catch {
      /* fail-closed — save already verified */
    }
  })();

  return { ok: true, verified: true, items, saved: true };
}

/** Returns true when a `saved_items` row was written and verified. */
export async function saveItem(userId: string, productSlug: string): Promise<boolean> {
  const result = await saveItemVerified(userId, productSlug);
  return result.ok && result.saved === true;
}
