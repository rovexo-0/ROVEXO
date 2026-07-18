"use client";

import { CanonicalSection, CanonicalCard, CanonicalMenuRow, CanonicalButton, CanonicalInfoBlock, CanonicalInput, CanonicalSelector, CanonicalSwitch, CanonicalTextarea } from "@/src/components/canonical";
import Link from "next/link";
import { useEffect } from "react";
import { AccountCanonicalShell } from "@/features/account-canonical";

import { HelpResolutionPrompt } from "@/features/help/components/HelpResolutionPrompt";
import { getHelpTopic } from "@/lib/help/content/topics";
import { getArticleSections } from "@/lib/help/content/article-meta";
import { getHelpArticle } from "@/lib/help/content/articles";
import { renderMarkdown } from "@/lib/help/markdown";
import { markArticleViewed, readHelpSession, startHelpSession, trackHelpEvent } from "@/lib/help/session";
import type { HelpArticle } from "@/lib/help/types";

type HelpArticlePageProps = {
  article: HelpArticle;
};

export function HelpArticlePage({ article }: HelpArticlePageProps) {
  const sections = getArticleSections(article);
  const topic = getHelpTopic(article.topic ?? "other");
  const related = (article.relatedArticleSlugs ?? [])
    .map((slug) => getHelpArticle(slug))
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
    <AccountCanonicalShell title={article.title} backHref="/help" backLabel="Help Centre">
      {topic ? (
        <CanonicalInfoBlock variant="tip">
          <Link href={`/help/category/${topic.slug}`} className="font-medium text-primary hover:opacity-80">
            Open {topic.label} guided troubleshooting
          </Link>
        </CanonicalInfoBlock>
      ) : null}

      <CanonicalInfoBlock variant="description">{sections.overview}</CanonicalInfoBlock>

      <CanonicalCard variant="medium">
        <div className="flex flex-col gap-ds-5 p-ds-4">
          <ArticleSection title="Overview">
            <div
              className="prose-help cds-menu-row__subtitle"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
            />
          </ArticleSection>
          <ArticleListSection title="Step-by-step guide" items={sections.steps} />
          <ArticleListSection title="Requirements" items={sections.requirements} />
          <ArticleSection title="Estimated processing time">
            <p className="cds-menu-row__subtitle">{sections.processingTime}</p>
          </ArticleSection>
          <ArticleListSection title="Common mistakes" items={sections.commonMistakes} />
          <ArticleListSection title="Troubleshooting" items={sections.troubleshooting} />
          <ArticleSection title="Frequently asked questions">
            <div className="mt-ds-3 space-y-ds-2">
              {sections.faqs.map((faq) => (
                <details key={faq.question} className="cds-card cds-card--sm p-ds-3">
                  <summary className="cds-menu-row__title cursor-pointer">{faq.question}</summary>
                  <p className="cds-menu-row__subtitle mt-ds-2">{faq.answer}</p>
                </details>
              ))}
            </div>
          </ArticleSection>
          <p className="cds-field__hint">Last updated {article.lastUpdated ?? "2025-06-19"}</p>
        </div>
      </CanonicalCard>

      <CanonicalSection title="Need more help?">
        <CanonicalCard variant="list">
          <CanonicalMenuRow title="Contact Support" description="Open a support request" href="/support" />
          <CanonicalMenuRow title="Help Centre" description="Browse guides and FAQs" href="/help" />
        </CanonicalCard>
      </CanonicalSection>

      {related.length ? (
        <CanonicalSection title="Related articles">
          <CanonicalCard variant="list">
            {related.map((entry) => (
              <CanonicalMenuRow key={entry.slug} title={entry.title} href={`/help/${entry.slug}`} />
            ))}
          </CanonicalCard>
        </CanonicalSection>
      ) : null}

      {article.topic ? <HelpResolutionPrompt topicSlug={article.topic} /> : null}
    </AccountCanonicalShell>
  );
}

function ArticleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="cds-section__title">{title}</h3>
      <div className="mt-ds-2">{children}</div>
    </section>
  );
}

function ArticleListSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <ArticleSection title={title}>
      <ul className="mt-ds-2 list-disc space-y-ds-1 pl-ds-5 cds-menu-row__subtitle">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </ArticleSection>
  );
}
