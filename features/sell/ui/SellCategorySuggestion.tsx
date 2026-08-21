"use client";

/**
 * Non-leaf title match only — Native SellSuggestedCategoryCard parity.
 * Path labels + Browse manually. No confirm overlay. No ranking percent.
 */

import type { CategorySuggestion } from "@/lib/sell/category-suggestion-engine-v1";

type SellCategorySuggestionProps = {
  suggestion: CategorySuggestion;
  onBrowseManually: () => void;
};

export function SellCategorySuggestionCard({
  suggestion,
  onBrowseManually,
}: SellCategorySuggestionProps) {
  const [root, sub, leaf] = suggestion.labels;

  return (
    <div
      className="sell-category-flow__suggestion"
      data-category-suggestion="v1.0"
      data-testid="sell-category-suggestion"
    >
      <div className="sell-category-flow__suggestion-copy">
        <p className="sell-category-flow__eyebrow">Suggested Category</p>
        <p className="sell-category-flow__path-root">{root}</p>
        {sub ? <p className="sell-category-flow__path-step">› {sub}</p> : null}
        {leaf ? <p className="sell-category-flow__path-step">› {leaf}</p> : null}
        <button
          type="button"
          className="sell-category-flow__browse-manually"
          onClick={onBrowseManually}
          aria-label="Browse manually"
        >
          Browse manually
        </button>
      </div>
    </div>
  );
}
