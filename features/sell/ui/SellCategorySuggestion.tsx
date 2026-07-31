"use client";

/**
 * Suggested Category — confirm-only UI (Category Suggestion Engine v1.0).
 * Never auto-selects. Apply populates Category → Subcategory → Product Type only.
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
      className="flex w-full flex-col gap-3 rounded-[16px] border border-[color:var(--cds-border,#ececec)] bg-white px-4 py-4"
      data-category-suggestion="v1.0"
      data-testid="sell-category-suggestion"
    >
      <div className="flex flex-col gap-1">
        <p className="text-[13px] font-semibold tracking-[0.02em] text-[color:var(--cds-text-secondary,#6b7280)]">
          Suggested Category
        </p>
        {betterSuggestionAvailable ? (
          <p className="text-[13px] font-medium text-[color:var(--rx-purple,#9333ea)]">
            Better suggestion available
          </p>
        ) : null}
        <p className="text-[16px] font-semibold leading-snug text-[color:var(--cds-text,#111)]">
          {root}
        </p>
        {sub ? (
          <p className="text-[15px] leading-snug text-[color:var(--cds-text,#111)]">
            › {sub}
          </p>
        ) : null}
        {leaf ? (
          <p className="text-[15px] leading-snug text-[color:var(--cds-text,#111)]">
            › {leaf}
          </p>
        ) : null}
        <p className="pt-1 text-[13px] text-[color:var(--cds-text-secondary,#6b7280)]">
          Confidence {percent}%
        </p>
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
