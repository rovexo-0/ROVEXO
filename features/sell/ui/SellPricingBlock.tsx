"use client";

import { useId, useMemo } from "react";
import { cn } from "@/lib/cn";
import { sellInput, sellInvalid, focusRing } from "@/features/sell/ui/sell-classes";
import { SellSection, SellStepper, SellInlineError } from "@/features/sell/ui/SellPrimitives";
import { useSell } from "@/features/sell/context/SellProvider";
import { getListingValidationErrors } from "@/features/sell/types";

export function SellPricingBlock() {
  const { draft, updateDraft, showValidation } = useSell();
  const priceId = useId();

  const errors = useMemo(
    () => getListingValidationErrors(draft, { mode: "quick", showErrors: showValidation }),
    [draft, showValidation],
  );

  return (
    <SellSection aria-label="Pricing">
      <div className="flex flex-col gap-ds-1">
        <label htmlFor={priceId} className="px-ds-1 text-xs font-medium text-text-muted">
          Price
        </label>
        <input
          id={priceId}
          type="text"
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          aria-label="Price"
          placeholder="0.00"
          value={draft.price}
          onChange={(event) => updateDraft({ price: event.target.value.replace(/[^\d.]/g, "") })}
          className={cn(sellInput, focusRing, "min-h-ds-7 text-lg tabular-nums", sellInvalid(Boolean(errors.price)))}
        />
        <SellInlineError message={errors.price} />
      </div>

      <div className="border-t border-border pt-ds-3">
        <SellStepper value={draft.stock} onChange={(stock) => updateDraft({ stock })} />
      </div>
    </SellSection>
  );
}
