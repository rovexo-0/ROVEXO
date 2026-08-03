import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HelpArticlePage } from "@/features/help/components/HelpArticlePage";
import { getHelpArticle } from "@/lib/help/content/articles";
import {
  PRODUCT_DELIVERY_DETAILS_HREF,
  PRODUCT_DELIVERY_LEGACY_HELP_SLUGS,
} from "@/lib/product-detail/delivery-details-route-v1";

/** Help policy summaries must never compete with Legal SSOT. */
const HELP_TO_LEGAL: Record<string, string> = {
  "privacy-policy": "/legal/privacy-policy",
  "terms-of-service": "/legal/terms-and-conditions",
  "community-guidelines": "/legal/community-guidelines",
  "prohibited-items-list": "/legal/prohibited-restricted-items",
};

/** Fail-closed: broken Delivery help slugs → Delivery Details (never 404). */
const HELP_DELIVERY_ALIASES: Record<string, string> = Object.fromEntries(
  PRODUCT_DELIVERY_LEGACY_HELP_SLUGS.map((slug) => [slug, PRODUCT_DELIVERY_DETAILS_HREF]),
);

type HelpArticleRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: HelpArticleRouteProps): Promise<Metadata> {
  const { slug } = await params;
  if (HELP_TO_LEGAL[slug]) {
    return { title: "Legal | ROVEXO" };
  }
  if (HELP_DELIVERY_ALIASES[slug]) {
    return { title: "Delivery Details | ROVEXO Help" };
  }
  const article = getHelpArticle(slug);
  if (!article) {
    return { title: "Help | ROVEXO" };
  }

  return {
    title: `${article.title} | ROVEXO Help`,
    description: article.summary,
  };
}

export default async function HelpArticleRoute({ params }: HelpArticleRouteProps) {
  const { slug } = await params;
  const legalHref = HELP_TO_LEGAL[slug];
  if (legalHref) {
    redirect(legalHref);
  }

  const deliveryHref = HELP_DELIVERY_ALIASES[slug];
  if (deliveryHref) {
    redirect(deliveryHref);
  }

  const article = getHelpArticle(slug);
  if (!article) {
    notFound();
  }

  return <HelpArticlePage article={article} />;
}
