import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/supabase/env";
import { getCategoryTree } from "@/lib/categories/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/search`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/categories`, changeFrequency: "weekly", priority: 0.9 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = getCategoryTree().map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  try {
    const admin = createAdminClient();
    const { data: products } = await admin
      .from("products")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(500);

    const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((product) => ({
      url: `${baseUrl}/listing/${product.slug}`,
      lastModified: product.updated_at,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
  } catch {
    return [...staticRoutes, ...categoryRoutes];
  }
}
