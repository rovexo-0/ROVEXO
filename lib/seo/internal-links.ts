import type { Product } from "@/lib/products/types";
import { categoryTree } from "@/lib/categories/tree";
import { findNodeBySlugPath } from "@/lib/categories/navigation";
import { CANONICAL_ROOT_CATEGORIES } from "@/lib/categories/canonical-root-categories-v1";
import { HELP_ARTICLES } from "@/lib/help/content/articles";
import { waveAFeaturedCollectionLinks } from "@/lib/seo/wave-a-collections-v1";
import { getCategoryHubEditorial } from "@/lib/seo/category-hub-editorial-v1";

export type InternalLinkGroup = {
  title: string;
  links: { label: string; href: string }[];
};

/** P12.1 link caps — never exceed on SEO content blocks. */
export const SEO_LINK_CAPS = {
  homepage: 25,
  categoryHub: 20,
  collection: 18,
  listing: 12,
  seller: 15,
  helpArticle: 10,
  faqIndex: 15,
} as const;

function capGroup(group: InternalLinkGroup, remaining: { n: number }): InternalLinkGroup {
  if (remaining.n <= 0) return { title: group.title, links: [] };
  const links = group.links.slice(0, remaining.n);
  remaining.n -= links.length;
  return { title: group.title, links };
}

export function relatedCategoryLinks(categorySlugs: string[], limit = 6): InternalLinkGroup {
  const path = findNodeBySlugPath(categoryTree, categorySlugs);
  const parent = path?.[path.length - 2];
  const siblings = parent?.children ?? categoryTree;

  return {
    title: "More categories",
    links: siblings
      .filter((node) => node.slug !== categorySlugs[categorySlugs.length - 1])
      .slice(0, limit)
      .map((node) => ({
        label: node.name,
        href: `/category/${[...categorySlugs.slice(0, -1), node.slug].join("/")}`,
      })),
  };
}

/**
 * Catalog Master–aligned popular links (P12 Wave A).
 * Whole vehicles / forbidden roots are never promoted.
 */
export function popularBrowseLinks(limit = 8): InternalLinkGroup {
  return {
    title: "Popular categories",
    links: CANONICAL_ROOT_CATEGORIES.slice(0, limit).map((root) => ({
      label: root.name,
      href: `/category/${root.slug}`,
    })),
  };
}

export function localBrowseLinks(locationSlug: string, locationName: string): InternalLinkGroup {
  return {
    title: `Popular in ${locationName}`,
    links: [
      { label: `Electronics in ${locationName}`, href: `/browse/electronics/${locationSlug}` },
      { label: `Furniture in ${locationName}`, href: `/browse/furniture/${locationSlug}` },
      { label: `Phones in ${locationName}`, href: `/browse/phones/${locationSlug}` },
      { label: `Fashion in ${locationName}`, href: `/browse/fashion/${locationSlug}` },
    ],
  };
}

export function sellerListingLinks(username: string, products: Product[]): InternalLinkGroup {
  return {
    title: "More from this seller",
    links: products.slice(0, 6).map((product) => ({
      label: product.title,
      href: `/listing/${product.slug}`,
    })),
  };
}

export function similarListingLinks(products: Product[]): InternalLinkGroup {
  return {
    title: "Similar listings",
    links: products.slice(0, 6).map((product) => ({
      label: product.title,
      href: `/listing/${product.slug}`,
    })),
  };
}

export function trendingListingLinks(products: Product[]): InternalLinkGroup {
  return {
    title: "Trending now",
    links: products.slice(0, 6).map((product) => ({
      label: product.title,
      href: `/listing/${product.slug}`,
    })),
  };
}

export function helpClusterLinks(limit = 6): InternalLinkGroup {
  return {
    title: "Help Centre",
    links: [
      { label: "How to buy", href: "/help/buying-how-to-buy" },
      { label: "Start selling", href: "/help/selling-get-started" },
      { label: "Payments & Checkout", href: "/help/payments-checkout" },
      { label: "Wallet & Balance", href: "/help/wallet-overview" },
      { label: "Delivery & shipping", href: "/help/delivery-shipping" },
      { label: "FAQ", href: "/help/faq" },
    ].slice(0, limit),
  };
}

/** Category hub outbound graph with P12.1 caps. */
export function categoryHubInternalLinkGroups(slugPath: string[]): InternalLinkGroup[] {
  const remaining = { n: SEO_LINK_CAPS.categoryHub };
  const editorial = getCategoryHubEditorial(slugPath);
  const groups: InternalLinkGroup[] = [
    capGroup(relatedCategoryLinks(slugPath), remaining),
    capGroup(popularBrowseLinks(6), remaining),
  ];
  if (editorial) {
    groups.push(capGroup(editorial.collectionLinks, remaining));
    groups.push(capGroup(editorial.guideLinks, remaining));
  } else {
    groups.push(capGroup(waveAFeaturedCollectionLinks(4), remaining));
    groups.push(capGroup(helpClusterLinks(4), remaining));
  }
  return groups.filter((group) => group.links.length > 0);
}

/** Homepage SEO graph — data only; Homepage UI freeze uses existing category rail. */
export function homepageSeoLinkGroups(): InternalLinkGroup[] {
  const remaining = { n: SEO_LINK_CAPS.homepage };
  return [
    capGroup(popularBrowseLinks(10), remaining),
    capGroup(waveAFeaturedCollectionLinks(5), remaining),
    capGroup(helpClusterLinks(3), remaining),
  ].filter((group) => group.links.length > 0);
}

export function helpArticleLinkGroups(relatedSlugs: string[]): InternalLinkGroup[] {
  const remaining = { n: SEO_LINK_CAPS.helpArticle };
  const related: InternalLinkGroup = {
    title: "Related guides",
    links: relatedSlugs.slice(0, 5).map((slug) => {
      const article = HELP_ARTICLES.find((entry) => entry.slug === slug);
      return {
        label: article?.title ?? slug.replace(/-/g, " "),
        href: `/help/${slug}`,
      };
    }),
  };
  return [
    capGroup(related, remaining),
    capGroup(popularBrowseLinks(3), remaining),
    capGroup(waveAFeaturedCollectionLinks(2), remaining),
  ].filter((group) => group.links.length > 0);
}
