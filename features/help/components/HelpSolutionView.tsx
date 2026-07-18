"use client";

import { CanonicalCard, CanonicalSection } from "@/src/components/canonical";
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
    <CanonicalSection title={title}>
      <ul className="list-disc space-y-ds-1 pl-ds-5 cds-menu-row__subtitle">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </CanonicalSection>
  );
}

export function HelpSolutionView({ solution, topicSlug }: HelpSolutionViewProps) {
  return (
    <div className="flex flex-col gap-[var(--cds-space-section-gap,24px)]">
      <CanonicalCard variant="medium">
        <div className="flex flex-col gap-ds-4 p-ds-4">
          <div>
            <p className="cds-field__hint">Solution</p>
            <h2 className="cds-menu-row__title mt-ds-1">{solution.title}</h2>
            <div
              className="cds-menu-row__subtitle mt-ds-2"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(solution.overview) }}
            />
          </div>

          {(solution.currentStatus || solution.estimatedReviewTime || solution.estimatedTransferTime) && (
            <CanonicalCard variant="list">
              {solution.currentStatus ? (
                <div className="px-[var(--cds-row-padding-x,16px)] py-ds-3">
                  <p className="cds-field__hint">Current status</p>
                  <p className="cds-menu-row__title">{solution.currentStatus}</p>
                </div>
              ) : null}
              {solution.estimatedReviewTime ? (
                <div className="px-[var(--cds-row-padding-x,16px)] py-ds-3">
                  <p className="cds-field__hint">Review time</p>
                  <p className="cds-menu-row__title">{solution.estimatedReviewTime}</p>
                </div>
              ) : null}
              {solution.estimatedTransferTime ? (
                <div className="px-[var(--cds-row-padding-x,16px)] py-ds-3">
                  <p className="cds-field__hint">Bank transfer</p>
                  <p className="cds-menu-row__title">{solution.estimatedTransferTime}</p>
                </div>
              ) : null}
            </CanonicalCard>
          )}

          {solution.possibleDelays?.length ? (
            <SectionList title="Possible delays" items={solution.possibleDelays} />
          ) : null}

          <SectionList title="Step-by-step guide" items={solution.steps} />
          <SectionList title="Requirements" items={solution.requirements} />

          <CanonicalSection title="Processing time">
            <p className="cds-menu-row__subtitle">{solution.processingTime}</p>
          </CanonicalSection>

          <SectionList title="Common mistakes" items={solution.commonMistakes} />
          <SectionList title="Troubleshooting" items={solution.troubleshooting} />

          {solution.faqs.length > 0 ? (
            <CanonicalSection title="FAQs">
              <CanonicalCard variant="list">
                {solution.faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="border-b border-[var(--cds-color-divider,#efefef)] px-[var(--cds-row-padding-x,16px)] py-ds-3 last:border-b-0"
                  >
                    <summary className="cds-menu-row__title cursor-pointer">{faq.question}</summary>
                    <p className="cds-menu-row__subtitle mt-ds-2">{faq.answer}</p>
                  </details>
                ))}
              </CanonicalCard>
            </CanonicalSection>
          ) : null}

          <p className="cds-field__hint">Updated {solution.lastUpdated}</p>
        </div>
      </CanonicalCard>

      <HelpRelatedContent solution={solution} topicSlug={topicSlug} />
    </div>
  );
}
