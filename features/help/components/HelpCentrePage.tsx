"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { HelpAssistant } from "@/features/help/components/HelpAssistant";
import { HELP_CATEGORIES } from "@/lib/help/content/articles";
import type { HelpArticle, HelpCategory } from "@/lib/help/types";
import { searchHelpArticles } from "@/lib/help/search";

type HelpCentrePageProps = {
  articles: HelpArticle[];
  initialQuery?: string;
};

export function HelpCentrePage({ articles, initialQuery = "" }: HelpCentrePageProps) {
  const [query, setQuery] = useState(initialQuery);

  const results = useMemo(() => searchHelpArticles(query), [query]);
  const grouped = useMemo(() => {
    const map = new Map<HelpCategory, HelpArticle[]>();
    for (const category of HELP_CATEGORIES) {
      map.set(
        category.id,
        articles.filter((article) => article.category === category.id),
      );
    }
    return map;
  }, [articles]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-ds-6 px-ds-4 py-ds-6">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-text-primary">Help Centre</h1>
        <p className="mt-ds-2 text-sm text-text-secondary">
          Search official ROVEXO guidance for buying, selling, payments, safety, and more.
        </p>
        <label className="sr-only" htmlFor="help-search">
          Search help articles
        </label>
        <input
          id="help-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search help articles..."
          className="mt-ds-4 w-full rounded-ds-lg border border-border bg-surface px-ds-4 py-ds-3 text-sm text-text-primary"
        />
      </div>

      <HelpAssistant compact />

      {query.trim() ? (
        <section aria-label="Search results">
          <h2 className="text-lg font-semibold">Search results</h2>
          <div className="mt-ds-4 grid gap-ds-3">
            {results.map((result) => (
              <Link key={result.article.slug} href={`/help/${result.article.slug}`}>
                <Card padding="md" interactive className="shadow-ds-soft">
                  <p className="font-semibold text-text-primary">{result.article.title}</p>
                  <p className="mt-ds-1 text-sm text-text-secondary">{result.excerpt}</p>
                </Card>
              </Link>
            ))}
            {!results.length ? (
              <Card padding="md" className="shadow-ds-soft">
                <p className="text-sm text-text-secondary">
                  No articles matched your search. Try different keywords or{" "}
                  <Link href="/support" className="text-primary underline">
                    contact Support
                  </Link>
                  .
                </p>
              </Card>
            ) : null}
          </div>
        </section>
      ) : (
        <div className="grid gap-ds-6 lg:grid-cols-[1fr_1fr]">
          {HELP_CATEGORIES.map((category) => {
            const items = grouped.get(category.id) ?? [];
            if (!items.length) return null;
            return (
              <section key={category.id}>
                <h2 className="text-lg font-semibold text-text-primary">{category.label}</h2>
                <p className="mt-ds-1 text-sm text-text-secondary">{category.description}</p>
                <ul className="mt-ds-3 space-y-ds-2">
                  {items.map((article) => (
                    <li key={article.slug}>
                      <Link
                        href={`/help/${article.slug}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
