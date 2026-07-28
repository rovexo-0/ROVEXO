import {
  getHomepageFeed,
  getProductBySlug,
  getProductBySlugForCheckout,
  getProductsBySection,
  getShowcaseSellerSections,
  getSimilarProducts,
} from "@/lib/products/catalog";
import type { Product, ProductDetail, ProductSection, ProductsPage } from "@/lib/products/types";

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

/** Real products table only — never demo / mock detail fallbacks. */
export async function fetchProductBySlug(slug: string): Promise<ProductDetail | null> {
  return (await getProductBySlug(slug)) ?? null;
}

/** Includes reserved — Checkout Session owners only. */
export async function fetchProductBySlugForCheckout(
  slug: string,
): Promise<ProductDetail | null> {
  return (await getProductBySlugForCheckout(slug)) ?? null;
}

export async function fetchSimilarProducts(slug: string, limit = 8): Promise<Product[]> {
  return getSimilarProducts(slug, limit);
}
