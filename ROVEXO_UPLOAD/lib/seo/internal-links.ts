import type { Product } from "@/lib/products/types";
import { categoryTree } from "@/lib/categories/tree";
import { findNodeBySlugPath } from "@/lib/categories/navigation";

export type InternalLinkGroup = {
  title: string;
  links: { label: string; href: string }[];
};

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

export function popularBrowseLinks(limit = 8): InternalLinkGroup {
  return {
    title: "Popular searches",
    links: [
      { label: "Cars", href: "/browse/cars" },
      { label: "Phones", href: "/browse/phones" },
      { label: "Laptops", href: "/browse/laptops" },
      { label: "Furniture", href: "/browse/furniture" },
      { label: "Bedding", href: "/browse/bedding" },
      { label: "Tools", href: "/browse/tools" },
      { label: "Fashion", href: "/browse/fashion" },
      { label: "Gaming", href: "/browse/gaming" },
    ].slice(0, limit),
  };
}

export function localBrowseLinks(locationSlug: string, locationName: string): InternalLinkGroup {
  return {
    title: `Popular in ${locationName}`,
    links: ["cars", "phones", "furniture", "electronics"].map((alias) => ({
      label: `${alias.replace(/-/g, " ")} in ${locationName}`,
      href: `/browse/${alias}/${locationSlug}`,
    })),
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
