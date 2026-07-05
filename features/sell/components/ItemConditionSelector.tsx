"use client";

import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { sellFormCardClassName } from "@/features/sell/components/sell-ui";
import { useSell } from "@/features/sell/context/SellProvider";

/**
 * Item condition — always visible directly below Parcel Size.
 *
 * Presentation only: the four labels map onto the unchanged backend condition
 * values in `SELL_CONDITIONS`, so stored/API values are untouched. "Acceptable"
 * (and "Good") are intentionally not offered. Single selection.
 */
const CONDITION_UI: { label: string; value: string }[] = [
  { label: "New", value: "New (Unused)" },
  { label: "Like New", value: "Like New" },
  { label: "Very Good", value: "Very Good" },
  { label: "Used", value: "Used" },
];

export function ItemConditionSelector() {
  const { draft, updateDraft } = useSell();

  return (
    <section aria-label="Item condition" className={cn(sellFormCardClassName, "gap-ds-2")}>
      <span className="px-ds-1 text-xs font-medium text-text-muted">Condition</span>
      <div
        role="radiogroup"
        aria-label="Item condition"
        className="grid grid-cols-4 gap-ds-2"
      >
        {CONDITION_UI.map((option) => {
          const selected = draft.condition === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              onClick={() => updateDraft({ condition: option.value })}
              className={cn(
                "flex items-center justify-center rounded-ds-md border-2 px-ds-1 text-center font-semibold leading-tight transition-all duration-200 active:scale-[0.97]",
                selected
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-surface-muted/40 text-text-secondary hover:border-primary/40",
                focusRing,
              )}
              style={{ minHeight: 48, fontSize: "clamp(0.72rem, 2.6vw, 0.875rem)" }}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
