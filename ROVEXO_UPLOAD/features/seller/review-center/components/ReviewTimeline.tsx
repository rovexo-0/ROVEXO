import type { ReviewTimelineStep } from "@/lib/moderation/review-center";
import { cn } from "@/lib/cn";

type ReviewTimelineProps = {
  steps: ReviewTimelineStep[];
};

export function ReviewTimeline({ steps }: ReviewTimelineProps) {
  return (
    <ol className="flex flex-col gap-ds-3">
      {steps.map((step, index) => (
        <li key={step.id} className="relative flex gap-ds-3 pl-ds-1">
          {index < steps.length - 1 ? (
            <span
              aria-hidden
              className={cn(
                "absolute left-[11px] top-6 h-[calc(100%+4px)] w-px",
                step.complete ? "bg-success/40" : "bg-border",
              )}
            />
          ) : null}
          <span
            aria-hidden
            className={cn(
              "relative z-[1] mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold",
              step.complete
                ? "border-success bg-success/15 text-success"
                : "border-border bg-surface-muted text-text-muted",
            )}
          >
            {step.complete ? "✓" : index + 1}
          </span>
          <div className="rx-glass rx-depth-1 min-w-0 flex-1 rounded-ds-lg px-ds-4 py-ds-3">
            <p className="text-sm font-semibold text-text-primary">{step.label}</p>
            <p className="mt-ds-1 text-xs text-text-secondary">
              {new Date(step.at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
