import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables, TablesUpdate, ProductStatus } from "@/lib/supabase/types/database";
import type { Product, ProductSection } from "@/lib/products/types";
import { buildProductImagePath } from "@/lib/storage/server-images";
import { getPublicStorageUrl } from "@/lib/storage/upload";
import { formatPromotionRemaining, isPromotionActive } from "@/lib/promotions/format";
import { refreshExpiredPromotions } from "@/lib/promotions/service";
import type {
  CreateListingInput,
  ListingFilter,
  ListingImage,
  ListingImageInput,
  SearchListingsOptions,
  SearchListingsResult,
  SellerListing,
  UpdateListingInput,
} from "@/lib/listings/types";

const PAGE_SIZE = 8;

type ProductRow = Tables<"products"> & {
  profiles?: Pick<Tables<"profiles">, "full_name" | "avatar_url" | "verified"> | null;
  product_images?: Tables<"product_images">[];
  brands?: Pick<Tables<"brands">, "name"> | null;
  categories?: Pick<Tables<"categories">, "path_label"> | null;
};

const LISTING_SELECT = `
  *,
  product_images (*),
  brands ( name ),
  categories ( path_label )
`;

function slugify(title: string): string {
  return `${title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)}-${Date.now().toString(36)}`;
}

function mapImages(rows: Tables<"product_images">[] | undefined): ListingImage[] {
  return [...(rows ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => ({
      id: row.id,
      url: row.url,
      thumbnailUrl: row.thumbnail_url ?? row.url,
      storagePath: row.storage_path ?? "",
      sortOrder: row.sort_order,
      isPrimary: row.is_primary,
    }));
}

function mapSellerListing(row: ProductRow): SellerListing {
  const images = mapImages(row.product_images);
  const primary = images.find((image) => image.isPrimary) ?? images[0];

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    brand: row.brands?.name ?? null,
    brandId: row.brand_id,
    categoryId: row.category_id,
    categoryPath: row.categories?.path_label ?? null,
    color: row.color,
    size: row.size,
    condition: row.condition,
    price: Number(row.price),
    acceptOffers: row.accept_offers,
    status: row.status,
    stock: row.stock,
    sku: row.sku,
    lowStockAlert: row.low_stock_alert,
    views: row.views,
    likes: row.likes,
    imageUrl: primary?.url ?? "/placeholder-product.png",
    thumbnailUrl: primary?.thumbnailUrl ?? null,
    images,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isLowStock: row.stock > 0 && row.stock <= row.low_stock_alert,
    isOutOfStock: row.stock <= 0,
    bumpCount: row.bump_count ?? 0,
    promotionScore: row.promotion_score ?? 0,
    lastBumpedAt: row.last_bumped_at,
    bumpedUntil: row.bumped_until ?? null,
    featuredUntil: row.featured_until,
    isBumped: isPromotionActive(row.bumped_until),
    isFeatured: isPromotionActive(row.featured_until),
    bumpRemainingLabel: formatPromotionRemaining(row.bumped_until),
    featureRemainingLabel: formatPromotionRemaining(row.featured_until),
  };
}

function mapProductRow(row: ProductRow): Product {
  const images = mapImages(row.product_images);
  const primary = images.find((image) => image.isPrimary) ?? images[0];

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: Number(row.price),
    originalPrice: row.original_price != null ? Number(row.original_price) : null,
    condition: row.condition,
    brand: row.brands?.name,
    sellerName: row.profiles?.full_name ?? "Seller",
    sellerAvatar: row.profiles?.avatar_url,
    sellerVerified: row.profiles?.verified ?? false,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    views: row.views,
    likes: row.likes,
    imageUrl: primary?.url ?? "/placeholder-product.png",
    sections: (row.sections ?? []) as ProductSection[],
    isFeatured: isPromotionActive(row.featured_until),
    isBumped: isPromotionActive(row.bumped_until),
  };
}

