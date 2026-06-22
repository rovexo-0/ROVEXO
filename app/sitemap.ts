import type { MetadataRoute } from "next";
import {
  buildBlogSitemapEntries,
  buildBusinessSitemapEntries,
  buildCategorySitemapEntries,
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
      return buildCategorySitemapEntries();
    case "locations":
      return buildLocationSitemapEntries();
    case "products":
      return buildProductSitemapEntries();
    case "sellers":
      return buildSellerSitemapEntries();
    case "business":
      return buildBusinessSitemapEntries();
    case "blog":
      return buildBlogSitemapEntries();
    case "images":
      return buildImageSitemapEntries();
    default:
      return [{ url: getAppUrl(), changeFrequency: "daily", priority: 1 }];
  }
}
