import { getHomepageFeed, getProductBySlug, getProductsBySection, getSimilarProducts } from "@/lib/products/catalog";
import type { Product, ProductDetail, ProductSection, ProductsPage } from "@/lib/products/types";

export async function fetchHomepageFeed(page = 1): Promise<ProductsPage> {
  return getHomepageFeed(page);
}

export async function fetchProducts(
  section: ProductSection,
  page = 1,
): Promise<ProductsPage> {
  return getProductsBySection(section, page);
}

export async function fetchProductBySlug(slug: string): Promise<ProductDetail | null> {
  return getProductBySlug(slug) ?? null;
}

export async function fetchSimilarProducts(slug: string, limit = 8): Promise<Product[]> {
  return getSimilarProducts(slug, limit);
}
