"use client";

import { cn } from "@/lib/cn";
import { toPathId } from "@/lib/categories/queries";
import type { FlatCategoryPath } from "@/lib/categories/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { CategoryDetectionResult } from "@/lib/sell/category-detection-pro";
import { focusRing } from "@/components/ui/tokens";

type AiCategoryDetectionProps = {
  detection: CategoryDetectionResult;
  dismissed: boolean;
  selectedPath: FlatCategoryPath | null;
  onConfirm: () => void;
  onChange: () => void;
  onDismiss: () => void;
  onSelect: (path: FlatCategoryPath) => void;
};

export function AiCategoryDetection({
  detection,
  dismissed,
  selectedPath,
  onConfirm,
  onChange,
  onDismiss,
  onSelect,
}: AiCategoryDetectionProps) {
  if (dismissed || !detection.top) return null;

  const selectedPathId = selectedPath ? toPathId(selectedPath) : null;
  const topPathId = toPathId(detection.top.path);
  const isApplied = selectedPathId === topPathId;

  return (
    <div className="mt-ds-2 rounded-ds-md border border-primary/15 bg-primary/[0.04] px-ds-3 py-ds-2.5" aria-live="polite">
      <div className="flex flex-wrap items-center gap-x-ds-2 gap-y-ds-1">
        <Badge variant="default" className="bg-primary/10 text-primary">
          ✨ AI Category
        </Badge>
        {detection.tier === "auto" && isApplied ? (
          <span className="text-xs font-medium text-primary">AI selected category</span>
        ) : null}
        {detection.tier === "suggest" ? (
          <span className="text-xs font-medium text-text-secondary">Suggested from title</span>
        ) : null}
      </div>

      <p className="mt-ds-1.5 text-sm font-medium text-text-primary">{detection.top.path.pathLabel}</p>
      <p className="text-xs text-text-secondary">{Math.round(detection.top.confidence * 100)}% confidence</p>

      {detection.tier === "suggest" && !isApplied ? (
        <div className="mt-ds-2 flex flex-wrap gap-ds-2">
          <Button size="sm" onClick={onConfirm}>
            Confirm
          </Button>
          <Button size="sm" variant="secondary" onClick={onChange}>
            Change
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      ) : null}

      {detection.tier === "auto" && isApplied ? (
        <button
          type="button"
          onClick={onDismiss}
          className={cn("mt-ds-2 text-xs font-medium text-text-secondary hover:text-primary", focusRing)}
        >
          Clear selection
        </button>
      ) : null}
    </div>
  );
}

/** @deprecated Use AiCategoryDetection */
export { AiCategoryDetection as TitleCategorySuggestions };
