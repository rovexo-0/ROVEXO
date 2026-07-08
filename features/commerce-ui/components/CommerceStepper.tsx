import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CheckoutStepId } from "@/features/commerce-ui/types";

type CommerceStepperProps = {
  current: CheckoutStepId;
  className?: string;
};

const STEPS: Array<{ id: CheckoutStepId; label: string }> = [
  { id: "cart", label: "Cart" },
  { id: "shipping", label: "Shipping" },
  { id: "payment", label: "Payment" },
  { id: "review", label: "Review" },
];

type StepState = "complete" | "active" | "upcoming";

function resolveState(currentIndex: number, index: number): StepState {
  if (index < currentIndex) return "complete";
  if (index === currentIndex) return "active";
  return "upcoming";
}

/** Canonical 4-step checkout progress indicator (Cart → Review). */
export function CommerceStepper({ current, className }: CommerceStepperProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === current);

  return (
    <nav aria-label="Checkout progress" className={cn("w-full", className)}>
      <ol className="flex items-start">
        {STEPS.map((step, index) => {
          const state = resolveState(currentIndex, index);
          const isLast = index === STEPS.length - 1;
          const filled = state === "complete" || state === "active";

          return (
            <li key={step.id} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <span className="h-[2px] flex-1 bg-transparent" aria-hidden />
                <span
                  aria-current={state === "active" ? "step" : undefined}
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-ds-full text-xs font-semibold transition-colors",
                    filled
                      ? "bg-primary text-primary-foreground shadow-[var(--ds-shadow-soft)]"
                      : "bg-surface-muted text-text-secondary",
                  )}
                >
                  {state === "complete" ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
                </span>
                {isLast ? (
                  <span className="h-[2px] flex-1 bg-transparent" aria-hidden />
                ) : (
                  <span
                    className={cn(
                      "h-[2px] flex-1 rounded-ds-full",
                      index < currentIndex ? "bg-primary" : "bg-border",
                    )}
                    aria-hidden
                  />
                )}
              </div>
              <span
                className={cn(
                  "mt-ds-2 text-xs font-medium",
                  state === "upcoming" ? "text-text-muted" : "text-text-primary",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
