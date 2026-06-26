"use client";

import { cn } from "@/lib/cn";
import { MIGRATION_WIZARD_STEPS } from "@/lib/seller/migration/constants";
import type { MigrationWizardStep } from "@/lib/seller/migration/types";

type MigrationStepIndicatorProps = {
  currentStep: MigrationWizardStep;
};

export function MigrationStepIndicator({ currentStep }: MigrationStepIndicatorProps) {
  return (
    <nav aria-label="Migration progress" className="w-full">
      <ol className="flex items-center justify-between gap-ds-1">
        {MIGRATION_WIZARD_STEPS.map(({ step, label }) => {
          const isActive = step === currentStep;
          const isComplete = step < currentStep;
          return (
            <li key={step} className="flex min-w-0 flex-1 flex-col items-center gap-ds-1">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-ds-full text-xs font-bold",
                  isComplete && "bg-primary text-white",
                  isActive && !isComplete && "border-2 border-primary bg-white text-primary",
                  !isActive && !isComplete && "border border-border bg-surface text-text-muted",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isComplete ? "✓" : step}
              </span>
              <span
                className={cn(
                  "hidden text-center text-[10px] font-medium sm:block",
                  isActive ? "text-text-primary" : "text-text-muted",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
