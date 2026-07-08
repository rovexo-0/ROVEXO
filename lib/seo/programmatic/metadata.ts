import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { categoryJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import type { ProgrammaticPage } from "@/lib/seo/programmatic/resolver";
import { getAppUrl } from "@/lib/supabase/env";
import { getCategoryImageUrl } from "@/lib/categories/visuals";

export function programmaticPageMetadata(page: ProgrammaticPage): Metadata {
  const title = `${page.title} | Buy & Sell on ROVEXO`;
  return buildPageMetadata({
    title,
    description: page.description,
    path: page.path,
    imageUrl: getCategoryImageUrl(page.categorySlugs[0] ?? "everything-else"),
  });
}

export function programmaticPageJsonLd(page: ProgrammaticPage) {
  const breadcrumbs = [
    { name: "Home", href: "/" },
    ...page.categorySlugs.map((slug, index) => ({
      name: slug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "),
      href: `/category/${page.categorySlugs.slice(0, index + 1).join("/")}`,
    })),
    { name: page.title, href: page.path },
  ];

  return {
    collection: categoryJsonLd(page.title, page.categorySlugs, page.description),
    breadcrumbs: breadcrumbJsonLd(breadcrumbs),
    faq: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `Where can I buy ${page.title.toLowerCase()} on ROVEXO?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `Browse ${page.title.toLowerCase()} listings on ROVEXO with purchase protection and secure checkout.`,
          },
        },
        {
          "@type": "Question",
          name: `Is it safe to buy ${page.title.toLowerCase()} on ROVEXO?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. ROVEXO offers purchase protection, verified sellers, and secure payments on eligible purchases.",
          },
        },
      ],
    },
    searchAction: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: getAppUrl(),
      potentialAction: {
        "@type": "SearchAction",
        target: `${getAppUrl()}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  };
}
