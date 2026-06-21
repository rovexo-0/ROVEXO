import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { HelpAssistant } from "@/features/help/components/HelpAssistant";
import { renderMarkdown } from "@/lib/help/markdown";
import { getHelpArticlesByCategory } from "@/lib/help/content/articles";
import type { HelpArticle } from "@/lib/help/types";

type HelpArticlePageProps = {
  article: HelpArticle;
};

export function HelpArticlePage({ article }: HelpArticlePageProps) {
  const related = getHelpArticlesByCategory(article.category)
    .filter((entry) => entry.slug !== article.slug)
    .slice(0, 4);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-ds-6 px-ds-4 py-ds-6">
      <div>
        <Link href="/help" className="text-sm font-medium text-primary hover:underline">
          ← Help Centre
        </Link>
        <h1 className="mt-ds-3 text-2xl font-bold text-text-primary">{article.title}</h1>
        <p className="mt-ds-2 text-sm text-text-secondary">{article.summary}</p>
      </div>

      <Card padding="lg" className="shadow-ds-soft">
        <div
          className="prose-help"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
        />
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

      <Card padding="md" className="shadow-ds-soft">
        <p className="text-sm text-text-secondary">
          Still need help?{" "}
          <Link href="/support" className="font-medium text-primary underline">
            Contact Support
          </Link>
        </p>
      </Card>
    </div>
  );
}
