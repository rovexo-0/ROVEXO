/**
 * ROVEXO Marketplace SEO Engine v1.0 — Phase 4 orchestrator.
 *
 * Derives SEO packets from existing marketplace data through certified SSOTs.
 * Not a second eligibility, canonical, metadata, JSON-LD, or linking engine.
 * No AI. No N+1. No combinatorial page explosion.
 */

import type { Metadata } from "next";
import type { ProductDetail } from "@/lib/products/types";
import type { ProductStatus } from "@/lib/supabase/types/database";
import { findNodeBySlugPath } from "@/lib/categories/navigation";
import { categoryTree } from "@/lib/categories/tree";
import { isForbiddenMarketplaceSlug } from "@/lib/listings/forbidden-marketplace-inventory";
import {
  absoluteCanonicalFromPath,
  canonicalForBrand,
  canonicalForCategory,
  canonicalForListing,
  canonicalForLocation,
  canonicalForStore,
} from "@/lib/seo/engine/canonical";
import {
  evaluateListingSeoEligibility,
  evaluateSeoEligibility,
  type SeoEligibilityResult,
} from "@/lib/seo/engine/eligibility";
import { brandPageMetadata, browsePageMetadata, productPageMetadata, storePageMetadata } from "@/lib/seo/engine/metadata";
import { buildBrandPage } from "@/lib/seo/engine/brands";
import {
  brandPageLinkGroups,
  productDetailLinkGroups,
  storePageLinkGroups,
} from "@/lib/seo/engine/internal-linking";
import { breadcrumbJsonLd, businessStoreJsonLd, categoryJsonLd, localBusinessJsonLd, productJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { InternalLinkGroup } from "@/lib/seo/internal-links";
import { popularBrowseLinks, relatedCategoryLinks } from "@/lib/seo/internal-links";
import { findLocationBySlug } from "@/lib/seo/locations/uk";
import { resolveProgrammaticPage } from "@/lib/seo/programmatic/resolver";
import { programmaticPageJsonLd } from "@/lib/seo/programmatic/metadata";
import { isSitemapPathEligible } from "@/lib/seo/sitemaps/eligibility-filter";

export const MARKETPLACE_SEO_ENGINE_V1 = "1.0" as const;

export type MarketplaceSeoKind =
  | "category"
  | "subcategory"
  | "product_type"
  | "listing"
  | "store"
  | "brand"
  | "location"
  | "programmatic";

export type MarketplaceSeoPacket = {
  kind: MarketplaceSeoKind;
  generated: boolean;
  reason: string;
  path: string;
  canonicalUrl: string | null;
  metadata: Metadata | null;
  jsonLd: unknown[];
  internalLinks: InternalLinkGroup[];
  eligibility: SeoEligibilityResult | null;
  sitemapEligible: boolean;
};

function reject(kind: MarketplaceSeoKind, path: string, reason: string): MarketplaceSeoPacket {
  return {
    kind,
    generated: false,
    reason,
    path,
    canonicalUrl: null,
    metadata: null,
    jsonLd: [],
    internalLinks: [],
    eligibility: null,
    sitemapEligible: false,
  };
}

function accept(input: {
  kind: MarketplaceSeoKind;
  path: string;
  reason: string;
  canonicalUrl: string;
  metadata: Metadata;
  jsonLd: unknown[];
  internalLinks: InternalLinkGroup[];
  eligibility: SeoEligibilityResult;
  sitemapEligible: boolean;
}): MarketplaceSeoPacket {
  return {
    kind: input.kind,
    generated: true,
    reason: input.reason,
    path: input.path,
    canonicalUrl: input.canonicalUrl,
    metadata: input.metadata,
    jsonLd: input.jsonLd,
    internalLinks: input.internalLinks,
    eligibility: input.eligibility,
    sitemapEligible: input.sitemapEligible,
  };
}

export function classifyTaxonomyDepth(
  slugs: string[],
): "category" | "subcategory" | "product_type" | null {
  const path = findNodeBySlugPath(categoryTree, slugs);
  if (!path?.length) return null;
  if (path.length === 1) return "category";
  if (path.length === 2) return "subcategory";
  return "product_type";
}

function taxonomyBreadcrumbs(slugs: string[]): { name: string; href: string }[] {
  const crumbs = [{ name: "Home", href: "/" }];
  const path = findNodeBySlugPath(categoryTree, slugs);
  if (!path) return crumbs;
  path.forEach((node, index) => {
    crumbs.push({
      name: node.name,
      href: `/category/${slugs.slice(0, index + 1).join("/")}`,
    });
  });
  return crumbs;
}

export function deriveCategorySeo(input: {
  slugs: string[];
  listingCount?: number;
  imageUrl?: string;
}): MarketplaceSeoPacket {
  const kind = classifyTaxonomyDepth(input.slugs);
  if (!kind) {
    return reject("category", `/category/${input.slugs.join("/")}`, "taxonomy_not_found");
  }

  const path = `/category/${input.slugs.join("/")}`;
  const node = findNodeBySlugPath(categoryTree, input.slugs)!.at(-1)!;
  const title = `${node.name} for Sale UK`;
  const description = `Shop ${node.name} on ROVEXO. Browse verified UK sellers with purchase protection and secure checkout.`;
  const eligibility = evaluateSeoEligibility({
    pageType: "category",
    path,
    listingCount: input.listingCount,
    taxonomyValid: true,
  });
  const canonical = canonicalForCategory(input.slugs);
  const sitemapEligible =
    eligibility.sitemapEligible &&
    eligibility.indexation === "INDEX" &&
    isSitemapPathEligible(path, { pageType: "category", listingCount: input.listingCount });

  if (typeof input.listingCount === "number" && !eligibility.eligible) {
    return reject(kind, path, eligibility.reason);
  }

  return accept({
    kind,
    path,
    reason: "taxonomy_derived",
    canonicalUrl: canonical.canonicalUrl,
    metadata: buildPageMetadata({
      title,
      description,
      path,
      imageUrl: input.imageUrl,
      noIndex: !sitemapEligible,
    }),
    jsonLd: [
      categoryJsonLd(node.name, input.slugs, description),
      breadcrumbJsonLd(taxonomyBreadcrumbs(input.slugs)),
    ],
    internalLinks: [relatedCategoryLinks(input.slugs), popularBrowseLinks(6)].filter(
      (group) => group.links.length > 0,
    ),
    eligibility,
    sitemapEligible,
  });
}

export function deriveListingSeo(input: {
  slug: string;
  title: string;
  description?: string;
  price: number;
  condition: string;
  images?: string[];
  imageUrl?: string;
  availability?: ProductDetail["availability"];
  brand?: string | null;
  categoryPath?: string[];
  storeSlug?: string | null;
  sellerUsername?: string | null;
  productFound: boolean;
  productStatus?: ProductStatus | null;
  rating?: number;
  reviewCount?: number;
}): MarketplaceSeoPacket {
  const path = `/listing/${input.slug}`;
  if (!input.productFound) {
    return reject("listing", path, "listing_not_found");
  }
  if (isForbiddenMarketplaceSlug(input.slug)) {
    return reject("listing", path, "listing_prohibited");
  }

  const listing = evaluateListingSeoEligibility({
    slug: input.slug,
    productFound: true,
    status: input.productStatus ?? "published",
  });
  if (!listing.eligible || listing.indexation !== "INDEX") {
    return reject("listing", path, listing.reason);
  }

  const images = input.images?.length ? input.images : input.imageUrl ? [input.imageUrl] : [];
  const product = {
    id: input.slug,
    slug: input.slug,
    title: input.title,
    description: input.description ?? "",
    price: input.price,
    condition: input.condition,
    images,
    imageUrl: images[0] ?? "",
    availability: input.availability ?? "in_stock",
    brand: input.brand ?? undefined,
    rating: input.rating ?? 0,
    reviewCount: input.reviewCount ?? 0,
    sellerName: input.sellerUsername ?? "Seller",
    sellerId: "seo-derived",
    sections: [],
    salesCount: 0,
    deliveryCarriers: [],
    stock: 1,
    transactionMode: "MARKETPLACE",
  } as ProductDetail;

  const breadcrumbs = (input.categoryPath ?? []).map((slug, index, all) => ({
    id: slug,
    slug,
    name: slug.replace(/-/g, " "),
    href: `/category/${all.slice(0, index + 1).join("/")}`,
  }));

  const links = productDetailLinkGroups({
    similarProducts: [],
    sameSellerProducts: [],
    categoryPath: input.categoryPath,
    brand: input.brand,
  });
  if (input.storeSlug) {
    links.push({
      title: "Store",
      links: [{ label: "Visit store", href: `/store/${input.storeSlug}` }],
    });
  }

  const sitemapEligible =
    listing.sitemapEligible &&
    isSitemapPathEligible(path, {
      pageType: "product",
      productFound: true,
      productStatus: input.productStatus ?? "published",
    });

  return accept({
    kind: "listing",
    path,
    reason: "listing_data_derived",
    canonicalUrl: canonicalForListing(input.slug).canonicalUrl,
    metadata: productPageMetadata({
      title: input.title,
      description: input.description ?? "",
      slug: input.slug,
      imageUrl: images[0],
    }),
    jsonLd: [productJsonLd(product, breadcrumbs)],
    internalLinks: links,
    eligibility: listing,
    sitemapEligible,
  });
}

export function deriveStoreSeo(input: {
  name: string;
  slug: string;
  listingCount: number;
  avatarUrl?: string | null;
  products?: Array<{ title: string; slug: string }>;
  categories?: string[];
}): MarketplaceSeoPacket {
  const path = `/store/${input.slug}`;
  if (!input.slug.trim() || !input.name.trim()) {
    return reject("store", path, "store_identity_missing");
  }

  const eligibility = evaluateSeoEligibility({
    pageType: "store",
    path,
    listingCount: input.listingCount,
  });
  const sitemapEligible =
    eligibility.sitemapEligible &&
    eligibility.indexation === "INDEX" &&
    isSitemapPathEligible(path, { pageType: "store", listingCount: input.listingCount });

  if (!eligibility.eligible) {
    return reject("store", path, eligibility.reason);
  }

  return accept({
    kind: "store",
    path,
    reason: "store_data_derived",
    canonicalUrl: canonicalForStore(input.slug).canonicalUrl,
    metadata: storePageMetadata({
      name: input.name,
      slug: input.slug,
      listingCount: input.listingCount,
      avatarUrl: input.avatarUrl,
    }),
    jsonLd: [
      businessStoreJsonLd({ name: input.name, slug: input.slug }),
      breadcrumbJsonLd([
        { name: "Home", href: "/" },
        { name: input.name, href: path },
      ]),
    ],
    internalLinks: storePageLinkGroups({
      username: input.slug,
      products: (input.products ?? []) as never,
      categories: input.categories ?? [],
    }),
    eligibility,
    sitemapEligible,
  });
}

export function deriveBrandSeo(input: {
  brand: { slug: string; name: string } | null;
  listingCount?: number;
  categorySlugs?: string[];
}): MarketplaceSeoPacket {
  if (!input.brand?.slug || !input.brand.name) {
    return reject("brand", "/brand/", "brand_identity_not_verified");
  }

  const page = buildBrandPage(input.brand);
  const eligibility = evaluateSeoEligibility({
    pageType: "brand",
    path: page.path,
    listingCount: input.listingCount,
  });
  const sitemapEligible =
    eligibility.sitemapEligible &&
    eligibility.indexation === "INDEX" &&
    isSitemapPathEligible(page.path, { pageType: "brand", listingCount: input.listingCount });

  if (typeof input.listingCount === "number" && !eligibility.eligible) {
    return reject("brand", page.path, eligibility.reason);
  }

  return accept({
    kind: "brand",
    path: page.path,
    reason: "brand_identity_verified",
    canonicalUrl: canonicalForBrand(input.brand.slug).canonicalUrl,
    metadata:
      typeof input.listingCount === "number"
        ? brandPageMetadata(page, input.listingCount)
        : buildPageMetadata({
            title: page.title,
            description: page.description,
            path: page.path,
          }),
    jsonLd: [
      categoryJsonLd(page.name, [], page.description),
      breadcrumbJsonLd([
        { name: "Home", href: "/" },
        { name: page.name, href: page.path },
      ]),
    ],
    internalLinks: brandPageLinkGroups(page, input.categorySlugs ?? []),
    eligibility,
    sitemapEligible,
  });
}

export function deriveLocationSeo(input: {
  locationSlug: string;
  listingCount?: number;
}): MarketplaceSeoPacket {
  const location = findLocationBySlug(input.locationSlug);
  const path = `/l/${input.locationSlug}`;
  if (!location) {
    return reject("location", path, "location_not_public");
  }

  const eligibility = evaluateSeoEligibility({
    pageType: "location",
    path,
    listingCount: input.listingCount,
  });
  const sitemapEligible =
    eligibility.sitemapEligible &&
    eligibility.indexation === "INDEX" &&
    isSitemapPathEligible(path, { pageType: "location", listingCount: input.listingCount });

  if (typeof input.listingCount === "number" && !eligibility.eligible) {
    return reject("location", path, eligibility.reason);
  }

  const title = `Marketplace in ${location.name}`;
  const description = `Shop on ROVEXO in ${location.name}. Browse listings from verified UK sellers.`;

  return accept({
    kind: "location",
    path,
    reason: "public_location_derived",
    canonicalUrl: canonicalForLocation(location.slug).canonicalUrl,
    metadata: buildPageMetadata({
      title,
      description,
      path,
      noIndex: !sitemapEligible,
    }),
    jsonLd: [
      localBusinessJsonLd({
        name: title,
        locationName: location.name,
        path,
      }),
    ],
    internalLinks: [popularBrowseLinks(6)],
    eligibility,
    sitemapEligible,
  });
}

export function deriveProgrammaticSeo(input: {
  segments: string[];
  listingCount?: number;
  verifiedBrand?: { slug: string; name: string } | null;
}): MarketplaceSeoPacket {
  const page = resolveProgrammaticPage(input.segments);
  const path = `/browse/${input.segments.join("/")}`;
  if (!page) {
    return reject("programmatic", path, "programmatic_unresolved");
  }
  if (!findNodeBySlugPath(categoryTree, page.categorySlugs)) {
    return reject("programmatic", path, "taxonomy_not_found");
  }
  if (page.brand && !input.verifiedBrand) {
    return reject("programmatic", path, "brand_identity_not_verified");
  }
  if (typeof input.listingCount === "number" && input.listingCount <= 0) {
    return reject("programmatic", path, "empty_inventory");
  }

  const eligibility = evaluateSeoEligibility({
    pageType: "browse",
    path: page.path,
    listingCount: input.listingCount,
    taxonomyValid: true,
  });
  const sitemapEligible =
    eligibility.sitemapEligible &&
    eligibility.indexation === "INDEX" &&
    isSitemapPathEligible(page.path, { pageType: "browse", listingCount: input.listingCount });

  if (typeof input.listingCount === "number" && !eligibility.eligible) {
    return reject("programmatic", path, eligibility.reason);
  }

  return accept({
    kind: "programmatic",
    path: page.path,
    reason: "programmatic_data_derived",
    canonicalUrl: absoluteCanonicalFromPath(
      page.type === "category" ? page.canonicalCategoryPath : page.path,
    ),
    metadata:
      typeof input.listingCount === "number"
        ? browsePageMetadata(page, input.listingCount)
        : buildPageMetadata({
            title: `${page.title} | Buy & Sell on ROVEXO`,
            description: page.description,
            path: page.type === "category" ? page.canonicalCategoryPath : page.path,
          }),
    jsonLd: Object.values(programmaticPageJsonLd(page)),
    internalLinks: [relatedCategoryLinks(page.categorySlugs), popularBrowseLinks(6)].filter(
      (group) => group.links.length > 0,
    ),
    eligibility,
    sitemapEligible,
  });
}

export function uniqueCanonicalUrls(packets: MarketplaceSeoPacket[]): string[] {
  const urls = packets
    .filter((packet) => packet.generated && packet.canonicalUrl)
    .map((packet) => packet.canonicalUrl as string);
  return [...new Set(urls)];
}
