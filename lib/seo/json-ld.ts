import type { ProductDetail } from "@/lib/products/types";
import type { CategoryBreadcrumb } from "@/lib/categories/navigation";
import { getAppUrl } from "@/lib/supabase/env";

export function productJsonLd(
  product: ProductDetail,
  breadcrumbs: CategoryBreadcrumb[],
) {
  const url = `${getAppUrl()}/listing/${product.slug}`;

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
          priceCurrency: "EUR",
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
  };
}
