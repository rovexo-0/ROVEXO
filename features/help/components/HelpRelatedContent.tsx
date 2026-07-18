"use client";

import { CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";
import type { HelpSolution, HelpTopicSlug } from "@/lib/help/types";
import { getHelpTopic } from "@/lib/help/content/topics";

type HelpRelatedContentProps = {
  solution: HelpSolution;
  topicSlug: HelpTopicSlug;
};

export function HelpRelatedContent({ solution, topicSlug }: HelpRelatedContentProps) {
  const topic = getHelpTopic(topicSlug);
  const relatedTopics = solution.relatedTopics.length
    ? solution.relatedTopics
    : (topic?.relatedTopics ?? []);

  return (
    <div className="flex flex-col gap-[var(--cds-space-section-gap,24px)]">
      {solution.relatedQuestions.length > 0 ? (
        <CanonicalSection title="Related questions">
          <CanonicalCard variant="list">
            {solution.relatedQuestions.map((item) => (
              <CanonicalMenuRow key={item.href} href={item.href} title={item.label} />
            ))}
          </CanonicalCard>
        </CanonicalSection>
      ) : null}

      {relatedTopics.length > 0 ? (
        <CanonicalSection title="Related categories">
          <CanonicalCard variant="list">
            {relatedTopics.map((slug) => (
              <CanonicalMenuRow
                key={slug}
                href={`/help/category/${slug}`}
                title={getHelpTopic(slug)?.label ?? slug.replace(/-/g, " ")}
              />
            ))}
          </CanonicalCard>
        </CanonicalSection>
      ) : null}

      {solution.relatedFeatures.length > 0 ? (
        <CanonicalSection title="Related features">
          <CanonicalCard variant="list">
            {solution.relatedFeatures.map((item) => (
              <CanonicalMenuRow key={item.href} href={item.href} title={item.label} />
            ))}
          </CanonicalCard>
        </CanonicalSection>
      ) : null}

      {solution.relatedPolicies.length > 0 ? (
        <CanonicalSection title="Related policies">
          <CanonicalCard variant="list">
            {solution.relatedPolicies.map((item) => (
              <CanonicalMenuRow key={item.href} href={item.href} title={item.label} />
            ))}
          </CanonicalCard>
        </CanonicalSection>
      ) : null}
    </div>
  );
}
