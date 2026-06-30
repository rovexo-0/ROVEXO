import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { flattenCategoryPaths } from "@/lib/categories/queries";
import { getAllHelpArticles } from "@/lib/help/content/articles";
import { ALL_UK_LOCATIONS } from "@/lib/seo/locations/uk";
import { CATEGORY_ALIASES } from "@/lib/seo/programmatic/aliases";
import { getAppUrl } from "@/lib/supabase/env";

const baseUrl = () => getAppUrl();

export function buildStaticSitemapEntries(): MetadataRoute.Sitemap {
  const helpRoutes = getAllHelpArticles().map((article) => ({
    url: `${baseUrl()}/help/${article.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    { url: baseUrl(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl()}/search`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl()}/categories`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl()}/help`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl()}/support`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl()}/resolution`, changeFrequency: "monthly", priority: 0.4 },
    ...helpRoutes,
  ];
}

export function buildCategorySitemapEntries(): MetadataRoute.Sitemap {
  const leafPaths = flattenCategoryPaths();
  const categoryUrls = leafPaths.map((path) => ({
    url: `${baseUrl()}/category/${path.segments.map((segment) => segment.slug).join("/")}`,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  const browseAliases = Object.keys(CATEGORY_ALIASES).map((alias) => ({
    url: `${baseUrl()}/browse/${alias}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...categoryUrls, ...browseAliases];
}

export function buildLocationSitemapEntries(): MetadataRoute.Sitemap {
  return ALL_UK_LOCATIONS.map((location) => ({
    url: `${baseUrl()}/l/${location.slug}`,
    changeFrequency: "weekly" as const,
    priority: location.type === "city" ? 0.75 : 0.65,
  }));
}

export async function buildProductSitemapEntries(limit = 5000): Promise<MetadataRoute.Sitemap> {
  try {
    const admin = createAdminClient();
    const { data: products } = await admin
      .from("products")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(limit);

    return (products ?? []).map((product) => ({
      url: `${baseUrl()}/listing/${product.slug}`,
      lastModified: product.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    return [];
  }
}

export async function buildSellerSitemapEntries(limit = 1000): Promise<MetadataRoute.Sitemap> {
  try {
    const admin = createAdminClient();
    const { data: sellers } = await admin
      .from("profiles")
      .select("username, updated_at")
      .not("username", "is", null)
      .in("role", ["seller", "business"])
      .order("updated_at", { ascending: false })
      .limit(limit);

    return (sellers ?? [])
      .filter((seller) => seller.username)
      .map((seller) => ({
        url: `${baseUrl()}/user/${seller.username}`,
        lastModified: seller.updated_at,
        changeFrequency: "weekly" as const,
        priority: 0.55,
      }));
  } catch {
    return [];
  }
}

export async function buildBusinessSitemapEntries(limit = 500): Promise<MetadataRoute.Sitemap> {
  try {
    const admin = createAdminClient();
    const { data: stores } = await admin
      .from("profiles")
      .select("username, updated_at")
      .eq("role", "business")
      .not("username", "is", null)
      .order("updated_at", { ascending: false })
      .limit(limit);

    return (stores ?? []).map((store) => ({
      url: `${baseUrl()}/store/${store.username}`,
      lastModified: store.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    return [];
  }
}

export function buildBlogSitemapEntries(): MetadataRoute.Sitemap {
  return getAllHelpArticles().map((article) => ({
    url: `${baseUrl()}/help/${article.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
}

export async function buildImageSitemapEntries(limit = 2000): Promise<MetadataRoute.Sitemap> {
  try {
    const admin = createAdminClient();
    const { data: images } = await admin
      .from("product_images")
      .select("url, products!inner(slug, status, updated_at)")
      .eq("products.status", "published")
      .limit(limit);

    return (images ?? []).map((image) => {
      const product = image.products as { slug: string; updated_at: string };
      return {
        url: `${baseUrl()}/listing/${product.slug}`,
        lastModified: product.updated_at,
        changeFrequency: "weekly" as const,
        priority: 0.65,
        images: [image.url],
      };
    });
  } catch {
    return [];
  }
}
