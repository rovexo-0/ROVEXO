import type { Product } from "@/lib/products/types";
import type { OrganicLandingPage } from "@/lib/seo/engine/types";
import type { InternalLinkGroup } from "@/lib/seo/internal-links";
import { buildPageEntityGraph, graphInternalLinks } from "@/lib/seo/engine/entity-graph";
import {
  SEO_LINK_CAPS,
  helpClusterLinks,
  popularBrowseLinks,
  relatedCategoryLinks,
} from "@/lib/seo/internal-links";
import { WAVE_A_COLLECTION_SLUGS } from "@/lib/seo/wave-a-collections-v1";
import { getCollectionDefinitions } from "@/lib/seo/engine/collections";

function capGroups(groups: InternalLinkGroup[], max: number): InternalLinkGroup[] {
  const remaining = { n: max };
  const capped: InternalLinkGroup[] = [];
  for (const group of groups) {
    if (remaining.n <= 0) break;
    const links = group.links.slice(0, remaining.n);
    remaining.n -= links.length;
    if (links.length) capped.push({ title: group.title, links });
  }
  return capped;
}

function waveASiblingCollectionLinks(currentSlug: string, limit = 5): InternalLinkGroup {
  const defs = getCollectionDefinitions();
  const preferred = WAVE_A_COLLECTION_SLUGS.filter((slug) => slug !== currentSlug);
  const links = preferred
    .map((slug) => {
      const def = defs.find((entry) => entry.slug === slug);
      if (!def) return null;
      return { label: def.title.replace(/\s+on ROVEXO$/i, ""), href: `/collections/${def.slug}` };
    })
    .filter((link): link is { label: string; href: string } => Boolean(link))
    .slice(0, limit);

  return { title: "More collections", links };
}

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
    groups.push(waveASiblingCollectionLinks(page.slug, 5));
    groups.push(helpClusterLinks(4));
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

  const entityLinks = graphInternalLinks(graph, 4);
  if (entityLinks.length) {
    groups.push({ title: "Related", links: entityLinks });
  }

  const maxLinks =
    page.kind === "collection" ? SEO_LINK_CAPS.collection : SEO_LINK_CAPS.categoryHub;
  const cappedGroups = capGroups(groups, maxLinks);
  const linkCount = cappedGroups.reduce((sum, group) => sum + group.links.length, 0);
  const orphan = linkCount === 0 && page.breadcrumbs.length <= 1;

  return { groups: cappedGroups, linkCount, orphan };
}

export function ensureNoOrphanLinks(linkCount: number, pagePath: string): boolean {
  return linkCount > 0 || pagePath === "/";
}
