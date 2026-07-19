import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables, TablesUpdate, ProductStatus } from "@/lib/supabase/types/database";
import type { Product, ProductSection } from "@/lib/products/types";
import { buildProductImagePath } from "@/lib/storage/server-images";
import { getPublicStorageUrl } from "@/lib/storage/upload";
import { formatPromotionRemaining, isPromotionActive } from "@/lib/promotions/format";
import { HomepageEligibility } from "@/lib/homepage/homepage-eligibility";
import { refreshExpiredPromotions } from "@/lib/promotions/service";
import { scanListingBeforePublish } from "@/lib/moderation/scan-listing";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/media/product-image";
import { normalizeAvatarUrl } from "@/lib/media/normalize-avatar-url";
import { resolveTransactionModeMapForCategoryIds } from "@/lib/transaction-mode/server";
import { DEFAULT_TRANSACTION_MODE } from "@/lib/transaction-mode/types";
import { purgeListingNotifications } from "@/lib/listings/purge-listing-notifications";
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

function applyTextSearchFilter<T extends { ilike: (column: string, pattern: string) => T }>(
  query: T,
  term: string,
): T {
  const words = term.trim().split(/\s+/).filter(Boolean);
  let next = query;
  for (const word of words) {
    const escaped = word.replace(/[%_\\]/g, "\\$&");
    next = next.ilike("title", `%${escaped}%`);
  }
  return next;
}

type ProductRow = Tables<"products"> & {
  profiles?: Pick<
    Tables<"profiles">,
    "full_name" | "avatar_url" | "verified" | "username" | "email" | "account_status" | "role"
  > | null;
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

function mapSellerListing(row: ProductRow, transactionMode = DEFAULT_TRANSACTION_MODE): SellerListing {
  const images = mapImages(row.product_images);
  const primary = images.find((image) => image.isPrimary) ?? images[0];
  const auctionEndsAt = row.auction_ends_at;
  const isAuctionExpired =
    row.listing_type === "auction" &&
    Boolean(auctionEndsAt) &&
    new Date(auctionEndsAt as string).getTime() < Date.now();

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    locationCity: row.location_city ?? null,
    brand: row.brands?.name ?? null,
    brandId: row.brand_id,
    categoryId: row.category_id,
    categoryPath: row.categories?.path_label ?? null,
    transactionMode,
    color: row.color,
    size: row.size,
    condition: row.condition,
    price: Number(row.price),
    acceptOffers: row.accept_offers,
    status: row.status,
    moderationStatus: row.moderation_status ?? null,
    listingType: row.listing_type ?? "fixed",
    auctionEndsAt: row.auction_ends_at ?? null,
    stock: row.stock,
    shippingMethod: row.shipping_method ?? null,
    shippingPrice: row.shipping_price != null ? Number(row.shipping_price) : null,
    freeDelivery: row.shipping_price === 0,
    sku: row.sku,
    lowStockAlert: row.low_stock_alert,
    views: row.views,
    likes: row.likes,
    imageUrl: primary?.url ?? PRODUCT_IMAGE_FALLBACK,
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
    isAuctionExpired,
  };
}

async function attachSellerListingModes(listings: SellerListing[]): Promise<SellerListing[]> {
  const modeMap = await resolveTransactionModeMapForCategoryIds(
    listings.map((listing) => listing.categoryId),
  );
  return listings.map((listing) => ({
    ...listing,
    transactionMode: listing.categoryId
      ? (modeMap.get(listing.categoryId) ?? DEFAULT_TRANSACTION_MODE)
      : DEFAULT_TRANSACTION_MODE,
  }));
}

function mapProductRow(row: ProductRow, transactionMode = DEFAULT_TRANSACTION_MODE): Product {
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
    sellerAvatar: normalizeAvatarUrl(row.profiles?.avatar_url) ?? undefined,
    sellerVerified: row.profiles?.verified ?? false,
    sellerEmail: row.profiles?.email ?? null,
    sellerUsername: row.profiles?.username ?? null,
    sellerAccountStatus: row.profiles?.account_status ?? null,
    sellerRole: row.profiles?.role ?? null,
    moderationStatus: row.moderation_status ?? null,
    description: row.description ?? undefined,
    imageCount: images.length,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    views: row.views,
    likes: row.likes,
    imageUrl: primary?.url ?? PRODUCT_IMAGE_FALLBACK,
    sections: (row.sections ?? []) as ProductSection[],
    isFeatured: isPromotionActive(row.featured_until),
    isBumped: isPromotionActive(row.bumped_until),
    categoryId: row.category_id ?? null,
    transactionMode,
  };
}

