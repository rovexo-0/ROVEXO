"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import {
  sellConditionChipClassName,
  sellFieldClassName,
  sellFormCardClassName,
} from "@/features/sell/components/sell-ui";
import { useSell } from "@/features/sell/context/SellProvider";
import { SELL_CONDITIONS } from "@/features/sell/types";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn("h-4 w-4 text-text-secondary transition-transform", open && "rotate-180")}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
    </svg>
  );
}

export function OptionalCard() {
  const { draft, updateDraft } = useSell();
  const [open, setOpen] = useState(false);

  return (
    <div className={cn(sellFormCardClassName, "gap-0 p-0")}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex min-h-ds-7 w-full items-center justify-between px-ds-4 py-ds-3 text-left",
          focusRing,
        )}
        aria-expanded={open}
        aria-controls="sell-optional-panel"
        aria-label="Optional details"
      >
        <span className="text-sm text-text-secondary">Optional</span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <div id="sell-optional-panel" className="flex flex-col gap-ds-3 border-t border-border px-ds-4 pb-ds-4 pt-ds-3">
          <div className="flex flex-wrap gap-ds-2" role="group" aria-label="Condition">
            {SELL_CONDITIONS.map((condition) => (
              <button
                key={condition}
                type="button"
                data-selected={draft.condition === condition ? "true" : "false"}
                className={sellConditionChipClassName()}
                onClick={() => updateDraft({ condition })}
              >
                {condition}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={draft.brand}
            onChange={(event) => updateDraft({ brand: event.target.value })}
            placeholder="Brand (optional)"
            aria-label="Brand"
            className={cn(sellFieldClassName, focusRing)}
          />

          <div className="grid gap-ds-3 sm:grid-cols-2">
            <input
              type="text"
              value={draft.color}
              onChange={(event) => updateDraft({ color: event.target.value })}
              placeholder="Colour (optional)"
              aria-label="Colour"
              className={cn(sellFieldClassName, focusRing)}
            />
            <input
              type="text"
              value={draft.size}
              onChange={(event) => updateDraft({ size: event.target.value })}
              placeholder="Size (optional)"
              aria-label="Size"
              className={cn(sellFieldClassName, focusRing)}
            />
          </div>

          <input
            type="text"
            value={draft.material}
            onChange={(event) => updateDraft({ material: event.target.value })}
            placeholder="Material (optional)"
            aria-label="Material"
            className={cn(sellFieldClassName, focusRing)}
          />

          <label className="flex min-h-ds-7 cursor-pointer items-center gap-ds-3">
            <input
              type="checkbox"
              checked={draft.acceptOffers}
              onChange={(event) => updateDraft({ acceptOffers: event.target.checked })}
              className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            />
            <span className="text-sm font-medium text-text-primary">Accept offers</span>
          </label>
        </div>
      ) : null}
    </div>
  );
}
