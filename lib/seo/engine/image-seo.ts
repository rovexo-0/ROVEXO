import type { Product } from "@/lib/products/types";
import { productImageAlt, productImageTitle } from "@/lib/seo/engine/json-ld";

export type ImageSeoMeta = {
  alt: string;
  title: string;
  loading: "lazy" | "eager";
  priority: boolean;
  sizes: string;
};

export function buildProductImageSeo(product: Product, index: number, total: number): ImageSeoMeta {
  return {
    alt: productImageAlt({ title: product.title, index, total }),
    title: productImageTitle(product.title),
    loading: index === 0 ? "eager" : "lazy",
    priority: index === 0,
    sizes: index === 0 ? "100vw" : "(max-width: 768px) 50vw, 33vw",
  };
}

export function buildListingGalleryImageSeo(
  products: Product[],
): Map<string, ImageSeoMeta> {
  const map = new Map<string, ImageSeoMeta>();
  products.forEach((product, index) => {
    map.set(product.slug, buildProductImageSeo(product, index, products.length));
  });
  return map;
}

export function imageSitemapEntry(product: Product, baseUrl: string) {
  if (!product.imageUrl) return null;
  return {
    url: `${baseUrl}/listing/${product.slug}`,
    images: [product.imageUrl],
  };
}
