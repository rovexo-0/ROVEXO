"use client";

import { cn } from "@/lib/cn";
import { toPathId } from "@/lib/categories/queries";
import type { FlatCategoryPath } from "@/lib/categories/types";
import type { TitleCategorySuggestion } from "@/lib/sell/suggest-category-from-title";
import { focusRing } from "@/components/ui/tokens";

type TitleCategorySuggestionsProps = {
  suggestions: TitleCategorySuggestion[];
  selectedPath: FlatCategoryPath | null;
  onSelect: (path: FlatCategoryPath) => void;
};

export function TitleCategorySuggestions({
  suggestions,
  selectedPath,
  onSelect,
}: TitleCategorySuggestionsProps) {
  if (suggestions.length === 0) return null;

  const selectedPathId = selectedPath ? toPathId(selectedPath) : null;

  return (
    <div className="mt-ds-2 flex flex-col gap-ds-2" aria-live="polite">
      <p className="text-xs font-medium text-text-secondary">Suggested from title</p>
      <ul className="flex flex-wrap gap-ds-2">
        {suggestions.map(({ path }) => {
          const pathId = toPathId(path);
          const active = selectedPathId === pathId;

          return (
            <li key={pathId}>
              <button
                type="button"
                onClick={() => onSelect(path)}
                className={cn(
                  "rounded-full border px-ds-3 py-ds-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface text-text-secondary hover:border-primary/40",
                  focusRing,
                )}
              >
                {path.pathLabel}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