export async function getSellerListings(
  sellerId: string,
  filter: ListingFilter = "all",
): Promise<SellerListing[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ownerId = user?.id ?? sellerId;

  const { data, error } = await supabase
    .from("products")
    .select(LISTING_SELECT)
    .eq("seller_id", ownerId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  let listings = (data as ProductRow[]).map(mapSellerListing);

  switch (filter) {
    case "draft":
      listings = listings.filter((listing) => listing.status === "draft");
      break;
    case "paused":
      listings = listings.filter((listing) => listing.status === "paused");
      break;
    case "sold":
      listings = listings.filter((listing) => listing.status === "sold");
      break;
    case "published":
      listings = listings.filter(
        (listing) => listing.status === "published" && listing.stock > 0,
      );
      break;
    case "out_of_stock":
      listings = listings.filter(
        (listing) =>
          (listing.status === "published" || listing.status === "paused") &&
          listing.stock <= 0,
      );
      break;
    case "low_stock":
      listings = listings.filter(
        (listing) =>
          (listing.status === "published" || listing.status === "paused") &&
          listing.isLowStock,
      );
      break;
    default:
      break;
  }

  return listings;
}

async function resolveBrandId(brandName?: string): Promise<string | null> {
  if (!brandName?.trim()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("find_or_create_brand", {
    brand_name: brandName.trim(),
  });
  if (error || !data) return null;
  return data as string;
}

async function moveImageToProductFolder(
  image: ListingImageInput,
  sellerId: string,
  productId: string,
): Promise<ListingImageInput> {
  if (!image.storagePath.includes("/temp/")) {
    return image;
  }

  const admin = createAdminClient();
  const filename = image.storagePath.split("/").pop()!;
  const newPath = buildProductImagePath(sellerId, productId, filename);
  const oldThumbPath = image.storagePath.replace(/\.jpg$/, "-thumb.jpg");
  const newThumbPath = newPath.replace(/\.jpg$/, "-thumb.jpg");

  await admin.storage.from("products").copy(image.storagePath, newPath);
  await admin.storage.from("products").copy(oldThumbPath, newThumbPath);

  const pathsToRemove = [image.storagePath, oldThumbPath];
  await admin.storage.from("products").remove(pathsToRemove);

  const moved = {
    ...image,
    url: getPublicStorageUrl("products", newPath),
    thumbnailUrl: getPublicStorageUrl("products", newThumbPath),
    storagePath: newPath,
  };
  return moved;
}

async function insertProductImages(
  productId: string,
  sellerId: string,
  images: ListingImageInput[],
): Promise<void> {
  const supabase = await createClient();
  const normalized = await Promise.all(
    images.map((image) => moveImageToProductFolder(image, sellerId, productId)),
  );

  const { error } = await supabase
    .from("product_images")
    .insert(
      normalized.map((image, index) => ({
        product_id: productId,
        url: image.url,
        thumbnail_url: image.thumbnailUrl ?? image.url,
        storage_path: image.storagePath,
        sort_order: image.sortOrder ?? index,
        is_primary: image.isPrimary ?? index === 0,
      })),
    )
    .select();

  if (error) {
    throw error;
  }
}

export async function getSellerListingById(
  sellerId: string,
  productId: string,
): Promise<SellerListing | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ownerId = user?.id ?? sellerId;

  const { data, error } = await supabase
    .from("products")
    .select(LISTING_SELECT)
    .eq("id", productId)
    .eq("seller_id", ownerId)
    .neq("status", "deleted")
    .maybeSingle();

  if (error) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("products")
      .select("*, product_images (*), brands ( name )")
      .eq("id", productId)
      .eq("seller_id", ownerId)
      .neq("status", "deleted")
      .maybeSingle();

    if (fallbackError || !fallbackData) {
      return null;
    }

    return mapSellerListing(fallbackData as ProductRow);
  }

  return data ? mapSellerListing(data as ProductRow) : null;
}

export async function createSellerListing(
  input: CreateListingInput,
): Promise<SellerListing | null> {
  const supabase = await createClient();
  const brandId = await resolveBrandId(input.brand);
  const slug = slugify(input.title);
  const status: ProductStatus = input.status ?? "published";
  const stock = input.inventory?.stock ?? 1;

  const sections: ProductSection[] =
    status === "published" ? ["new", "trending", "recommended"] : [];

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      seller_id: input.sellerId,
      slug,
      title: input.title,
      description: input.description,
      brand_id: brandId,
      category_id: input.categoryId,
      color: input.color,
      size: input.size,
      condition: input.condition,
      price: input.price,
      accept_offers: input.acceptOffers,
      status,
      stock,
      sku: input.inventory?.sku,
      low_stock_alert: input.inventory?.lowStockAlert ?? 5,
      sections,
    })
    .select("id")
    .single();

  if (error || !product) {
    return null;
  }

  await insertProductImages(product.id, input.sellerId, input.images);

  return getSellerListingById(input.sellerId, product.id);
}

