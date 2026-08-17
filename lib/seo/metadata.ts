import type { Metadata } from "next";
import { absoluteCanonicalFromPath } from "@/lib/seo/engine/canonical";
import { getAppUrl } from "@/lib/supabase/env";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  imageUrl?: string;
  type?: "website" | "article";
  noIndex?: boolean;
  /** 404 / soft-unavailable: do not emit a canonical (or OG url) for a missing page. */
  omitCanonical?: boolean;
};

function metadataTitle(title: string): Metadata["title"] {
  return /\bROVEXO\b/i.test(title) ? { absolute: title } : title;
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const path = input.path.startsWith("/") ? input.path : `/${input.path}`;
  const canonical = absoluteCanonicalFromPath(path);
  const image = input.imageUrl ?? `${getAppUrl()}/brand/og-image.png`;
  const omitCanonical = input.omitCanonical === true;

  return {
    title: metadataTitle(input.title),
    description: input.description,
    ...(omitCanonical ? {} : { alternates: { canonical } }),
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: input.title,
      description: input.description,
      ...(omitCanonical ? {} : { url: canonical }),
      siteName: "ROVEXO",
      locale: "en_GB",
      type: input.type ?? "website",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}

export function organizationJsonLd() {
  const url = getAppUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "ROVEXO",
        url,
        logo: `${url}/icons/icon-512.png`,
        sameAs: [],
      },
      {
        "@type": "WebSite",
        name: "ROVEXO",
        url,
        potentialAction: {
          "@type": "SearchAction",
          target: `${url}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function sellerProfileJsonLd(input: {
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
