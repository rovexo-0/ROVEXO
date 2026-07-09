import { createAdminClient } from "@/lib/supabase/admin";
import type { BrandPage } from "@/lib/seo/engine/types";

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function fetchBrandBySlug(slug: string): Promise<{ id: string; name: string; slug: string } | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("brands")
      .select("id, name, slug")
      .eq("slug", slug.trim().toLowerCase())
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export async function fetchBrandsWithListings(limit = 500): Promise<{ slug: string; name: string }[]> {
  try {
    const admin = createAdminClient();
    const { data: products } = await admin
      .from("products")
      .select("brand_id, brands!inner(slug, name)")
      .eq("status", "published")
      .not("brand_id", "is", null)
      .limit(5000);

    const seen = new Map<string, { slug: string; name: string }>();
    for (const row of products ?? []) {
      const brand = row.brands as { slug: string; name: string } | null;
      if (brand && !seen.has(brand.slug)) {
        seen.set(brand.slug, brand);
      }
      if (seen.size >= limit) break;
    }

    return [...seen.values()];
  } catch {
    return [];
  }
}

export function buildBrandPage(brand: { slug: string; name: string }): BrandPage {
  return {
    kind: "brand",
    slug: brand.slug,
    name: brand.name,
    path: `/brand/${brand.slug}`,
    title: `${brand.name} for Sale UK | ROVEXO`,
    description: `Shop ${brand.name} on ROVEXO. Browse ${brand.name} listings from verified UK sellers with purchase protection.`,
  };
}

export function resolveBrandPage(slug: string, brand: { slug: string; name: string } | null): BrandPage | null {
  if (!brand) return null;
  return buildBrandPage(brand);
}

export { slugToTitle as brandSlugToTitle };
