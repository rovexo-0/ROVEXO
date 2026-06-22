"use client";

import { Card } from "@/components/ui/Card";
import { HelpRelatedContent } from "@/features/help/components/HelpRelatedContent";
import { renderMarkdown } from "@/lib/help/markdown";
import type { HelpSolution, HelpTopicSlug } from "@/lib/help/types";

type HelpSolutionViewProps = {
  solution: HelpSolution;
  topicSlug: HelpTopicSlug;
};

function SectionList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <ul className="mt-ds-2 list-disc space-y-ds-1 pl-ds-5 text-sm text-text-secondary">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function HelpSolutionView({ solution, topicSlug }: HelpSolutionViewProps) {
  return (
    <div className="space-y-ds-6">
      <Card padding="lg" className="shadow-ds-soft">
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Solution</p>
        <h2 className="mt-ds-1 text-2xl font-bold text-text-primary">{solution.title}</h2>
        <div
          className="mt-ds-4 text-sm text-text-secondary"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(solution.overview) }}
        />

        {(solution.currentStatus || solution.estimatedReviewTime || solution.estimatedTransferTime) && (
          <div className="mt-ds-5 grid gap-ds-3 rounded-ds-lg bg-surface-muted p-ds-4 sm:grid-cols-2">
            {solution.currentStatus && (
              <div>
                <p className="text-xs text-text-muted">Current status</p>
                <p className="text-sm font-medium text-text-primary">{solution.currentStatus}</p>
              </div>
            )}
            {solution.estimatedReviewTime && (
              <div>
                <p className="text-xs text-text-muted">Estimated review time</p>
                <p className="text-sm font-medium text-text-primary">{solution.estimatedReviewTime}</p>
              </div>
            )}
            {solution.estimatedTransferTime && (
              <div>
                <p className="text-xs text-text-muted">Estimated bank transfer</p>
                <p className="text-sm font-medium text-text-primary">{solution.estimatedTransferTime}</p>
              </div>
            )}
          </div>
        )}

        {solution.possibleDelays?.length ? (
          <div className="mt-ds-4">
            <p className="text-sm font-semibold text-text-primary">Possible delays</p>
            <ul className="mt-ds-2 list-disc space-y-ds-1 pl-ds-5 text-sm text-text-secondary">
              {solution.possibleDelays.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-ds-6 space-y-ds-5">
          <SectionList title="Step-by-step guide" items={solution.steps} />
          <SectionList title="Requirements" items={solution.requirements} />
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Estimated processing time</h3>
            <p className="mt-ds-1 text-sm text-text-secondary">{solution.processingTime}</p>
          </div>
          <SectionList title="Common mistakes" items={solution.commonMistakes} />
          <SectionList title="Troubleshooting" items={solution.troubleshooting} />
        </div>

        {solution.faqs.length > 0 && (
          <div className="mt-ds-6 space-y-ds-3">
            <h3 className="text-sm font-semibold text-text-primary">Frequently asked questions</h3>
            {solution.faqs.map((faq) => (
              <details key={faq.question} className="rounded-ds-lg border border-border bg-surface px-ds-4 py-ds-3">
                <summary className="cursor-pointer text-sm font-medium text-text-primary">{faq.question}</summary>
                <p className="mt-ds-2 text-sm text-text-secondary">{faq.answer}</p>
              </details>
            ))}
          </div>
        )}

        <p className="mt-ds-6 text-xs text-text-muted">Last updated {solution.lastUpdated}</p>
      </Card>

      <HelpRelatedContent solution={solution} topicSlug={topicSlug} />
    </div>
  );
}
