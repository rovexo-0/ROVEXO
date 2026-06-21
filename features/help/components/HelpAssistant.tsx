"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { answerHelpQuestion } from "@/lib/help/assistant";
import { renderMarkdown } from "@/lib/help/markdown";
import type { HelpAssistantResponse } from "@/lib/help/types";

type HelpAssistantProps = {
  compact?: boolean;
};

export function HelpAssistant({ compact = false }: HelpAssistantProps) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<HelpAssistantResponse | null>(null);

  const ask = () => {
    setResponse(answerHelpQuestion(query));
  };

  return (
    <Card padding="lg" className="shadow-ds-soft">
      <h2 className="text-lg font-semibold text-text-primary">AI Help Assistant</h2>
      {!compact ? (
        <p className="mt-ds-1 text-sm text-text-secondary">
          Answers are generated only from official ROVEXO Help Centre articles.
        </p>
      ) : null}
      <label className="sr-only" htmlFor="help-assistant-query">
        Ask the help assistant
      </label>
      <textarea
        id="help-assistant-query"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        rows={compact ? 2 : 3}
        placeholder="Ask a question about ROVEXO..."
        className="mt-ds-3 w-full rounded-ds-lg border border-border bg-surface px-ds-3 py-ds-2 text-sm"
      />
      <Button className="mt-ds-3" disabled={!query.trim()} onClick={ask}>
        Ask
      </Button>

      {response ? (
        <div className="mt-ds-4 space-y-ds-3">
          <div
            className="rounded-ds-md bg-surface-muted px-ds-3 py-ds-3 text-sm text-text-secondary"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(response.answer) }}
          />
          {response.articles.map((result) => (
            <Link
              key={result.article.slug}
              href={`/help/${result.article.slug}`}
              className="block text-sm font-medium text-primary hover:underline"
            >
              Read: {result.article.title}
            </Link>
          ))}
          {response.suggestSupport ? (
            <Link href="/support" className="block text-sm font-medium text-primary underline">
              Contact Support
            </Link>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
