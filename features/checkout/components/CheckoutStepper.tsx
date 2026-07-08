import type { CheckoutStep } from "@/features/checkout/types";

const STEPS: Array<{ id: CheckoutStep; label: string; number: number }> = [
  { id: "delivery", label: "Delivery", number: 1 },
  { id: "payment", label: "Payment", number: 2 },
  { id: "review", label: "Review", number: 3 },
];

type CheckoutStepperProps = {
  step: CheckoutStep;
};

function stepState(current: CheckoutStep, target: CheckoutStep): "complete" | "active" | "upcoming" {
  const order: CheckoutStep[] = ["delivery", "payment", "review"];
  const currentIndex = order.indexOf(current);
  const targetIndex = order.indexOf(target);
  if (targetIndex < currentIndex) return "complete";
  if (targetIndex === currentIndex) return "active";
  return "upcoming";
}

export function CheckoutStepper({ step }: CheckoutStepperProps) {
  return (
    <nav className="ckt-v1__stepper" aria-label="Checkout progress">
      <ol className="ckt-v1__stepper-list">
        {STEPS.map((item, index) => {
          const state = stepState(step, item.id);
          return (
            <li key={item.id} className="ckt-v1__stepper-item">
              <div className="ckt-v1__stepper-node-wrap">
                <span
                  className={`ckt-v1__stepper-node ckt-v1__stepper-node--${state}`}
                  aria-current={state === "active" ? "step" : undefined}
                >
                  {state === "complete" ? (
                    <svg viewBox="0 0 20 20" fill="none" aria-hidden>
                      <path
                        d="M5 10.5 8.5 14 15 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    item.number
                  )}
                </span>
                <span className="ckt-v1__stepper-label">{item.label}</span>
              </div>
              {index < STEPS.length - 1 ? <span className="ckt-v1__stepper-line" aria-hidden /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
