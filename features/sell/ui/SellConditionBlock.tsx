"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { CanonicalCard } from "@/src/components/canonical";
import { focusRing } from "@/features/sell/ui/sell-classes";
import { SellInlineError } from "@/features/sell/ui/SellPrimitives";
import { useSellProgressiveFlow } from "@/features/sell/hooks/use-sell-progressive-flow";
import { useSell } from "@/features/sell/context/SellProvider";
import { SELL_QUICK_CONDITIONS } from "@/lib/sell/sell-condition-options";
import { getSellValidationErrorForField } from "@/lib/sell/sell-validation";

type SellConditionBlockProps = {
  onConditionSelected?: () => void;
};

export function SellConditionBlock({ onConditionSelected }: SellConditionBlockProps) {
  const { draft, updateDraft, showValidation, pendingTitleRef, pendingDescriptionRef } = useSell();
  const { scrollToNextStep } = useSellProgressiveFlow();

  const error = useMemo(() => {
    if (!showValidation) return undefined;
    return getSellValidationErrorForField(
      draft,
      {
        title: pendingTitleRef.current || draft.title,
        description: pendingDescriptionRef.current || draft.description,
      },
      "condition",
    );
  }, [draft, pendingDescriptionRef, pendingTitleRef, showValidation]);

  const select = (value: string) => {
    updateDraft({ condition: value }, { userModifiedFields: ["condition"] });
    onConditionSelected?.();
    scrollToNextStep("condition");
  };

  return (
    <div className="flex flex-col gap-ds-1">
      <CanonicalCard
        variant="medium"
        className={cn("p-ds-4", error && "ring-2 ring-destructive/40")}
      >
        <p className="mb-ds-3 text-sm font-medium text-text-primary">Condition</p>
        <div className="grid grid-cols-2 gap-ds-2" role="radiogroup" aria-label="Condition">
          {SELL_QUICK_CONDITIONS.map((option) => {
            const active = draft.condition === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => select(option)}
                className={cn(
                  "min-h-[52px] rounded-ds-md border-2 px-ds-3 text-center text-sm font-semibold transition-colors",
                  active ? "border-primary bg-primary/5 text-primary" : "border-border bg-surface-muted/40 text-text-primary",
                  focusRing,
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      </CanonicalCard>
      <SellInlineError message={error} />
    </div>
  );
}
