import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { robotsForInventory } from "@/lib/seo/engine/index-control";
import { isIndexableInventory } from "@/lib/seo/engine/config";
import type { BrandPage, OrganicLandingPage } from "@/lib/seo/engine/types";
import type { ProgrammaticPage } from "@/lib/seo/programmatic/resolver";
import { getCategoryImageUrl } from "@/lib/categories/visuals";

export function discoveryPageMetadata(page: OrganicLandingPage, listingCount: number): Metadata {  const base = buildPageMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
    noIndex: !isIndexableInventory(listingCount),
  });
  return { ...base, robots: robotsForInventory(listingCount) };
}

export function brandPageMetadata(page: BrandPage, listingCount: number): Metadata {
  const base = buildPageMetadata({
    title: page.title,
    description: page.description,
    path: page.path,
    noIndex: !isIndexableInventory(listingCount),
  });
  return { ...base, robots: robotsForInventory(listingCount) };
}

export function locationCategoryMetadata(input: {
  title: string;
  description: string;
  path: string;
  listingCount: number;
  categorySlug: string;
}): Metadata {
  const base = buildPageMetadata({
    title: `${input.title} | ROVEXO`,
    description: input.description,
    path: input.path,
    imageUrl: getCategoryImageUrl(input.categorySlug),
    noIndex: input.listingCount <= 0,
  });
  return { ...base, robots: robotsForInventory(input.listingCount) };
}

export function storePageMetadata(input: {
  name: string;
  slug: string;
  listingCount: number;
  avatarUrl?: string | null;
}): Metadata {
  return buildPageMetadata({
    title: `${input.name} · ROVEXO Store`,
    description: `Shop ${input.name} on ROVEXO. ${input.listingCount} listings from a verified business seller.`,
    path: `/store/${input.slug}`,
    imageUrl: input.avatarUrl ?? undefined,
    noIndex: input.listingCount <= 0,
  });
}

export function sellerPageMetadata(input: {
  fullName: string;
  username: string;
  listingCount: number;
  avatarUrl?: string | null;
}): Metadata {
  return buildPageMetadata({
    title: `${input.fullName} (@${input.username}) | ROVEXO`,
    description: `Shop listings from ${input.fullName} on ROVEXO. ${input.listingCount} active listings.`,
    path: `/user/${input.username}`,
    imageUrl: input.avatarUrl ?? undefined,
    noIndex: input.listingCount <= 0,
  });
}

export function productPageMetadata(input: {
  title: string;
  description: string;
  slug: string;
  imageUrl?: string;
}): Metadata {
  return buildPageMetadata({
    title: `${input.title} · ROVEXO`,
    description: input.description.slice(0, 160) || `Buy ${input.title} on ROVEXO.`,
    path: `/listing/${input.slug}`,
    imageUrl: input.imageUrl,
  });
}

/** Canonical policy: pure category browse pages point at /category; facets stay on /browse. */
export function browsePageCanonicalPath(page: ProgrammaticPage): string {
  if (page.type === "category") {
    return page.canonicalCategoryPath;
  }
  return page.path;
}

export function browsePageMetadata(page: ProgrammaticPage, listingCount: number): Metadata {
  const canonicalPath = browsePageCanonicalPath(page);
  const title = `${page.title} | Buy & Sell on ROVEXO`;
  const base = buildPageMetadata({
    title,
    description: page.description,
    path: canonicalPath,
    imageUrl: getCategoryImageUrl(page.categorySlugs[0] ?? "everything-else"),
    noIndex: !isIndexableInventory(listingCount),
  });
  return { ...base, robots: robotsForInventory(listingCount) };
}
