"use client";

import { useMemo, useState } from "react";
import { SellRowsCard, SellCompactRow, SellInlineError } from "@/features/sell/ui/SellPrimitives";
import { SellCategoryPicker } from "@/features/sell/ui/SellCategoryPicker";
import { useSell } from "@/features/sell/context/SellProvider";
import { getListingValidationErrors } from "@/features/sell/types";

export function SellCategoryBlock() {
  const { draft, setCategoryPath, showValidation, pendingTitleRef, pendingDescriptionRef } = useSell();
  const [open, setOpen] = useState(false);
  const [suggestionTitle, setSuggestionTitle] = useState("");
  const [suggestionDescription, setSuggestionDescription] = useState("");

  const openPicker = () => {
    setSuggestionTitle(pendingTitleRef.current || draft.title);
    setSuggestionDescription(pendingDescriptionRef.current || draft.description);
    setOpen(true);
  };

  const errors = useMemo(
    () => getListingValidationErrors(draft, { mode: "quick", showErrors: showValidation }),
    [draft, showValidation],
  );

  return (
    <div className="flex flex-col gap-ds-1">
      <SellRowsCard aria-label="Category">
        <SellCompactRow
          label="Category"
          value={draft.categoryPath?.pathLabel}
          placeholder="Select category"
          hasError={Boolean(errors.category)}
          onClick={openPicker}
          ariaLabel="Select category"
        />
      </SellRowsCard>
      <SellInlineError message={errors.category} />

      <SellCategoryPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(path) => setCategoryPath(path)}
        title={suggestionTitle}
        description={suggestionDescription}
      />
    </div>
  );
}
