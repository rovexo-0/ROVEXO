"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { answerHelpQuestion } from "@/lib/help/assistant";
import { renderMarkdown } from "@/lib/help/markdown";
import { trackHelpEvent } from "@/lib/help/session";
import type { HelpAssistantResponse } from "@/lib/help/types";

type HelpAssistantProps = {
  compact?: boolean;
};

export function HelpAssistant({ compact = false }: HelpAssistantProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<HelpAssistantResponse | null>(null);

  const ask = () => {
    const result = answerHelpQuestion(query);
    setResponse(result);
    void trackHelpEvent({
      type: result.matched ? "search" : "search_no_results",
      query,
      topicSlug: result.intent?.topicSlug,
    });
  };

  const launchGuide = () => {
    if (!response?.guideHref) return;
    router.push(response.guideHref);
  };

  return (
    <Card padding="lg" className="shadow-ds-soft">
      <h2 className="text-lg font-semibold text-text-primary">AI Help Assistant</h2>
      {!compact ? (
        <p className="mt-ds-1 text-sm text-text-secondary">
          Ask a question and the assistant will route you to the right guided troubleshooting flow or official article.
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
        placeholder={'Try "I can\'t withdraw my money" or "Where is my order?"'}
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
          {response.suggestTree && response.guideHref ? (
            <Button onClick={launchGuide}>Start guided troubleshooting</Button>
          ) : null}
          {response.articles.slice(0, 4).map((result) => (
            <Link
              key={`${result.type}:${result.id}`}
              href={result.href}
              className="block text-sm font-medium text-primary hover:underline"
            >
              {result.type === "topic" ? "Open guide" : "Read"}: {result.title}
            </Link>
          ))}
          {response.suggestSupport ? (
            <Link href="/help" className="block text-sm font-medium text-primary underline">
              Browse help topics
            </Link>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
