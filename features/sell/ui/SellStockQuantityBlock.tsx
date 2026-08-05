"use client";

import { useId, useState } from "react";
import { CanonicalInput } from "@/src/components/canonical";
import { ListingAttributeLabel } from "@/components/listing/ListingAttributeLabel";
import { SellFieldMasterIcon } from "@/features/account-center/components/MasterMenuIcon";
import { useSellActions, useSellDraft } from "@/features/sell/context/SellProvider";
import { INVENTORY_MAX, INVENTORY_MIN, parseInventoryInput } from "@/lib/sell/inventory";

/**
 * Sell Quantity (Stock) — inline on Sell form only (no Quantity page / popup).
 * User may clear and type 1…999+ directly; clamp on blur.
 */
export function SellStockQuantityBlock() {
  const { draft } = useSellDraft();
  const { updateDraft } = useSellActions();
  const quantityId = useId();
  const [editingValue, setEditingValue] = useState<string | null>(null);

  const committed = String(
    Number.isFinite(draft.stock) && draft.stock >= INVENTORY_MIN
      ? Math.min(INVENTORY_MAX, Math.round(draft.stock))
      : INVENTORY_MIN,
  );
  const displayValue = editingValue !== null ? editingValue : committed;

  return (
    <div className="sell-aa-block sell-price-with-icon" data-sell-quantity>
      <div className="sell-price-with-icon__row">
        <SellFieldMasterIcon fieldId="quantity" />
        <div className="sell-price-with-icon__field min-w-0 flex-1">
          <CanonicalInput
            id={quantityId}
            label={<ListingAttributeLabel>Quantity (Stock)</ListingAttributeLabel>}
            inputType="text"
            enterKeyHint="done"
            autoComplete="off"
            inputMode="numeric"
            aria-label="Quantity (Stock)"
            placeholder="1"
            value={displayValue}
            onFocus={() => setEditingValue(committed)}
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, "").slice(0, 5);
              setEditingValue(digits);
              if (!digits) return;
              updateDraft({ stock: parseInventoryInput(digits, INVENTORY_MIN) });
            }}
            onBlur={() => {
              const next = parseInventoryInput(editingValue ?? committed, INVENTORY_MIN);
              updateDraft({ stock: next });
              setEditingValue(null);
            }}
          />
        </div>
      </div>
    </div>
  );
}
