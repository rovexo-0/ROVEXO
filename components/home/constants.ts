import type { Product } from "@/lib/products/types";
import {
  ROVEXO_HOME_CATEGORY_RAIL,
  getCategoryPremiumPngSrc,
  isRovexoCategoryPremiumKey,
  type RovexoCategoryPremiumItem,
} from "@/lib/home/category-premium-library";

export type RovexoCategory = {
  name: string;
  slug: string;
  icon: string;
  href: string;
};

export const ROVEXO_CATEGORIES: readonly RovexoCategory[] = ROVEXO_HOME_CATEGORY_RAIL.map(
  (item: RovexoCategoryPremiumItem) => ({
    name: item.name,
    slug: item.slug,
    icon: item.icon,
    href: item.href ?? `/search?category=${item.slug}`,
  }),
);

export const ROVEXO_VIEW_ALL = {
  featured: "/search?q=&sort=popular",
  recommended: "/search?q=&sort=recommended",
  newListings: "/search?q=&sort=newest",
  popular: "/search?q=&sort=popular",
  latestListings: "/search?q=&sort=trending",
  trending: "/search?q=&sort=trending",
  deals: "/search?q=&sort=deals",
  businesses: "/search?category=business",
} as const;

export type RovexoBusiness = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  verified: boolean;
  category: string;
  listingCount: number;
  href: string;
};

export const ROVEXO_BUSINESS_FALLBACK: RovexoBusiness[] = [
  {
    id: "biz-1",
    name: "TechVault Pro",
    slug: "techvault-pro",
    logoUrl: getCategoryPremiumPngSrc("electronics"),
    verified: true,
    category: "Electronics",
    listingCount: 128,
    href: "/search?category=electronics",
  },
  {
    id: "biz-2",
    name: "Luxe Collective",
    slug: "luxe-collective",
    logoUrl: getCategoryPremiumPngSrc("jewellery"),
    verified: true,
    category: "Luxury",
    listingCount: 64,
    href: "/search?category=luxury",
  },
  {
    id: "biz-3",
    name: "Urban Motors",
    slug: "urban-motors",
    logoUrl: getCategoryPremiumPngSrc("vehicles"),
    verified: true,
    category: "Vehicles",
    listingCount: 42,
    href: "/search?category=vehicles",
  },
  {
    id: "biz-4",
    name: "Green Garden Co.",
    slug: "green-garden",
    logoUrl: getCategoryPremiumPngSrc("home-garden"),
    verified: true,
    category: "Home & Garden",
    listingCount: 89,
    href: "/search?category=home-garden",
  },
];

export function getCategoryIconSrc(icon: string): string {
  if (isRovexoCategoryPremiumKey(icon)) {
    return getCategoryPremiumPngSrc(icon);
  }
  return getCategoryPremiumPngSrc("electronics");
}

export function productToHref(product: Product): string {
  return `/listing/${product.slug}`;
}

export function isDealProduct(product: Product): boolean {
  return Boolean(product.originalPrice && product.originalPrice > product.price);
}

export function deriveBusinessesFromProducts(products: Product[]): RovexoBusiness[] {
  const seen = new Set<string>();
  const businesses: RovexoBusiness[] = [];

  for (const product of products) {
    const key = product.sellerId ?? product.sellerName;
    if (!key || seen.has(key)) continue;
    if (product.sellerTier !== "business" && product.listingType !== "business") continue;

    seen.add(key);
    businesses.push({
      id: key,
      name: product.sellerName,
      slug: product.slug,
      logoUrl: product.sellerAvatar || product.imageUrl || getCategoryPremiumPngSrc("electronics"),
      verified: Boolean(product.sellerVerified),
      category: product.brand ?? "Business",
      listingCount: 1,
      href: product.sellerId ? `/search?seller=${encodeURIComponent(product.sellerId)}` : "/search?category=business",
    });
    if (businesses.length >= 8) break;
  }

  return businesses.length > 0 ? businesses : ROVEXO_BUSINESS_FALLBACK;
}