export async function updateSellerListing(
  sellerId: string,
  productId: string,
  input: UpdateListingInput,
): Promise<SellerListing | null> {
  const supabase = await createClient();
  const existing = await getSellerListingById(sellerId, productId);
  if (!existing) return null;

  const brandId =
    input.brand !== undefined ? await resolveBrandId(input.brand) : existing.brandId;

  const patch: TablesUpdate<"products"> = {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.brand !== undefined && { brand_id: brandId }),
    ...(input.categoryId !== undefined && { category_id: input.categoryId }),
    ...(input.color !== undefined && { color: input.color }),
    ...(input.size !== undefined && { size: input.size }),
    ...(input.condition !== undefined && { condition: input.condition }),
    ...(input.price !== undefined && { price: input.price }),
    ...(input.acceptOffers !== undefined && { accept_offers: input.acceptOffers }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.inventory?.stock !== undefined && { stock: input.inventory.stock }),
    ...(input.inventory?.sku !== undefined && { sku: input.inventory.sku }),
    ...(input.inventory?.lowStockAlert !== undefined && {
      low_stock_alert: input.inventory.lowStockAlert,
    }),
  };

  if (Object.keys(patch).length > 0) {
    const { error: updateError } = await supabase
      .from("products")
      .update(patch)
      .eq("id", productId)
      .eq("seller_id", sellerId);

    if (updateError) {
      return null;
    }
  }

  if (input.removeImageIds?.length) {
    const toRemove = existing.images.filter((image) =>
      input.removeImageIds!.includes(image.id),
    );
    await deleteStoragePaths(toRemove.map((image) => image.storagePath).filter(Boolean));
    const { error: removeError } = await supabase
      .from("product_images")
      .delete()
      .in("id", input.removeImageIds);

    if (removeError) {
      return null;
    }
  }

  if (input.images?.length) {
    const { error: clearError } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", productId);

    if (clearError) {
      return null;
    }

    await insertProductImages(productId, sellerId, input.images);
  }

  return getSellerListingById(sellerId, productId);
}

export async function deleteSellerListing(
  sellerId: string,
  productId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const listing = await getSellerListingById(sellerId, productId);
  if (!listing) return false;

  const storagePaths = listing.images.map((image) => image.storagePath).filter(Boolean);
  await deleteStoragePaths(storagePaths);

  await supabase.from("product_images").delete().eq("product_id", productId);
  await supabase
    .from("products")
    .update({ status: "deleted" as ProductStatus })
    .eq("id", productId)
    .eq("seller_id", sellerId);

  return true;
}

export async function duplicateSellerListing(
  sellerId: string,
  productId: string,
): Promise<SellerListing | null> {
  const existing = await getSellerListingById(sellerId, productId);
  if (!existing) return null;

  return createSellerListing({
    sellerId,
    title: `${existing.title} (Copy)`,
    description: existing.description,
    brand: existing.brand ?? undefined,
    color: existing.color ?? undefined,
    size: existing.size ?? undefined,
    condition: existing.condition,
    price: existing.price,
    acceptOffers: existing.acceptOffers,
    categoryId: existing.categoryId,
    status: "draft",
    inventory: {
      sku: existing.sku ? `${existing.sku}-COPY` : null,
      stock: existing.stock,
      lowStockAlert: existing.lowStockAlert,
    },
    images: existing.images.map((image, index) => ({
      url: image.url,
      thumbnailUrl: image.thumbnailUrl,
      storagePath: image.storagePath,
      sortOrder: index,
      isPrimary: index === 0,
    })),
  });
}

export async function setListingStatus(
  sellerId: string,
  productId: string,
  status: ProductStatus,
): Promise<SellerListing | null> {
  const supabase = await createClient();
  const sections: ProductSection[] =
    status === "published" ? ["new", "trending", "recommended"] : [];

  await supabase
    .from("products")
    .update({ status, sections })
    .eq("id", productId)
    .eq("seller_id", sellerId);

  return getSellerListingById(sellerId, productId);
}

async function deleteStoragePaths(paths: string[]): Promise<void> {
  if (!paths.length) return;
  const admin = createAdminClient();
  await admin.storage.from("products").remove(paths);
}

export async function deleteStorageFolder(prefix: string): Promise<void> {
  const admin = createAdminClient();
  const { data: files } = await admin.storage.from("products").list(prefix);
  if (!files?.length) return;
  const paths = files.map((file) => `${prefix}/${file.name}`);
  await admin.storage.from("products").remove(paths);
}

