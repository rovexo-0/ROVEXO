"use client";

import { useMemo, useState } from "react";
import { SellInlineError, SellNavRow } from "@/features/sell/ui/SellPrimitives";
import { SellCategoryPicker } from "@/features/sell/ui/SellCategoryPicker";
import { useSell } from "@/features/sell/context/SellProvider";
import { getSellValidationErrorForField } from "@/lib/sell/sell-validation";
import { buildCategoryDetectionText } from "@/lib/sell/sell-progressive-flow";

type SellCategoryBlockProps = {
  onCategorySelected?: () => void;
};

export function SellCategoryBlock({ onCategorySelected }: SellCategoryBlockProps) {
  const { draft, setCategoryPath, showValidation, pendingTitleRef, pendingDescriptionRef } = useSell();
  const [open, setOpen] = useState(false);
  const [suggestionTitle, setSuggestionTitle] = useState("");
  const [suggestionDescription, setSuggestionDescription] = useState("");

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

  const openPicker = () => {
    const title = pendingTitleRef.current || draft.title;
    const description = pendingDescriptionRef.current || draft.description;
    const detectionInput = buildCategoryDetectionText(draft, title, description);
    setSuggestionTitle(detectionInput.title);
    setSuggestionDescription(detectionInput.description);
    setOpen(true);
  };

  return (
    <div className="flex flex-col gap-1">
      <SellNavRow
        label="Category"
        value={draft.categoryPath?.pathLabel}
        hasError={Boolean(categoryError)}
        onClick={openPicker}
        ariaLabel="Category"
        iconFieldId="category"
      />
      <SellInlineError message={categoryError} />

      <SellCategoryPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={commitCategory}
        title={suggestionTitle}
        description={suggestionDescription}
      />
    </div>
  );
}
