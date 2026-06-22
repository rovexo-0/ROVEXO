import type { ProductDetail } from "@/lib/products/types";
import type { CategoryBreadcrumb } from "@/lib/categories/navigation";
import { getActiveMarket } from "@/lib/seo/markets";
import { getAppUrl } from "@/lib/supabase/env";

export function productJsonLd(
  product: ProductDetail,
  breadcrumbs: CategoryBreadcrumb[],
) {
  const url = `${getAppUrl()}/listing/${product.slug}`;
  const { currency } = getActiveMarket();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.title,
        description: product.description,
        image: product.images,
        sku: product.slug,
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: currency,
          price: product.price,
          availability:
            product.availability === "out_of_stock"
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
          itemCondition: `https://schema.org/${product.condition.replace(/\s+/g, "")}Condition`,
        },
        aggregateRating:
          product.reviewCount > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: product.rating,
                reviewCount: product.reviewCount,
              }
            : undefined,
      },
      breadcrumbs.length
        ? {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: getAppUrl(),
              },
              ...breadcrumbs.map((crumb, index) => ({
                "@type": "ListItem",
                position: index + 2,
                name: crumb.name,
                item: `${getAppUrl()}${crumb.href}`,
              })),
              {
                "@type": "ListItem",
                position: breadcrumbs.length + 2,
                name: product.title,
                item: url,
              },
            ],
          }
        : undefined,
    ].filter(Boolean),
  };
}

export function categoryJsonLd(name: string, slugPath: string[], description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: `${getAppUrl()}/category/${slugPath.join("/")}`,
    isPartOf: {
      "@type": "WebSite",
      name: "ROVEXO",
      url: getAppUrl(),
    },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; href: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${getAppUrl()}${item.href.startsWith("/") ? item.href : `/${item.href}`}`,
    })),
  };
}

export function businessStoreJsonLd(input: {
  name: string;
  slug: string;
  description?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: input.name,
    url: `${getAppUrl()}/store/${input.slug}`,
    description: input.description ?? `${input.name} on ROVEXO`,
  };
}

export function sellerStoreJsonLd(input: {
  name: string;
  username: string;
  rating?: number;
  reviewCount?: number;
}) {
  return {
    "@context": "https://schema.org",
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
  };
}

export function localBusinessJsonLd(input: {
  name: string;
  locationName: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    url: `${getAppUrl()}${input.path}`,
    contentLocation: {
      "@type": "Place",
      name: input.locationName,
      address: {
        "@type": "PostalAddress",
        addressCountry: "GB",
      },
    },
  };
}
