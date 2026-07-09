import type { Product } from "@/lib/products/types";
import type { OrganicLandingPage } from "@/lib/seo/engine/types";
import type { InternalLinkGroup } from "@/lib/seo/internal-links";
import { buildPageEntityGraph, graphInternalLinks } from "@/lib/seo/engine/entity-graph";
import { popularBrowseLinks, relatedCategoryLinks } from "@/lib/seo/internal-links";
import { getAllCollectionSlugs } from "@/lib/seo/engine/collections";

export function buildPageLinkGraph(input: {
  page: OrganicLandingPage;
  products: Product[];
  total: number;
}): { groups: InternalLinkGroup[]; linkCount: number; orphan: boolean } {
  const { page, products } = input;
  const groups: InternalLinkGroup[] = [];

  if (page.search.categorySlugPath?.length) {
    groups.push(relatedCategoryLinks(page.search.categorySlugPath));
  }

  groups.push(popularBrowseLinks(6));

  if (page.search.brand) {
    const brandSlug = page.search.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    groups.push({
      title: "Brand",
      links: [
        { label: `${page.search.brand} brand hub`, href: `/brand/${brandSlug}` },
        { label: `Used ${page.search.brand}`, href: `/discover/used-${brandSlug}` },
      ],
    });
  }

  if (page.search.locationCity) {
    const locSlug = page.search.locationCity.toLowerCase().replace(/\s+/g, "-");
    groups.push({
      title: "Location",
      links: [{ label: `All listings in ${page.search.locationCity}`, href: `/l/${locSlug}` }],
    });
  }

  if (page.kind === "collection") {
    groups.push({
      title: "More collections",
      links: getAllCollectionSlugs()
        .filter((slug) => slug !== page.slug)
        .slice(0, 6)
        .map((slug) => ({ label: slug.replace(/-/g, " "), href: `/collections/${slug}` })),
    });
  }

  const graph = buildPageEntityGraph({
    pagePath: page.path,
    pageTitle: page.title,
    pageKind: page.kind === "collection" ? "collection" : "category",
    products: products.map((product) => ({
      slug: product.slug,
      title: product.title,
      sellerUsername: product.sellerUsername,
      brand: product.brand,
    })),
  });

  const entityLinks = graphInternalLinks(graph, 6);
  if (entityLinks.length) {
    groups.push({ title: "Related", links: entityLinks });
  }

  const linkCount = groups.reduce((sum, group) => sum + group.links.length, 0);
  const orphan = linkCount === 0 && page.breadcrumbs.length <= 1;

  return { groups, linkCount, orphan };
}

export function ensureNoOrphanLinks(linkCount: number, pagePath: string): boolean {
  return linkCount > 0 || pagePath === "/";
}
