import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { robotsForInventory } from "@/lib/seo/engine/index-control";
import { isIndexableInventory } from "@/lib/seo/engine/config";
import type { BrandPage, OrganicLandingPage } from "@/lib/seo/engine/types";
import type { ProgrammaticPage } from "@/lib/seo/programmatic/resolver";
import { getCategoryImageUrl } from "@/lib/categories/visuals";
import { buildStoreShareMetadata, toStoreShareData } from "@/lib/store-sharing/store-share-v1";

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
  username: string;
  listingCount?: number | null;
  avatarUrl?: string | null;
  displayName?: string | null;
  verified?: boolean;
  rating?: number | null;
  reviewCount?: number;
  followersCount?: number;
  storeDescription?: string | null;
}): Metadata {
  const listingsKnown = input.listingCount != null;
  const share = toStoreShareData({
    username: input.username,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
    verified: input.verified,
    rating: input.rating,
    reviewCount: input.reviewCount,
    activeListingsCount: input.listingCount ?? 0,
    followersCount: input.followersCount,
    storeDescription: input.storeDescription,
  });
  const meta = buildStoreShareMetadata(share, { listingsKnown });
  const noIndex = input.listingCount == null || input.listingCount <= 0;
  return {
    title: { absolute: meta.title },
    description: meta.description,
    alternates: { canonical: meta.canonicalUrl },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: meta.canonicalUrl,
      siteName: "ROVEXO",
      locale: "en_GB",
      type: "website",
      images: [
        {
          url: meta.ogImageUrl,
          width: 1200,
          height: 630,
          alt: meta.title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [meta.ogImageUrl],
    },
  };
}

export function productPageMetadata(input: {
  title: string;
  description: string;
  slug: string;
  imageUrl?: string;
}): Metadata {
  const description =
    (input.description ?? "").replace(/\s+/g, " ").trim().slice(0, 160) ||
    `Buy ${input.title} on ROVEXO. Secure UK marketplace checkout.`;

  return buildPageMetadata({
    title: `${input.title} · ROVEXO`,
    description,
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
