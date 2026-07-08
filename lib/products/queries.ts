import {
  getHomepageFeed,
  getProductBySlug,
  getProductsBySection,
  getShowcaseSellerSections,
  getSimilarProducts,
} from "@/lib/products/catalog";
import type { Product, ProductDetail, ProductSection, ProductsPage } from "@/lib/products/types";
import { enrichDemoProductDetail, resolveDemoSimilarProducts } from "@/lib/homepage/demo-data";

export async function fetchHomepageFeed(page = 1): Promise<ProductsPage> {
  return getHomepageFeed(page);
}

export async function fetchShowcaseSellerSections() {
  return getShowcaseSellerSections();
}

export async function fetchProducts(
  section: ProductSection,
  page = 1,
): Promise<ProductsPage> {
  return getProductsBySection(section, page);
}

export async function fetchProductBySlug(slug: string): Promise<ProductDetail | null> {
  const detail = (await getProductBySlug(slug)) ?? null;
  return enrichDemoProductDetail(slug, detail);
}

export async function fetchSimilarProducts(slug: string, limit = 8): Promise<Product[]> {
  const items = await getSimilarProducts(slug, limit);
  if (items.length > 0) return items;
  return resolveDemoSimilarProducts(slug, limit);
}
