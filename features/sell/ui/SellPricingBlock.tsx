"use client";

import { useId, useMemo } from "react";
import { CanonicalCard, CanonicalInput } from "@/src/components/canonical";
import { useSell } from "@/features/sell/context/SellProvider";
import { getListingValidationErrors } from "@/features/sell/types";

export function SellPricingBlock({ bare = false }: { bare?: boolean }) {
  const { draft, updateDraft, showValidation } = useSell();
  const priceId = useId();

  const errors = useMemo(
    () => getListingValidationErrors(draft, { mode: "quick", showErrors: showValidation }),
    [draft, showValidation],
  );

  const content = (
    <CanonicalInput
      id={priceId}
      label="Price"
      inputType="price"
      enterKeyHint="done"
      autoComplete="off"
      aria-label="Price"
      placeholder="0.00"
      value={draft.price}
      error={errors.price}
      onChange={(event) => updateDraft({ price: event.target.value.replace(/[^\d.]/g, "") })}
    />
  );

  if (bare) {
    return <CanonicalCard variant="medium" className="flex flex-col gap-ds-4 p-ds-4">{content}</CanonicalCard>;
  }

  return <CanonicalCard variant="medium" className="flex flex-col gap-ds-4 p-ds-4">{content}</CanonicalCard>;
}
