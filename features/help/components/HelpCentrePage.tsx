"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { HelpAssistant } from "@/features/help/components/HelpAssistant";
import { HELP_TOPIC_GROUPS, getHelpTopicsByGroup } from "@/lib/help/content/topics";
import { searchHelpCentre } from "@/lib/help/search";
import type { HelpSearchResult } from "@/lib/help/types";

type HelpCentrePageProps = {
  initialQuery?: string;
};

export function HelpCentrePage({ initialQuery = "" }: HelpCentrePageProps) {
  const [query, setQuery] = useState(initialQuery);
  const results = useMemo(() => searchHelpCentre(query), [query]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-ds-8 px-ds-4 py-ds-6 pb-[calc(var(--ds-space-8)+env(safe-area-inset-bottom))]">
      <section className="rounded-ds-xl bg-gradient-to-br from-primary/10 via-surface to-surface p-ds-6 shadow-ds-soft">
        <p className="text-sm font-medium text-primary">ROVEXO Help Center</p>
        <h1 className="mt-ds-2 text-3xl font-bold text-text-primary">Welcome to ROVEXO Help Center</h1>
        <p className="mt-ds-2 text-base text-text-secondary">How can we help you today?</p>
        <label className="sr-only" htmlFor="help-search">
          Search help
        </label>
        <input
          id="help-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search articles, categories, FAQs, features, policies..."
          className="mt-ds-5 w-full rounded-ds-xl border border-border bg-surface px-ds-4 py-ds-4 text-sm text-text-primary shadow-sm"
        />
      </section>

      <HelpAssistant compact />

      {!query.trim() ? (
        <section className="grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink href="/help/faq" title="FAQ" description="Common questions and answers" />
          <QuickLink href="/help/policies" title="Policies" description="Terms, privacy, and safety rules" />
          <QuickLink href="/support" title="Contact Support" description="Open a support ticket" />
          <QuickLink href="/assistant" title="AI Assistant" description="Guided help and search" />
          <QuickLink href="/resolution" title="Resolution Centre" description="Disputes and protection cases" />
          <QuickLink href="/trust" title="Trust Center" description="Score, verification, and safety" />
          <QuickLink href="/help/category/withdraw" title="Processing times" description="Withdrawals, orders, and reviews" />
          <QuickLink href="/help/category/business-accounts" title="Business help" description="B2B accounts and wholesale" />
        </section>
      ) : null}

      {query.trim() ? (
        <SearchResults results={results} query={query} />
      ) : (
        <BrowseTopics />
      )}
    </div>
  );
}

function SearchResults({ results, query }: { results: HelpSearchResult[]; query: string }) {
  return (
    <section aria-label="Search results">
      <h2 className="text-lg font-semibold text-text-primary">Search results</h2>
      <p className="mt-ds-1 text-sm text-text-secondary">
        {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
      </p>
      <div className="mt-ds-4 grid gap-ds-3">
        {results.map((result) => (
          <Link key={`${result.type}:${result.id}`} href={result.href}>
            <Card padding="md" interactive className="shadow-ds-soft">
              <div className="flex items-center justify-between gap-ds-3">
                <p className="font-semibold text-text-primary">{result.title}</p>
                <span className="rounded-full bg-surface-muted px-ds-2 py-ds-0.5 text-xs capitalize text-text-muted">
                  {result.type}
                </span>
              </div>
              <p className="mt-ds-1 text-sm text-text-secondary">{result.excerpt}</p>
            </Card>
          </Link>
        ))}
        {!results.length ? (
          <Card padding="md" className="shadow-ds-soft">
            <p className="text-sm text-text-secondary">
              No matches found. Browse help topics below or try “withdraw”, “refund”, or “order tracking”.
            </p>
          </Card>
        ) : null}
      </div>
    </section>
  );
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href}>
      <Card padding="md" interactive className="h-full shadow-ds-soft">
        <p className="font-semibold text-text-primary">{title}</p>
        <p className="mt-ds-1 text-sm text-text-secondary">{description}</p>
      </Card>
    </Link>
  );
}

function BrowseTopics() {
  return (
    <section aria-labelledby="browse-topics-heading">
      <h2 id="browse-topics-heading" className="text-lg font-semibold text-text-primary">
        Browse Help Topics
      </h2>
      <div className="mt-ds-5 space-y-ds-8">
        {HELP_TOPIC_GROUPS.map((group) => {
          const topics = getHelpTopicsByGroup(group);
          if (!topics.length) return null;
          return (
            <div key={group}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{group}</h3>
              <div className="mt-ds-3 grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">
                {topics.map((topic) => (
                  <Link key={topic.slug} href={`/help/category/${topic.slug}`}>
                    <Card padding="md" interactive className="h-full shadow-ds-soft">
                      <p className="text-lg">{topic.icon}</p>
                      <p className="mt-ds-2 font-semibold text-text-primary">{topic.label}</p>
                      <p className="mt-ds-1 text-sm text-text-secondary">{topic.description}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
