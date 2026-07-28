"use client";

import { useId, useMemo } from "react";
import { CanonicalInput } from "@/src/components/canonical";
import { SellFieldMasterIcon } from "@/features/account-center/components/MasterMenuIcon";
import { useSell } from "@/features/sell/context/SellProvider";
import { INVENTORY_MAX, INVENTORY_MIN, parseInventoryInput } from "@/lib/sell/inventory";

/**
 * Sell Quantity — same visual system as Price (CanonicalInput).
 * Persists `draft.stock` → publish `inventory.stock` (DB column `products.stock`).
 */
export function SellStockQuantityBlock() {
  const { draft, updateDraft } = useSell();
  const quantityId = useId();

  const displayValue = useMemo(() => {
    const n = Number(draft.stock);
    if (!Number.isFinite(n) || n < INVENTORY_MIN) return String(INVENTORY_MIN);
    return String(Math.min(INVENTORY_MAX, Math.max(INVENTORY_MIN, Math.round(n))));
  }, [draft.stock]);

  return (
    <div className="sell-aa-block sell-price-with-icon" data-sell-quantity>
      <div className="sell-price-with-icon__row">
        <SellFieldMasterIcon fieldId="price" />
        <div className="sell-price-with-icon__field min-w-0 flex-1">
          <CanonicalInput
            id={quantityId}
            label="Quantity"
            inputType="number"
            enterKeyHint="done"
            autoComplete="off"
            inputMode="numeric"
            aria-label="Quantity"
            placeholder="1"
            min={INVENTORY_MIN}
            max={INVENTORY_MAX}
            step={1}
            value={displayValue}
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, "").slice(0, 5);
              if (!digits) {
                updateDraft({ stock: INVENTORY_MIN });
                return;
              }
              updateDraft({ stock: parseInventoryInput(digits, INVENTORY_MIN) });
            }}
            onBlur={() => {
              updateDraft({ stock: parseInventoryInput(displayValue, INVENTORY_MIN) });
            }}
          />
        </div>
      </div>
    </div>
  );
}
