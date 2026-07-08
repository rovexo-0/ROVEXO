"use client";

import { cn } from "@/lib/cn";
import { focusRing } from "@/features/sell/ui/sell-classes";
import { SellSection } from "@/features/sell/ui/SellPrimitives";
import { useSell } from "@/features/sell/context/SellProvider";

/** Fixed, Vinted-style condition ladder (best → most worn). */
const CONDITIONS = ["New", "Like New", "Very Good", "Good", "Used"] as const;

export function SellConditionBlock() {
  const { draft, updateDraft } = useSell();

  return (
    <SellSection title="Condition">
      <div className="flex flex-wrap gap-ds-2" role="radiogroup" aria-label="Condition">
        {CONDITIONS.map((condition) => {
          const active = draft.condition === condition;
          return (
            <button
              key={condition}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => updateDraft({ condition })}
              className={cn(
                "min-h-11 rounded-ds-full border-2 px-ds-4 py-ds-2 text-sm font-semibold transition-colors active:scale-[0.98]",
                active
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface-muted/40 text-text-primary",
                focusRing,
              )}
            >
              {condition}
            </button>
          );
        })}
      </div>
    </SellSection>
  );
}
