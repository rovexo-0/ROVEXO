"use client";

import { useMemo, useState } from "react";
import { SellRowsCard, SellCompactRow, SellInlineError } from "@/features/sell/ui/SellPrimitives";
import { SellCategoryPicker } from "@/features/sell/ui/SellCategoryPicker";
import { useSell } from "@/features/sell/context/SellProvider";
import { getListingValidationErrors } from "@/features/sell/types";

export function SellCategoryBlock() {
  const { draft, setCategoryPath, showValidation } = useSell();
  const [open, setOpen] = useState(false);

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
          onClick={() => setOpen(true)}
          ariaLabel="Select category"
        />
      </SellRowsCard>
      <SellInlineError message={errors.category} />

      <SellCategoryPicker open={open} onClose={() => setOpen(false)} onSelect={(path) => setCategoryPath(path)} />
    </div>
  );
}
