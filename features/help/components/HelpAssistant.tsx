"use client";

import { CanonicalButton, CanonicalCard, CanonicalInfoBlock, CanonicalSection, CanonicalTextarea } from "@/src/components/canonical";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <CanonicalSection title="Help Search">
      <CanonicalCard variant="medium">
        {!compact ? (
          <CanonicalInfoBlock variant="description">
            Ask a question and the assistant will route you to the right guided troubleshooting flow or
            official article.
          </CanonicalInfoBlock>
        ) : null}
        <CanonicalTextarea
          id="help-assistant-query"
          label="Ask the help assistant"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          rows={compact ? 2 : 3}
          placeholder={'Try "I can\'t withdraw my money" or "Where is my order?"'}
        />
        <CanonicalButton className="mt-ds-3" disabled={!query.trim()} onClick={ask}>
          Ask
        </CanonicalButton>

        {response ? (
          <div className="mt-ds-4 space-y-ds-3">
            <CanonicalInfoBlock variant="description">
              <span dangerouslySetInnerHTML={{ __html: renderMarkdown(response.answer) }} />
            </CanonicalInfoBlock>
            {response.suggestTree && response.guideHref ? (
              <CanonicalButton onClick={launchGuide}>Start guided troubleshooting</CanonicalButton>
            ) : null}
            {response.articles.slice(0, 4).map((result) => (
              <Link
                key={`${result.type}:${result.id}`}
                href={result.href}
                className="cds-menu-row__title block text-primary hover:opacity-80"
              >
                {result.type === "topic" ? "Open guide" : "Read"}: {result.title}
              </Link>
            ))}
            {response.suggestSupport ? (
              <Link href="/help" className="cds-menu-row__title block text-primary underline">
                Browse help topics
              </Link>
            ) : null}
          </div>
        ) : null}
      </CanonicalCard>
    </CanonicalSection>
  );
}
