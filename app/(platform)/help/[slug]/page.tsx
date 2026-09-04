import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HelpArticlePage } from "@/features/help/components/HelpArticlePage";
import { getHelpArticleForAudience } from "@/lib/help/content/articles";
import { resolveViewerHelpAudiences } from "@/lib/help/help-content-audience-server-v1";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  PRODUCT_DELIVERY_DETAILS_HREF,
  PRODUCT_DELIVERY_LEGACY_HELP_SLUGS,
} from "@/lib/product-detail/delivery-details-route-v1";

export const dynamic = "force-dynamic";

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
  const allowedAudiences = await resolveViewerHelpAudiences();
  const article = getHelpArticleForAudience(slug, allowedAudiences);
  if (!article) {
    return buildPageMetadata({
      title: "Help | ROVEXO",
      description: "ROVEXO Help Centre.",
      path: "/help",
      noIndex: true,
      omitCanonical: true,
    });
  }

  return buildPageMetadata({
    title: `${article.title} | ROVEXO Help`,
    description: article.summary,
    path: `/help/${slug}`,
  });
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

  const allowedAudiences = await resolveViewerHelpAudiences();
  const article = getHelpArticleForAudience(slug, allowedAudiences);
  if (!article) {
    notFound();
  }

  return (
    <HelpArticlePage
      article={{
        ...article,
        relatedArticleSlugs: (article.relatedArticleSlugs ?? []).filter((relatedSlug) =>
          Boolean(getHelpArticleForAudience(relatedSlug, allowedAudiences)),
        ),
      }}
      allowedAudiences={allowedAudiences}
    />
  );
}
