"use client";

import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalInfoBlock } from "@/src/components/canonical";
import Link from "next/link";
import { useEffect } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";

import { HelpResolutionPrompt } from "@/features/help/components/HelpResolutionPrompt";
import { useRefreshHelpOnSellerContextChange } from "@/features/help/hooks/use-refresh-help-on-seller-context-change";
import { getHelpTopic } from "@/lib/help/content/topics";
import { getHelpArticleForAudience } from "@/lib/help/content/articles";
import { helpCategoryBreadcrumb, helpTopicGuideHref } from "@/lib/help/help-article-nav-v1";
import { HELP_AUDIENCES_FOR_GUEST, type HelpContentAudience } from "@/lib/help/help-content-audience-v1";
import { renderMarkdown } from "@/lib/help/markdown";
import { markArticleViewed, readHelpSession, startHelpSession, trackHelpEvent } from "@/lib/help/session";
import type { HelpArticle } from "@/lib/help/types";

type HelpArticlePageProps = {
  article: HelpArticle;
  allowedAudiences?: readonly HelpContentAudience[];
};

export function HelpArticlePage({
  article,
  allowedAudiences = HELP_AUDIENCES_FOR_GUEST,
}: HelpArticlePageProps) {
  useRefreshHelpOnSellerContextChange();
  const topic = getHelpTopic(article.topic ?? "other");
  const guideHref = helpTopicGuideHref(article.topic);
  const categoryCrumb = helpCategoryBreadcrumb(article.category);
  const related = (article.relatedArticleSlugs ?? [])
    .map((slug) => getHelpArticleForAudience(slug, allowedAudiences))
    .filter((entry): entry is HelpArticle => Boolean(entry));

  useEffect(() => {
    if (article.topic) {
      startHelpSession(article.topic);
    }
    const session = markArticleViewed(readHelpSession(), article.slug);
    void trackHelpEvent({
      type: "article_view",
      topicSlug: article.topic,
      articleSlug: article.slug,
      path: session.path,
    });
  }, [article.slug, article.topic]);

  return (
    <AccountCanonicalShell title={article.title} backHref="/help" backLabel="Help Centre" showHeaderTitle>
      <nav aria-label="Breadcrumb" className="cds-section__intro">
        <Link href="/help" className="font-medium text-primary hover:opacity-80">
          Help Centre
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={categoryCrumb.href} className="font-medium text-primary hover:opacity-80">
          {categoryCrumb.label}
        </Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{article.title}</span>
      </nav>

      {guideHref && topic ? (
        <CanonicalInfoBlock variant="tip">
          <Link href={guideHref} className="font-medium text-primary hover:opacity-80">
            Open {topic.label} guided troubleshooting
          </Link>
        </CanonicalInfoBlock>
      ) : null}

      <CanonicalInfoBlock variant="description">{article.summary}</CanonicalInfoBlock>

      <CanonicalCard variant="medium">
        <div className="flex flex-col gap-ds-5 p-ds-4">
          <div
            className="prose-help cds-menu-row__subtitle"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
          />
          {article.lastUpdated ? (
            <p className="cds-field__hint">Last updated {article.lastUpdated}</p>
          ) : null}
        </div>
      </CanonicalCard>

      {related.length ? (
        <CanonicalSection title="Related articles">
          <CanonicalCard variant="list">
            {related.map((entry) => (
              <CanonicalMenuRow
                key={entry.slug}
                title={entry.title}
                description={entry.summary}
                href={`/help/${entry.slug}`}
              />
            ))}
          </CanonicalCard>
        </CanonicalSection>
      ) : null}

      <CanonicalSection title="Need more help?">
        <CanonicalCard variant="list">
          <CanonicalMenuRow title="Contact Support" description="Open a support request" href="/support" />
          <CanonicalMenuRow title="Help Centre" description="Browse guides and FAQs" href="/help" />
        </CanonicalCard>
      </CanonicalSection>

      {article.topic ? <HelpResolutionPrompt topicSlug={article.topic} /> : null}
    </AccountCanonicalShell>
  );
}
