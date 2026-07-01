"use client";

import Link from "next/link";
import { PageBack } from "@/components/navigation/PageBack";
import { useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { HelpAssistant } from "@/features/help/components/HelpAssistant";
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-ds-6 px-ds-4 py-ds-6">
      <div>
        <PageBack variant="text" backHref="/help" backLabel="Help Centre" className="mb-ds-2" />
        {topic ? (
          <Link
            href={`/help/category/${topic.slug}`}
            className="mt-ds-2 block text-sm text-text-muted hover:text-primary"
          >
            Open {topic.label} guided troubleshooting
          </Link>
        ) : null}
        <h1 className="mt-ds-3 text-2xl font-bold text-text-primary">{article.title}</h1>
        <p className="mt-ds-2 text-sm text-text-secondary">{sections.overview}</p>
      </div>

      <Card padding="lg" className="">
        <div className="space-y-ds-5">
          <section>
            <h2 className="text-sm font-semibold text-text-primary">Overview</h2>
            <div
              className="prose-help mt-ds-2 text-sm text-text-secondary"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
            />
          </section>
          <SectionBlock title="Step-by-step guide" items={sections.steps} />
          <SectionBlock title="Requirements" items={sections.requirements} />
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Estimated processing time</h2>
            <p className="mt-ds-1 text-sm text-text-secondary">{sections.processingTime}</p>
          </div>
          <SectionBlock title="Common mistakes" items={sections.commonMistakes} />
          <SectionBlock title="Troubleshooting" items={sections.troubleshooting} />
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Frequently asked questions</h2>
            <div className="mt-ds-3 space-y-ds-2">
              {sections.faqs.map((faq) => (
                <details key={faq.question} className="rounded-ds-lg border border-border px-ds-4 py-ds-3">
                  <summary className="cursor-pointer text-sm font-medium text-text-primary">{faq.question}</summary>
                  <p className="mt-ds-2 text-sm text-text-secondary">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
          <p className="text-xs text-text-muted">Last updated {article.lastUpdated ?? "2025-06-19"}</p>
        </div>
      </Card>

      <HelpAssistant compact />

      {related.length ? (
        <section>
          <h2 className="text-lg font-semibold">Related articles</h2>
          <ul className="mt-ds-3 space-y-ds-2">
            {related.map((entry) => (
              <li key={entry.slug}>
                <Link href={`/help/${entry.slug}`} className="text-sm text-primary hover:underline">
                  {entry.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {article.topic ? <HelpResolutionPrompt topicSlug={article.topic} /> : null}
    </div>
  );
}

function SectionBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      <ul className="mt-ds-2 list-disc space-y-ds-1 pl-ds-5 text-sm text-text-secondary">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
