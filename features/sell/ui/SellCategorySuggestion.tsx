"use client";

/**
 * Suggested Category — confirm-only UI (Category Suggestion Engine v1.0).
 * Presentation only — continuous with Category row (one Sell category flow).
 */

import { CanonicalButton } from "@/src/components/canonical";
import type { CategorySuggestion } from "@/lib/sell/category-suggestion-engine-v1";
import { suggestionConfidencePercent } from "@/lib/sell/category-suggestion-engine-v1";

type SellCategorySuggestionProps = {
  suggestion: CategorySuggestion;
  betterSuggestionAvailable: boolean;
  onApply: () => void;
};

export function SellCategorySuggestionCard({
  suggestion,
  betterSuggestionAvailable,
  onApply,
}: SellCategorySuggestionProps) {
  const percent = suggestionConfidencePercent(suggestion);
  const [root, sub, leaf] = suggestion.labels;

  return (
    <div
      className="sell-category-flow__suggestion"
      data-category-suggestion="v1.0"
      data-testid="sell-category-suggestion"
    >
      <div className="sell-category-flow__suggestion-copy">
        <p className="sell-category-flow__eyebrow">Suggested Category</p>
        {betterSuggestionAvailable ? (
          <p className="sell-category-flow__better">Better suggestion available</p>
        ) : null}
        <p className="sell-category-flow__path-root">{root}</p>
        {sub ? <p className="sell-category-flow__path-step">› {sub}</p> : null}
        {leaf ? <p className="sell-category-flow__path-step">› {leaf}</p> : null}
        <p className="sell-category-flow__confidence">Confidence {percent}%</p>
      </div>
      <CanonicalButton
        type="button"
        variant="outline"
        fullWidth
        onClick={onApply}
        aria-label="Apply Suggestion"
      >
        Apply Suggestion
      </CanonicalButton>
    </div>
  );
}
