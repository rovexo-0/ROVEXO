"use client";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { InventoryQuantityField } from "@/features/sell/components/InventoryQuantityField";
import { isLowStock } from "@/lib/sell/inventory";
import type { SellFormController } from "@/features/sell/hooks/use-sell-wizard";
import { focusRing } from "@/components/ui/tokens";

type SellInventoryFieldsProps = {
  form: SellFormController;
};

const fieldClassName =
  "min-h-ds-7 w-full rounded-ds-md border border-border bg-surface px-ds-3 py-ds-2 text-sm text-text-primary placeholder:text-text-muted";

export function SellInventoryFields({ form }: SellInventoryFieldsProps) {
  const { draft, updateDraft } = form;
  const showLowStock = isLowStock(draft.stock, draft.lowStockAlert);

  return (
    <>
      <div className="border-t border-border px-ds-4 py-ds-3">
        <label htmlFor="sell-sku" className="flex flex-col gap-ds-2">
          <span className="text-sm font-medium text-text-primary">SKU</span>
          <span className="text-xs text-text-secondary">Optional. Unique product reference.</span>
          <input
            id="sell-sku"
            type="text"
            value={draft.sku}
            onChange={(event) => updateDraft({ sku: event.target.value })}
            placeholder="e.g. RVX-NKE-001"
            className={cn(fieldClassName, focusRing)}
          />
        </label>
      </div>

      {showLowStock && (
        <div className="border-t border-border px-ds-4 py-ds-3">
          <Badge variant="warning" className="self-start">
            Low Stock
          </Badge>
        </div>
      )}

      <div className="border-t border-border px-ds-4 py-ds-3">
        <InventoryQuantityField
          id="sell-low-stock-alert"
          label="Low Stock Alert"
          value={draft.lowStockAlert}
          onChange={(lowStockAlert) => updateDraft({ lowStockAlert })}
        />
      </div>
    </>
  );
}
