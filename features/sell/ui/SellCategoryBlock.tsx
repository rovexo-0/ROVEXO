"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { SellInlineError, SellNavRow } from "@/features/sell/ui/SellPrimitives";
import { SellCategoryPicker } from "@/features/sell/ui/SellCategoryPicker";
import { SellCategorySuggestionCard } from "@/features/sell/ui/SellCategorySuggestion";
import { useSell } from "@/features/sell/context/SellProvider";
import { getSellValidationErrorForField } from "@/lib/sell/sell-validation";
import {
  applyCategorySuggestion,
  resolveLiveCategorySuggestion,
  shouldAutoApplyCategorySuggestion,
} from "@/lib/sell/category-suggestion-engine-v1";

type SellCategoryBlockProps = {
  onCategorySelected?: () => void;
};

/**
 * Category picker + live Suggested Category (confirm-only).
 * Presentation: one continuous Description → Suggest → Apply → Category flow.
 * Category Suggestion Engine v1.0 — never auto-selects / overwrites.
 */
export function SellCategoryBlock({ onCategorySelected }: SellCategoryBlockProps) {
  const { draft, setCategoryPath, showValidation } = useSell();
  const [open, setOpen] = useState(false);

  const deferredTitle = useDeferredValue(draft.title);
  const deferredDescription = useDeferredValue(draft.description);

  const live = useMemo(
    () =>
      resolveLiveCategorySuggestion({
        title: deferredTitle,
        description: deferredDescription,
        manualPath: draft.categoryPath,
      }),
    [deferredTitle, deferredDescription, draft.categoryPath],
  );

  // Hard lock: engine must never auto-apply.
  void shouldAutoApplyCategorySuggestion();

  const categoryError = useMemo(() => {
    if (!showValidation) return undefined;
    return getSellValidationErrorForField(
      draft,
      { title: draft.title, description: draft.description },
      "category",
    );
  }, [draft, showValidation]);

  const commitCategory = (path: Parameters<typeof setCategoryPath>[0]) => {
    setCategoryPath(path);
    onCategorySelected?.();
  };

  const applySuggestion = () => {
    if (!live.suggestion) return;
    commitCategory(applyCategorySuggestion(live.suggestion));
  };

  const showSuggestion =
    live.suggestion !== null &&
    (!draft.categoryPath || live.betterSuggestionAvailable);

  return (
    <section className="sell-category-flow" data-sell-category-block="v1.0" aria-label="Category">
      {showSuggestion && live.suggestion ? (
        <SellCategorySuggestionCard
          suggestion={live.suggestion}
          betterSuggestionAvailable={live.betterSuggestionAvailable}
          onApply={applySuggestion}
        />
      ) : null}

      <div className="sell-category-flow__row">
        <SellNavRow
          label="Category"
          value={draft.categoryPath?.pathLabel}
          hasError={Boolean(categoryError)}
          onClick={() => setOpen(true)}
          ariaLabel={draft.categoryPath ? "Change category" : "Category"}
          iconFieldId="category"
        />
        {draft.categoryPath ? (
          <p className="sell-category-flow__change-hint">Tap to change</p>
        ) : null}
        <SellInlineError message={categoryError} />

        <SellCategoryPicker
          open={open}
          onClose={() => setOpen(false)}
          onSelect={commitCategory}
        />
      </div>
    </section>
  );
}
