"use client";

import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import { clampInventory, INVENTORY_MAX, INVENTORY_MIN } from "@/lib/sell/inventory";
import { focusRing } from "@/components/ui/tokens";

type InventoryQuantityFieldProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  helpText?: string;
};

const controlClassName =
  "min-h-ds-7 rounded-ds-md border border-border bg-surface text-sm text-text-primary";

export function InventoryQuantityField({
  id,
  label,
  value,
  onChange,
  helpText,
}: InventoryQuantityFieldProps) {
  const adjust = (delta: number) => {
    onChange(clampInventory(value + delta));
  };

  return (
    <div className="flex flex-col gap-ds-2">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      {helpText && <p className="text-xs text-text-secondary">{helpText}</p>}

      <div className="flex items-center gap-ds-2">
        <IconButton
          label={`Decrease ${label}`}
          variant="outline"
          size="md"
          className="min-h-ds-7 min-w-ds-7 shrink-0 rounded-ds-md"
          disabled={value <= INVENTORY_MIN}
          onClick={() => adjust(-1)}
        >
          <span className="text-lg font-semibold leading-none" aria-hidden>
            −
          </span>
        </IconButton>

        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={String(value)}
          onChange={(event) => {
            const next = event.target.value.replace(/\D/g, "");
            onChange(next ? clampInventory(Number(next)) : value);
          }}
          className={cn(controlClassName, focusRing, "w-full px-ds-3 py-ds-2 text-center tabular-nums")}
          aria-valuemin={INVENTORY_MIN}
          aria-valuemax={INVENTORY_MAX}
          aria-valuenow={value}
        />

        <IconButton
          label={`Increase ${label}`}
          variant="outline"
          size="md"
          className="min-h-ds-7 min-w-ds-7 shrink-0 rounded-ds-md"
          disabled={value >= INVENTORY_MAX}
          onClick={() => adjust(1)}
        >
          <span className="text-lg font-semibold leading-none" aria-hidden>
            +
          </span>
        </IconButton>
      </div>
    </div>
  );
}
