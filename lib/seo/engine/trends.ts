import { createAdminClient } from "@/lib/supabase/admin";
import { TREND_TTL_DAYS } from "@/lib/seo/engine/config";
import type { OrganicLandingPage } from "@/lib/seo/engine/types";

export type TrendSignal = {
  slug: string;
  label: string;
  type: "brand" | "product" | "category" | "location" | "search";
  score: number;
  searchQuery?: string;
  brand?: string;
  categorySlugPath?: string[];
  locationCity?: string;
};

function slugify(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Detect live marketplace trends from published inventory signals. */
export async function detectTrendSignals(limit = 50): Promise<TrendSignal[]> {
  try {
    const admin = createAdminClient();
    const { data: products } = await admin
      .from("products")
      .select("title, views, likes, location_city, brands(name), categories(slug)")
      .eq("status", "published")
      .order("views", { ascending: false })
      .limit(200);

    const brandScores = new Map<string, TrendSignal>();
    const categoryScores = new Map<string, TrendSignal>();
    const locationScores = new Map<string, TrendSignal>();
    const productScores = new Map<string, TrendSignal>();

    for (const row of products ?? []) {
      const views = row.views ?? 0;
      const likes = row.likes ?? 0;
      const score = views + likes * 3;
      const brand = (row.brands as { name: string } | null)?.name;

      if (brand && score > 0) {
        const slug = slugify(brand);
        const existing = brandScores.get(slug);
        if (!existing || existing.score < score) {
          brandScores.set(slug, {
            slug,
            label: brand,
            type: "brand",
            score: (existing?.score ?? 0) + score,
            brand,
            searchQuery: brand,
          });
        }
      }

      const categorySlug = (row.categories as { slug: string } | null)?.slug;
      if (categorySlug) {
        const existing = categoryScores.get(categorySlug);
        categoryScores.set(categorySlug, {
          slug: categorySlug,
          label: categorySlug.replace(/-/g, " "),
          type: "category",
          score: (existing?.score ?? 0) + score,
          categorySlugPath: [categorySlug],
        });
      }

      if (row.location_city) {
        const locSlug = slugify(row.location_city);
        const existing = locationScores.get(locSlug);
        locationScores.set(locSlug, {
          slug: locSlug,
          label: row.location_city,
          type: "location",
          score: (existing?.score ?? 0) + score,
          locationCity: row.location_city,
        });
      }

      const titleWords = row.title.trim().split(/\s+/).slice(0, 3).join(" ");
      if (titleWords.length >= 3) {
        const pSlug = slugify(titleWords);
        const existing = productScores.get(pSlug);
        productScores.set(pSlug, {
          slug: pSlug,
          label: titleWords,
          type: "product",
          score: (existing?.score ?? 0) + score,
          searchQuery: titleWords,
        });
      }
    }

    return [...brandScores.values(), ...categoryScores.values(), ...locationScores.values(), ...productScores.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export function resolveTrendPage(slug: string, signals?: TrendSignal[]): OrganicLandingPage | null {
  const normalized = slug.trim().toLowerCase();
  const signal = signals?.find((entry) => entry.slug === normalized);
  if (!signal) {
    // Static trend slug fallback
    if (normalized.startsWith("trending-")) {
      const label = normalized.replace(/^trending-/, "").replace(/-/g, " ");
      return buildTrendPage(normalized, label, { searchQuery: label });
    }
    return null;
  }

  return buildTrendPage(signal.slug, signal.label, {
    searchQuery: signal.searchQuery,
    brand: signal.brand,
    categorySlugPath: signal.categorySlugPath,
    locationCity: signal.locationCity,
  });
}

function buildTrendPage(
  slug: string,
  label: string,
  search: {
    searchQuery?: string;
    brand?: string;
    categorySlugPath?: string[];
    locationCity?: string;
  },
): OrganicLandingPage {
  const title = `Trending ${label} on ROVEXO`;
  return {
    kind: "trend",
    slug,
    path: `/trends/${slug}`,
    title: `${title} | ROVEXO`,
    description: `${label} is trending on ROVEXO right now. Browse live listings ranked by views, saves, and marketplace activity.`,
    search: {
      query: search.searchQuery,
      brand: search.brand,
      categorySlugPath: search.categorySlugPath,
      locationCity: search.locationCity,
      sort: "newest",
    },
    facetTypes: ["collection"],
    breadcrumbs: [
      { name: "Home", href: "/" },
      { name: "Trends", href: "/trends" },
      { name: title, href: `/trends/${slug}` },
    ],
    lastModified: new Date().toISOString(),
  };
}

export async function getActiveTrendSlugs(): Promise<string[]> {
  const signals = await detectTrendSignals(30);
  return signals.map((signal) => signal.slug);
}

export function trendExpiresAt(createdAt: string): Date {
  const expires = new Date(createdAt);
  expires.setDate(expires.getDate() + TREND_TTL_DAYS);
  return expires;
}

export function isTrendExpired(lastModified?: string): boolean {
  if (!lastModified) return false;
  return trendExpiresAt(lastModified) < new Date();
}
