"use client";

import { useId, useMemo } from "react";
import { CanonicalInput } from "@/src/components/canonical";
import { SellFieldMasterIcon } from "@/features/account-center/components/MasterMenuIcon";
import { useSell } from "@/features/sell/context/SellProvider";
import { getListingValidationErrors } from "@/features/sell/types";

export function SellPricingBlock({ bare = false }: { bare?: boolean }) {
  void bare;
  const { draft, updateDraft, showValidation } = useSell();
  const priceId = useId();

  const errors = useMemo(
    () => getListingValidationErrors(draft, { mode: "quick", showErrors: showValidation }),
    [draft, showValidation],
  );

  return (
    <div className="sell-aa-block sell-price-with-icon">
      <div className="sell-price-with-icon__row">
        <SellFieldMasterIcon fieldId="price" />
        <div className="sell-price-with-icon__field min-w-0 flex-1">
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
        </div>
      </div>
    </div>
  );
}
