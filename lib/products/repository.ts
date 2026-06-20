import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types/database";
import { searchListings as searchListingsRepo } from "@/lib/listings/repository";
import { isPromotionActive } from "@/lib/promotions/format";
import { refreshExpiredPromotions } from "@/lib/promotions/service";
import { toProductDetail } from "@/lib/products/detail";
import type {
  DeliveryCarrier,
  Product,
  ProductDetail,
  ProductSection,
  ProductsPage,
} from "@/lib/products/types";

const PAGE_SIZE = 8;

type ProductRow = Tables<"products"> & {
  profiles: Pick<Tables<"profiles">, "full_name" | "avatar_url" | "verified"> | null;
  product_images: Pick<
    Tables<"product_images">,
    "url" | "thumbnail_url" | "sort_order" | "is_primary"
  >[];
  brands: Pick<Tables<"brands">, "name"> | null;
};

const PRODUCT_SELECT = `
  *,
  profiles!products_seller_id_fkey ( full_name, avatar_url, verified ),
  product_images ( url, sort_order, is_primary ),
  brands ( name )
`;

function primaryImage(row: ProductRow): string {
  const sorted = [...(row.product_images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  return sorted[0]?.url ?? "/placeholder-product.png";
}

function mapProductRow(row: ProductRow): Product {
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
    imageUrl: primaryImage(row),
    sections: (row.sections ?? []) as ProductSection[],
    isFeatured: isPromotionActive(row.featured_until),
    isBumped: isPromotionActive(row.bumped_until),
  };
}

function productAvailability(
  stock: number,
  lowStockAlert: number,
): ProductDetail["availability"] {
  if (stock <= 0) return "out_of_stock";
  if (stock <= lowStockAlert) return "low_stock";
  return "in_stock";
}

function mapProductDetail(row: ProductRow): ProductDetail {
  const product = mapProductRow(row);
  const images = [...(row.product_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => image.url);

  const detail = toProductDetail(product);
  return {
    ...detail,
    images: images.length > 0 ? images : detail.images,
    description: row.description || detail.description,
    deliveryCarriers: (row.delivery_carriers ?? detail.deliveryCarriers) as DeliveryCarrier[],
    salesCount: Math.max(1, row.review_count),
    stock: row.stock,
    availability: productAvailability(row.stock, row.low_stock_alert),
    sellerId: row.seller_id,
  };
}

export async function getProductsBySection(
  section: ProductSection,
  page = 1,
): Promise<ProductsPage> {
  await refreshExpiredPromotions();

  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const now = new Date().toISOString();

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .eq("status", "published");

  if (section === "trending") {
    query = query
      .gt("bumped_until", now)
      .order("last_bumped_at", { ascending: false });
  } else if (section === "recommended") {
    query = query
      .gt("featured_until", now)
      .order("promotion_score", { ascending: false })
      .order("featured_until", { ascending: false });
  } else {
    query = query
      .contains("sections", [section])
      .order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw error;
  }

  let rawRows = (data as ProductRow[] | null) ?? [];
  let total = count ?? 0;

  if (rawRows.length === 0 && page === 1 && section !== "new") {
    const fallback = await supabase
      .from("products")
      .select(PRODUCT_SELECT, { count: "exact" })
      .eq("status", "published")
      .contains("sections", [section])
      .order("created_at", { ascending: false })
      .range(from, to);

    if (fallback.error) {
      throw fallback.error;
    }

    rawRows = (fallback.data as ProductRow[] | null) ?? [];
    total = fallback.count ?? rawRows.length;
  }

  const items = rawRows.map(mapProductRow);

  return {
    items,
    page,
    hasMore: from + items.length < total,
  };
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .in("status", ["published", "draft", "paused"])
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProductDetail(data as ProductRow);
}

export async function getSimilarProducts(slug: string, limit = 8): Promise<Product[]> {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("products")
    .select("id, category_id, brand_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!current) {
    return [];
  }

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "published")
    .neq("slug", slug)
    .limit(limit);

  if (current.category_id) {
    query = query.eq("category_id", current.category_id);
  }

  const { data } = await query;
  return (data as ProductRow[] | null)?.map(mapProductRow) ?? [];
}

export async function searchProducts(query: string, page = 1, pageSize = PAGE_SIZE) {
  return searchListingsRepo({
    query,
    page,
    pageSize,
    sort: "newest",
  });
}

export async function countSearchProducts(query: string): Promise<number> {
  const result = await searchListingsRepo({ query, page: 1, pageSize: 1 });
  return result.total;
}
