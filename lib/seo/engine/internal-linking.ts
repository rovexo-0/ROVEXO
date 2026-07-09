import type { Product } from "@/lib/products/types";
import type { InternalLinkGroup } from "@/lib/seo/internal-links";
import { CATEGORY_ALIASES } from "@/lib/seo/programmatic/aliases";
import type { BrandPage, DiscoveryPage } from "@/lib/seo/engine/types";

export function productDetailLinkGroups(input: {
  similarProducts: Product[];
  sameSellerProducts: Product[];
  categoryPath?: string[];
  brand?: string | null;
}): InternalLinkGroup[] {
  const groups: InternalLinkGroup[] = [];

  if (input.similarProducts.length) {
    groups.push({
      title: "Similar listings",
      links: input.similarProducts.slice(0, 6).map((product) => ({
        label: product.title,
        href: `/listing/${product.slug}`,
      })),
    });
  }

  if (input.sameSellerProducts.length) {
    groups.push({
      title: "More from this seller",
      links: input.sameSellerProducts.slice(0, 6).map((product) => ({
        label: product.title,
        href: `/listing/${product.slug}`,
      })),
    });
  }

  if (input.categoryPath?.length) {
    const categorySlug = input.categoryPath[input.categoryPath.length - 1]!;
    groups.push({
      title: "Same category",
      links: [
        {
          label: "Browse category",
          href: `/category/${input.categoryPath.join("/")}`,
        },
        {
          label: "Popular browse",
          href: `/browse/${categorySlug}`,
        },
      ],
    });
  }

  if (input.brand) {
    const brandSlug = input.brand.toLowerCase().replace(/\s+/g, "-");
    groups.push({
      title: "Same brand",
      links: [
        { label: `${input.brand} brand page`, href: `/brand/${brandSlug}` },
        { label: `Used ${input.brand}`, href: `/discover/used-${brandSlug}` },
      ],
    });
  }

  return groups;
}

export function brandPageLinkGroups(page: BrandPage, categorySlugs: string[]): InternalLinkGroup[] {
  const aliasEntry = Object.entries(CATEGORY_ALIASES).find(([, path]) =>
    path.join("/") === categorySlugs.join("/"),
  );

  const browseHref = aliasEntry ? `/browse/${aliasEntry[0]}/${page.slug}` : `/search?q=${encodeURIComponent(page.name)}&brand=${encodeURIComponent(page.name)}`;

  return [
    {
      title: `${page.name} collections`,
      links: [
        { label: `Used ${page.name}`, href: `/discover/used-${page.slug}` },
        { label: `New ${page.name}`, href: `/discover/new-${page.slug}` },
        { label: `Cheap ${page.name}`, href: `/discover/cheap-${page.slug}` },
      ],
    },
    {
      title: "Browse",
      links: [{ label: `${page.name} listings`, href: browseHref }],
    },
  ];
}

export function discoveryPageLinkGroups(page: DiscoveryPage): InternalLinkGroup[] {
  const related: InternalLinkGroup = {
    title: "Related searches",
    links: [],
  };

  if (page.slug.startsWith("used-")) {
    const product = page.slug.replace(/^used-/, "");
    related.links.push(
      { label: `New ${product.replace(/-/g, " ")}`, href: `/discover/new-${product}` },
      { label: `Cheap ${product.replace(/-/g, " ")}`, href: `/discover/cheap-${product}` },
    );
  }

  if (page.slug.startsWith("buy-")) {
    const category = page.slug.replace(/^buy-/, "");
    related.links.push({ label: `Sell ${category.replace(/-/g, " ")}`, href: `/discover/sell-${category}` });
  }

  if (page.slug.startsWith("sell-")) {
    const category = page.slug.replace(/^sell-/, "");
    related.links.push({ label: `Buy ${category.replace(/-/g, " ")}`, href: `/discover/buy-${category}` });
  }

  return related.links.length ? [related] : [];
}

export function storePageLinkGroups(input: {
  username: string;
  products: Product[];
  categories: string[];
}): InternalLinkGroup[] {
  const groups: InternalLinkGroup[] = [];

  if (input.products.length) {
    groups.push({
      title: "Featured products",
      links: input.products.slice(0, 6).map((product) => ({
        label: product.title,
        href: `/listing/${product.slug}`,
      })),
    });
  }

  if (input.categories.length) {
    groups.push({
      title: "Store categories",
      links: input.categories.slice(0, 6).map((category) => ({
        label: category,
        href: `/search?seller=${encodeURIComponent(input.username)}&q=${encodeURIComponent(category)}`,
      })),
    });
  }

  return groups;
}
