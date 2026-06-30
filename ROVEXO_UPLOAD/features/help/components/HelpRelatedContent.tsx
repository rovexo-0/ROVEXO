"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { HelpSolution, HelpTopicSlug } from "@/lib/help/types";
import { getHelpTopic } from "@/lib/help/content/topics";

type HelpRelatedContentProps = {
  solution: HelpSolution;
  topicSlug: HelpTopicSlug;
};

export function HelpRelatedContent({ solution, topicSlug }: HelpRelatedContentProps) {
  const topic = getHelpTopic(topicSlug);

  return (
    <section className="space-y-ds-5" aria-labelledby="related-content-heading">
      <h2 id="related-content-heading" className="text-lg font-semibold text-text-primary">
        Related content
      </h2>

      {solution.relatedQuestions.length > 0 && (
        <Card padding="md" className="">
          <h3 className="text-sm font-semibold text-text-primary">Related questions</h3>
          <ul className="mt-ds-3 space-y-ds-2">
            {solution.relatedQuestions.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-primary hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card padding="md" className="">
        <h3 className="text-sm font-semibold text-text-primary">Related categories</h3>
        <div className="mt-ds-3 flex flex-wrap gap-ds-2">
          {(solution.relatedTopics.length ? solution.relatedTopics : topic?.relatedTopics ?? []).map((slug) => (
            <Link
              key={slug}
              href={`/help/category/${slug}`}
              className="rounded-full bg-surface-muted px-ds-3 py-ds-1 text-sm text-text-primary hover:bg-surface-elevated"
            >
              {slug.replace(/-/g, " ")}
            </Link>
          ))}
        </div>
      </Card>

      <Card padding="md" className="">
        <h3 className="text-sm font-semibold text-text-primary">Related platform features</h3>
        <div className="mt-ds-3 flex flex-wrap gap-ds-2">
          {solution.relatedFeatures.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full bg-primary/10 px-ds-3 py-ds-1 text-sm font-medium text-primary hover:bg-primary/15"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </Card>

      <Card padding="md" className="">
        <h3 className="text-sm font-semibold text-text-primary">Related policies</h3>
        <ul className="mt-ds-3 space-y-ds-2">
          {solution.relatedPolicies.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="text-sm text-primary hover:underline">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
