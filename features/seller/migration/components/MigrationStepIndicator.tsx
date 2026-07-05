"use client";

import { cn } from "@/lib/cn";
import { MIGRATION_WIZARD_STEPS } from "@/lib/seller/migration/constants";
import type { MigrationWizardStep } from "@/lib/seller/migration/types";

type MigrationStepIndicatorProps = {
  currentStep: MigrationWizardStep;
};

export function MigrationStepIndicator({ currentStep }: MigrationStepIndicatorProps) {
  return (
    <nav aria-label="Import progress" className="byi-steps">
      <ol className="flex w-full items-center justify-between gap-ds-1">
        {MIGRATION_WIZARD_STEPS.map(({ step, label }) => {
          const isActive = step === currentStep;
          const isComplete = step < currentStep;
          return (
            <li key={step} className="byi-steps__item">
              <span
                className={cn(
                  "byi-steps__dot",
                  isComplete && "byi-steps__dot--complete",
                  isActive && !isComplete && "byi-steps__dot--active",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isComplete ? "✓" : step}
              </span>
              <span
                className={cn("byi-steps__label", isActive && "byi-steps__label--active")}
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
