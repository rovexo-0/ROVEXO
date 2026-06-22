"use client";

import { cn } from "@/lib/cn";
import { toPathId } from "@/lib/categories/queries";
import type { CategoryMatchResult } from "@/lib/ai-camera/types";
import { AI_CAMERA_CONFIDENCE_THRESHOLD } from "@/lib/ai-camera/types";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type CategoryMatchPickerProps = {
  matches: CategoryMatchResult[];
  value: string | null;
  onChange: (match: CategoryMatchResult) => void;
};

export function CategoryMatchPicker({ matches, value, onChange }: CategoryMatchPickerProps) {
  if (matches.length === 0) return null;

  const thresholdPercent = Math.round(AI_CAMERA_CONFIDENCE_THRESHOLD * 100);

  return (
    <div className="flex flex-col gap-ds-2">
      <p className="text-sm font-medium text-text-primary">Choose the best matching category</p>
      <p className="text-xs text-text-secondary">
        Confidence was below {thresholdPercent}%. Select one of the top matches below.
      </p>

      <ul className="flex flex-col gap-ds-2" role="listbox" aria-label="Suggested categories">
        {matches.map((match) => {
          const pathId = toPathId(match.path);
          const isSelected = value === pathId;

          return (
            <li key={pathId}>
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onChange(match)}
                className={cn(
                  "flex min-h-ds-7 w-full items-center justify-between rounded-ds-lg border px-ds-4 py-ds-3 text-left",
                  transitionFast,
                  focusRing,
                  isSelected
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-surface hover:bg-surface-muted",
                )}
              >
                <span className="text-sm font-medium text-text-primary">{match.path.pathLabel}</span>
                <span className="text-xs font-semibold text-text-secondary">
                  {Math.round(match.confidence * 100)}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
