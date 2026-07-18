import type { ReviewTimelineStep } from "@/lib/moderation/review-center";
import { CanonicalMenuRow } from "@/src/components/canonical";

type ReviewTimelineProps = {
  steps: ReviewTimelineStep[];
};

function formatTimelineDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ReviewTimeline({ steps }: ReviewTimelineProps) {
  return (
    <>
      {steps.map((step) => (
        <CanonicalMenuRow
          key={step.id}
          title={step.label}
          description={formatTimelineDate(step.at)}
          value={step.complete ? "Done" : undefined}
          showChevron={false}
        />
      ))}
    </>
  );
}
