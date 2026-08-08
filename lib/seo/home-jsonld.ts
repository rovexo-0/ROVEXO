import type { Product } from "@/lib/products/types";
import { getActiveMarket } from "@/lib/seo/markets";

export function homePageJsonLd(featured: Product[], siteUrl: string) {
  const { currency } = getActiveMarket();
  /* Join base must not keep trailing slash — homepage canonical is `…/` and paths start with `/`. */
  const base = siteUrl.replace(/\/$/, "");

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ROVEXO",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${base}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: featured.slice(0, 12).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${base}/listing/${product.slug}`,
        item: {
          "@type": "Product",
          name: product.title,
          image: product.imageUrl,
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: currency,
            availability: "https://schema.org/InStock",
          },
        },
      })),
    },
  };
}