export async function incrementProductViews(slug: string): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("increment_product_views", { product_slug: slug });
}

export async function searchListings(
  options: SearchListingsOptions,
): Promise<SearchListingsResult> {
  await refreshExpiredPromotions();

  const supabase = await createClient();
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select(
      `*, profiles!products_seller_id_fkey ( full_name, avatar_url, verified ), product_images (*), brands ( name )`,
      { count: "exact" },
    )
    .eq("status", "published");

  if (options.query?.trim()) {
    const term = options.query.trim();
    const { data: brandMatches } = await supabase
      .from("brands")
      .select("id")
      .ilike("name", `%${term}%`);
    const brandIds = brandMatches?.map((brand) => brand.id) ?? [];

    const { data: sellerMatches } = await supabase
      .from("profiles")
      .select("id")
      .or(`full_name.ilike.%${term}%,username.ilike.%${term}%`);
    const sellerIds = sellerMatches?.map((seller) => seller.id) ?? [];

    const filters = [
      `title.ilike.%${term}%`,
      `description.ilike.%${term}%`,
      `condition.ilike.%${term}%`,
    ];

    if (brandIds.length) {
      filters.push(`brand_id.in.(${brandIds.join(",")})`);
    }
    if (sellerIds.length) {
      filters.push(`seller_id.in.(${sellerIds.join(",")})`);
    }

    query = query.or(filters.join(","));
  }

  if (options.sellerId) {
    query = query.eq("seller_id", options.sellerId);
  }

  if (options.categoryIds?.length) {
    query = query.in("category_id", options.categoryIds);
  } else if (options.categorySlugPath?.length) {
    const { resolveCategoryIdBySlugPath, getDescendantCategoryIds } = await import(
      "@/lib/categories/server"
    );
    const rootId = await resolveCategoryIdBySlugPath(options.categorySlugPath);
    if (rootId) {
      const ids = await getDescendantCategoryIds(rootId);
      query = query.in("category_id", ids);
    } else {
      return { items: [], total: 0, page, hasMore: false };
    }
  } else if (options.categorySlug) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", options.categorySlug)
      .maybeSingle();
    if (category) query = query.eq("category_id", category.id);
  }

  if (options.minPrice != null) {
    query = query.gte("price", options.minPrice);
  }

  if (options.maxPrice != null) {
    query = query.lte("price", options.maxPrice);
  }

  if (options.conditions?.length) {
    query = query.in("condition", options.conditions);
  }

  if (options.postedToday) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    query = query.gte("created_at", startOfDay.toISOString());
  }

  if (options.deliveryAvailable) {
    query = query.not("delivery_carriers", "eq", "{}");
  }

  if (options.collectionOnly) {
    query = query.or("delivery_carriers.is.null,delivery_carriers.eq.{}");
  }

  if (options.inStock) {
    query = query.gt("stock", 0);
  }

  if (options.brand?.trim()) {
    const { data: brands } = await supabase
      .from("brands")
      .select("id")
      .ilike("name", `%${options.brand.trim()}%`);
    const brandIds = brands?.map((brand) => brand.id) ?? [];
    if (brandIds.length) query = query.in("brand_id", brandIds);
    else return { items: [], total: 0, page, hasMore: false };
  }

  switch (options.sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query
        .order("promotion_score", { ascending: false })
        .order("featured_until", { ascending: false, nullsFirst: false })
        .order("last_bumped_at", { ascending: false, nullsFirst: false })
        .order("views", { ascending: false })
        .order("created_at", { ascending: false });
  }

  const { data, count } = await query.range(from, to);
  const items = ((data as ProductRow[] | null) ?? []).map(mapProductRow);

  return {
    items,
    total: count ?? 0,
    page,
    hasMore: from + items.length < (count ?? 0),
  };
}

export async function countLowStockListings(sellerId: string): Promise<number> {
  const listings = await getSellerListings(sellerId, "low_stock");
  return listings.length;
}

export async function bumpListing(
  sellerId: string,
  productId: string,
  durationId = "24h",
): Promise<{ success: boolean; url?: string; error?: string }> {
  const { createPromotionCheckoutSession } = await import("@/lib/promotions/service");
  const result = await createPromotionCheckoutSession({
    sellerId,
    productId,
    type: "bump",
    durationId,
  });

  if ("error" in result) {
    return { success: false, error: result.error };
  }

  return { success: true, url: result.url };
}