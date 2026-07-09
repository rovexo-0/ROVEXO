import type { MetadataRoute } from "next";
import {
  buildBlogSitemapEntries,
  buildBrandSitemapEntries,
  buildBrowseComboSitemapEntries,
  buildBusinessSitemapEntries,
  buildCategorySitemapEntries,
  buildCollectionsSitemapEntries,
  buildTrendsSitemapEntries,
  buildDiscoverSitemapEntries,
  buildImageSitemapEntries,
  buildLocationSitemapEntries,
  buildProductSitemapEntries,
  buildSellerSitemapEntries,
  buildStaticSitemapEntries,
} from "@/lib/seo/sitemaps/generators";
import { getAppUrl } from "@/lib/supabase/env";

export async function generateSitemaps() {
  return [
    { id: "static" },
    { id: "categories" },
    { id: "locations" },
    { id: "products" },
    { id: "sellers" },
    { id: "business" },
    { id: "brands" },
    { id: "discover" },
    { id: "collections" },
    { id: "trends" },
    { id: "blog" },
    { id: "images" },
  ];
}

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;

  switch (id) {
    case "static":
      return buildStaticSitemapEntries();
    case "categories":
      return [...buildCategorySitemapEntries(), ...buildBrowseComboSitemapEntries()];
    case "locations":
      return buildLocationSitemapEntries();
    case "products":
      return buildProductSitemapEntries();
    case "sellers":
      return buildSellerSitemapEntries();
    case "business":
      return buildBusinessSitemapEntries();
    case "brands":
      return buildBrandSitemapEntries();
    case "discover":
      return buildDiscoverSitemapEntries();
    case "collections":
      return buildCollectionsSitemapEntries();
    case "trends":
      return buildTrendsSitemapEntries();
    case "blog":
      return buildBlogSitemapEntries();
    case "images":
      return buildImageSitemapEntries();
    default:
      return [{ url: getAppUrl(), changeFrequency: "daily", priority: 1 }];
  }
}
