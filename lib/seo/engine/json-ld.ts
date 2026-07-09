import type { Product } from "@/lib/products/types";
import { getAppUrl } from "@/lib/supabase/env";
import type { BrandPage, OrganicLandingPage } from "@/lib/seo/engine/types";
import { breadcrumbJsonLd, categoryJsonLd } from "@/lib/seo/json-ld";

export function discoveryPageJsonLd(page: OrganicLandingPage, products: Product[]) {
  return {
    collection: categoryJsonLd(page.title, [], page.description),
    breadcrumbs: breadcrumbJsonLd(page.breadcrumbs),
    itemList: itemListJsonLd(page.path, page.title, products),
  };
}

export function brandPageJsonLd(page: BrandPage, products: Product[]) {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: page.name, href: page.path },
  ];

  return {
    collection: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: page.title,
      description: page.description,
      url: `${getAppUrl()}${page.path}`,
    },
    breadcrumbs: breadcrumbJsonLd(breadcrumbs),
    itemList: itemListJsonLd(page.path, page.name, products),
  };
}

export function storePageJsonLd(input: {
  name: string;
  slug: string;
  description?: string;
  products: Product[];
  rating?: number;
  reviewCount?: number;
}) {
  return {
    store: {
      "@context": "https://schema.org",
      "@type": "Store",
      name: input.name,
      url: `${getAppUrl()}/store/${input.slug}`,
      description: input.description ?? `${input.name} on ROVEXO`,
      aggregateRating:
        input.reviewCount && input.reviewCount > 0
          ? {
              "@type": "AggregateRating",
              ratingValue: input.rating ?? 5,
              reviewCount: input.reviewCount,
            }
          : undefined,
    },
    itemList: itemListJsonLd(`/store/${input.slug}`, input.name, input.products),
  };
}

export function sellerProfilePageJsonLd(input: {
  name: string;
  username: string;
  products: Product[];
  rating?: number;
  reviewCount?: number;
}) {
  return {
    profile: {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      mainEntity: {
        "@type": "Person",
        name: input.name,
        url: `${getAppUrl()}/user/${input.username}`,
        aggregateRating:
          input.reviewCount && input.reviewCount > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: input.rating ?? 5,
                reviewCount: input.reviewCount,
              }
            : undefined,
      },
    },
    itemList: itemListJsonLd(`/user/${input.username}`, input.name, input.products),
  };
}

function itemListJsonLd(path: string, name: string, products: Product[]) {
  if (!products.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: `${getAppUrl()}${path}`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 12).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${getAppUrl()}/listing/${product.slug}`,
      name: product.title,
    })),
  };
}

export function productImageAlt(input: { title: string; index: number; total: number }): string {
  if (input.total <= 1) return input.title;
  return `${input.title} — image ${input.index + 1} of ${input.total}`;
}

export function productImageTitle(title: string): string {
  return title;
}