const PRODUCT_LIST_SELECT = `*, profiles!products_seller_id_fkey ( full_name, avatar_url, verified, username, email, account_status, role ), product_images (*), brands ( name )`;

/**
 * Newest published listings, strictly ordered by recency. Reuses the shared
 * product mapper so search discovery, the marketplace grid, and the API all
 * resolve identical product shapes. Intentionally recency-only (no promotion
 * weighting) so "Recent Listings" means exactly what it says.
 */
export async function getRecentPublishedListings(limit = 8): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_LIST_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(Math.max(1, limit));

  const mapped = HomepageEligibility.filterEligibleRows((data as ProductRow[] | null) ?? []).map(
    (row) => mapProductRow(row),
  );
  return attachTransactionModes(mapped);
}

async function attachTransactionModes(products: Product[]): Promise<Product[]> {
  const modeMap = await resolveTransactionModeMapForCategoryIds(
    products.map((product) => product.categoryId),
  );
  return products.map((product) => ({
    ...product,
    transactionMode: product.categoryId
      ? (modeMap.get(product.categoryId) ?? DEFAULT_TRANSACTION_MODE)
      : DEFAULT_TRANSACTION_MODE,
  }));
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

  let listings = (data as ProductRow[]).map((row) => mapSellerListing(row));

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
    case "pending":
      listings = listings.filter(
        (listing) =>
          listing.moderationStatus === "pending" ||
          listing.moderationStatus === "blocked" ||
          (listing.status === "paused" && listing.moderationStatus !== "approved"),
      );
      break;
    case "expired":
      listings = listings.filter((listing) => listing.isAuctionExpired);
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

  return attachSellerListingModes(listings);
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

async function storageObjectExists(
  admin: ReturnType<typeof createAdminClient>,
  path: string,
): Promise<boolean> {
  const slash = path.lastIndexOf("/");
  const dir = slash >= 0 ? path.slice(0, slash) : "";
  const name = slash >= 0 ? path.slice(slash + 1) : path;
  const { data } = await admin.storage.from("products").list(dir, { search: name, limit: 100 });
  return Boolean(data?.some((entry) => entry.name === name));
}

/**
 * Materializes a listing image at its final product-folder path. Returns null
 * (rather than a dangling reference) when the image cannot be placed there, so
 * the caller never persists a product_images row that points at a missing
 * storage object — the previous implementation ignored the copy() result and
 * removed the temp source unconditionally, producing permanently broken images.
 */
async function moveImageToProductFolder(
  image: ListingImageInput,
  sellerId: string,
  productId: string,
): Promise<ListingImageInput | null> {
  if (!image.storagePath.startsWith(`${sellerId}/`)) {
    throw new Error("Invalid image storage path.");
  }

  if (!image.storagePath.includes("/temp/")) {
    return image;
  }

  const admin = createAdminClient();
  const filename = image.storagePath.split("/").pop()!;
  const newPath = buildProductImagePath(sellerId, productId, filename);
  const oldThumbPath = image.storagePath.replace(/\.jpg$/, "-thumb.jpg");
  const newThumbPath = newPath.replace(/\.jpg$/, "-thumb.jpg");

  const { error: copyError } = await admin.storage.from("products").copy(image.storagePath, newPath);

  if (copyError) {
    // Copy can fail if the temp source no longer exists (e.g. a persisted draft
    // re-published after temp cleanup). Treat as success only if the object is
    // already present at the destination (idempotent re-publish); otherwise skip
    // this image so we never create a dangling reference.
    const alreadyThere = await storageObjectExists(admin, newPath);
    if (!alreadyThere) {
      console.error("[moveImageToProductFolder] skipping image with missing source", {
        storagePath: image.storagePath,
        code: copyError.message,
      });
      return null;
    }
  }

  // Thumbnail is best-effort; a missing thumbnail must not break publishing.
  await admin.storage.from("products").copy(oldThumbPath, newThumbPath).catch(() => undefined);

  // Only remove the temp sources now that the destination is confirmed present.
  await admin.storage.from("products").remove([image.storagePath, oldThumbPath]).catch(() => undefined);

  return {
    ...image,
    url: getPublicStorageUrl("products", newPath),
    thumbnailUrl: getPublicStorageUrl("products", newThumbPath),
    storagePath: newPath,
  };
}

async function insertProductImages(
  productId: string,
  sellerId: string,
  images: ListingImageInput[],
): Promise<void> {
  const supabase = await createClient();
  const moved = await Promise.all(
    images.map((image) => moveImageToProductFolder(image, sellerId, productId)),
  );
  const normalized = moved.filter((image): image is ListingImageInput => image !== null);

  if (normalized.length === 0) {
    throw new Error("Unable to save listing images. Please re-upload your photos and try again.");
  }

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

    const listing = mapSellerListing(fallbackData as ProductRow);
    return (await attachSellerListingModes([listing]))[0] ?? null;
  }

  if (!data) return null;
  const listing = mapSellerListing(data as ProductRow);
  return (await attachSellerListingModes([listing]))[0] ?? null;
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

  const isAuction = input.listingType === "auction";
  const auctionStart = input.auctionStartPrice ?? input.price;

  const productInsert = {
    seller_id: input.sellerId,
    slug,
    title: input.title,
    description: input.description,
    location_city: input.locationCity?.trim() || null,
    brand_id: brandId,
    category_id: input.categoryId,
    color: input.color,
    size: input.size,
    condition: input.condition,
    price: isAuction ? (input.price > auctionStart ? input.price : auctionStart) : input.price,
    accept_offers: isAuction ? input.price > auctionStart : input.acceptOffers,
    delivery_carriers: input.deliveryCarriers ?? ["Royal Mail", "Evri"],
    shipping_method: input.shippingMethod ?? "delivery_available",
    shipping_price: input.shippingPrice ?? (input.freeDelivery ? 0 : null),
    parcel_size: input.parcelSize ?? null,
    status,
    stock,
    sku: input.inventory?.sku,
    low_stock_alert: input.inventory?.lowStockAlert ?? 5,
    sections,
    listing_type: input.listingType ?? "fixed",
    auction_start_price: isAuction ? auctionStart : null,
    auction_starts_at: isAuction ? new Date().toISOString() : null,
    auction_ends_at: isAuction ? input.auctionEndsAt ?? null : null,
    reserve_price: isAuction ? input.reservePrice ?? null : null,
    current_bid: isAuction ? auctionStart : null,
    bid_count: isAuction ? 0 : undefined,
  };

  const { data: product, error } = await supabase
    .from("products")
    .insert(productInsert)
    .select("id")
    .single();

  if (error || !product) {
    console.error("[createSellerListing] product insert failed", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    return null;
  }

  // Image insertion and the pre-publish moderation scan are independent (the scan
  // reads image *names* from the input, not the freshly inserted rows), so run
  // them concurrently instead of serializing two round-trip chains.
  try {
    await Promise.all([
      insertProductImages(product.id, input.sellerId, input.images),
      status === "published"
        ? scanListingBeforePublish({
            sellerId: input.sellerId,
            productId: product.id,
            title: input.title,
            description: input.description,
            brand: input.brand,
            imageNames: input.images.map((image) => image.storagePath || image.url),
          })
        : Promise.resolve(),
    ]);
  } catch (error) {
    const admin = createAdminClient();
    await admin.from("products").update({ status: "deleted" }).eq("id", product.id);
    console.error("[createSellerListing] post-insert failed; listing rolled back", error);
    return null;
  }

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
    ...(input.locationCity !== undefined && {
      location_city: input.locationCity?.trim() || null,
    }),
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
    ...(input.deliveryCarriers !== undefined && {
      delivery_carriers: input.deliveryCarriers,
    }),
    ...(input.shippingMethod !== undefined && { shipping_method: input.shippingMethod }),
    ...(input.shippingPrice !== undefined && { shipping_price: input.shippingPrice }),
    ...(input.freeDelivery === true && { shipping_price: 0 }),
    ...(input.parcelSize !== undefined && { parcel_size: input.parcelSize }),
  };

  if (Object.keys(patch).length > 0) {
    const { error: updateError } = await supabase
      .from("products")
      .update(patch)
      .eq("id", productId)
      .eq("seller_id", sellerId);

    if (updateError) {
      console.error("[updateSellerListing] product update failed", {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      });
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

  const nextStatus = input.status ?? existing.status;
  const shouldScan =
    nextStatus === "published" &&
    (input.status === "published" ||
      input.title !== undefined ||
      input.description !== undefined ||
      input.images?.length);

  if (shouldScan) {
    const refreshed = await getSellerListingById(sellerId, productId);
    if (refreshed) {
      await scanListingBeforePublish({
        sellerId,
        productId,
        title: refreshed.title,
        description: refreshed.description,
        brand: refreshed.brand ?? undefined,
        imageNames: refreshed.images.map((image) => image.storagePath || image.url),
      });
    }
  }

  return getSellerListingById(sellerId, productId);
}

type ListingDeletionTarget = {
  id: string;
  slug: string;
  sellerId: string;
  storagePaths: string[];
};

/**
 * Canonical per-listing permanent delete — the single application delete flow
 * used by both the seller "Delete" action and the Super Admin bulk tool.
 *
 * The database enforces `ON DELETE CASCADE` on all product-referencing tables
 * (product_images, cart_items, saved_items, recently_viewed, offers,
 * listing_promotions, promotion_analytics_events, conversations, …) and
 * `ON DELETE SET NULL` on order history links (order_items, reviews,
 * moderation_queue), so a single hard delete of the product row removes all
 * live child rows with zero orphans. We additionally purge storage objects and
 * any notifications that deep-link to the listing.
 *
 * The delete runs through the service-role client so the FK cascade can remove
 * rows owned by other users (e.g. buyers' cart/saved entries) regardless of RLS.
 */
async function purgeListingRecord(target: ListingDeletionTarget): Promise<boolean> {
  const admin = createAdminClient();

  // Remove every stored image object (originals + thumbnails) for the listing.
  await deleteStoragePaths(target.storagePaths);
  await deleteStorageFolder(`${target.sellerId}/${target.id}`);

  // Purge notifications that deep-link to this listing (no product_id column).
  await purgeListingNotifications(admin, { id: target.id, slug: target.slug });

  // Hard delete the product row — cascades all child records atomically.
  const { error } = await admin.from("products").delete().eq("id", target.id);

  return !error;
}

/**
 * Permanently deletes a single listing owned by the caller. Ownership is
 * verified with the caller's session client before the cascade runs.
 */
export async function deleteSellerListing(
  sellerId: string,
  productId: string,
): Promise<boolean> {
  const listing = await getSellerListingById(sellerId, productId);
  if (!listing) return false;

  return purgeListingRecord({
    id: listing.id,
    slug: listing.slug,
    sellerId,
    storagePaths: listing.images.map((image) => image.storagePath).filter(Boolean),
  });
}

export type DeleteAllListingsReport = {
  total: number;
  deleted: number;
  failed: number;
  remaining: number;
};

/**
 * Super Admin bulk delete — permanently removes EVERY listing regardless of
 * owner or status by running each one through the canonical per-listing purge
 * flow (no direct SQL truncation). Returns a report for validation.
 */
export async function deleteAllListingsAsAdmin(): Promise<DeleteAllListingsReport> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("products")
    .select("id, slug, seller_id, product_images ( storage_path )");

  if (error || !data) {
    return { total: 0, deleted: 0, failed: 0, remaining: -1 };
  }

  let deleted = 0;
  let failed = 0;

  for (const row of data as Array<{
    id: string;
    slug: string;
    seller_id: string;
    product_images?: Array<{ storage_path: string | null }> | null;
  }>) {
    const ok = await purgeListingRecord({
      id: row.id,
      slug: row.slug,
      sellerId: row.seller_id,
      storagePaths: (row.product_images ?? [])
        .map((image) => image.storage_path ?? "")
        .filter(Boolean),
    });
    if (ok) deleted += 1;
    else failed += 1;
  }

  const { count } = await admin
    .from("products")
    .select("id", { count: "exact", head: true });

  return { total: data.length, deleted, failed, remaining: count ?? 0 };
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
    locationCity: existing.locationCity,
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

  const { error: updateError } = await supabase
    .from("products")
    .update({ status, sections })
    .eq("id", productId)
    .eq("seller_id", sellerId);

  if (updateError) {
    console.error("[setListingStatus] product update failed", {
      code: updateError.code,
      message: updateError.message,
    });
    return null;
  }

  if (status === "published") {
    const listing = await getSellerListingById(sellerId, productId);
    if (listing) {
      await scanListingBeforePublish({
        sellerId,
        productId,
        title: listing.title,
        description: listing.description,
        brand: listing.brand ?? undefined,
        imageNames: listing.images.map((image) => image.storagePath || image.url),
      });
    }
  }

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
      `*, profiles!products_seller_id_fkey ( full_name, avatar_url, verified, username, email, account_status, role ), product_images (*), brands ( name )`,
      { count: "exact" },
    )
    .eq("status", "published");

  if (options.query?.trim()) {
    const term = options.query.trim();
    query = applyTextSearchFilter(query, term);
  }

  if (options.sellerId) {
    query = query.eq("seller_id", options.sellerId);
  }

  if (options.excludeSlug) {
    query = query.neq("slug", options.excludeSlug);
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

  if (options.locationCity?.trim()) {
    query = query.eq("location_city", options.locationCity.trim());
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
  const rows = HomepageEligibility.filterEligibleRows((data as ProductRow[] | null) ?? []);
  const mapped = rows.map((row) => mapProductRow(row));
  const items = await attachTransactionModes(mapped);

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