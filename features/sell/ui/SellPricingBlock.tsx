"use client";

import { useId, useMemo } from "react";
import { SellFieldMasterIcon } from "@/features/account-center/components/MasterMenuIcon";
import { ListingAttributeLabel } from "@/components/listing/ListingAttributeLabel";
import { useSell } from "@/features/sell/context/SellProvider";
import { getListingValidationErrors } from "@/features/sell/types";
import { SELL_CURRENCY_SSR_DEFAULT } from "@/lib/sell/currency";

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
          <div className="cds-field sell-price-currency__field">
            <label htmlFor={priceId} className="cds-field__label">
              <ListingAttributeLabel>Price</ListingAttributeLabel>
            </label>
            {/* Adornment wraps the control only — never the label — so £ stays inside the input. */}
            <div className="sell-price-currency">
              <span className="sell-price-currency__symbol" aria-hidden="true">
                {SELL_CURRENCY_SSR_DEFAULT.symbol}
              </span>
              <input
                id={priceId}
                type="text"
                inputMode="decimal"
                enterKeyHint="done"
                autoComplete="off"
                aria-label="Price"
                placeholder="0.00"
                value={draft.price}
                className="cds-input"
                onChange={(event) => updateDraft({ price: event.target.value.replace(/[^\d.]/g, "") })}
              />
            </div>
            {errors.price ? (
              <p className="cds-field__error" role="alert">
                {errors.price}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
