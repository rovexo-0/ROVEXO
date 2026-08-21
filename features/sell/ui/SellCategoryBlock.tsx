"use client";

import { useDeferredValue, useLayoutEffect, useMemo, useState } from "react";
import { SellInlineError, SellNavRow } from "@/features/sell/ui/SellPrimitives";
import { SellCategoryPicker } from "@/features/sell/ui/SellCategoryPicker";
import { SellCategorySuggestionCard } from "@/features/sell/ui/SellCategorySuggestion";
import { useSellActions, useSellDraft } from "@/features/sell/context/SellProvider";
import { toPathId } from "@/lib/categories/queries";
import { getSellValidationErrorForField } from "@/lib/sell/sell-validation";
import {
  resolveTitleOnlyCategoryDecision,
  shouldAutoApplyCategorySuggestion,
} from "@/lib/sell/category-suggestion-engine-v1";

type SellCategoryBlockProps = {
  onCategorySelected?: () => void;
};

/**
 * Category picker + title-only Native category contract.
 * Description never participates. Leaf title matches auto-apply.
 * Manual browse/search selection is canonical.
 */
export function SellCategoryBlock({ onCategorySelected }: SellCategoryBlockProps) {
  const { draft, showValidation } = useSellDraft();
  const { setCategoryPath } = useSellActions();
  const [open, setOpen] = useState(false);

  const deferredTitle = useDeferredValue(draft.title);

  const decision = useMemo(
    () =>
      resolveTitleOnlyCategoryDecision({
        title: deferredTitle,
        currentPath: draft.categoryPath,
        categoryManual: draft.categoryManual,
      }),
    [deferredTitle, draft.categoryPath, draft.categoryManual],
  );

  // Non-leaf never auto-applies (Native shouldAutoApply = false).
  void shouldAutoApplyCategorySuggestion();

  useLayoutEffect(() => {
    if (decision.action === "keep") return;

    if (decision.action === "apply-leaf") {
      if (
        draft.categoryPath &&
        toPathId(draft.categoryPath) === toPathId(decision.path)
      ) {
        return;
      }
      setCategoryPath(decision.path, { manual: false });
      return;
    }

    if (decision.action === "clear" || decision.action === "browse-non-leaf") {
      if (draft.categoryPath) {
        setCategoryPath(null, { manual: false });
      }
    }
  }, [decision, draft.categoryPath, setCategoryPath]);

  const categoryError = useMemo(() => {
    if (!showValidation) return undefined;
    return getSellValidationErrorForField(
      draft,
      { title: draft.title, description: draft.description },
      "category",
    );
  }, [draft, showValidation]);

  const commitManualCategory = (path: Parameters<typeof setCategoryPath>[0]) => {
    if (!path) return;
    setCategoryPath(path, { manual: true });
    onCategorySelected?.();
  };

  const showSuggestion = decision.action === "browse-non-leaf";

  return (
    <section className="sell-category-flow" data-sell-category-block="v1.0">
      {showSuggestion && decision.suggestion ? (
        <SellCategorySuggestionCard
          suggestion={decision.suggestion}
          onBrowseManually={() => setOpen(true)}
        />
      ) : null}

      <div className="sell-category-flow__row">
        <SellNavRow
          label="Category"
          description={draft.categoryPath?.pathLabel}
          hasError={Boolean(categoryError)}
          onClick={() => setOpen(true)}
          ariaLabel={draft.categoryPath ? "Change category" : undefined}
          iconFieldId="category"
        />
        {draft.categoryPath ? (
          <p className="sell-category-flow__change-hint">Change</p>
        ) : null}
        <SellInlineError message={categoryError} />

        <SellCategoryPicker
          open={open}
          onClose={() => setOpen(false)}
          onSelect={commitManualCategory}
        />
      </div>
    </section>
  );
}
