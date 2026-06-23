"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";
import type { WithdrawFlowController } from "@/features/wallet/hooks/use-withdraw-flow";

type WithdrawMethodStepProps = {
  flow: WithdrawFlowController;
};

export function WithdrawMethodStep({ flow }: WithdrawMethodStepProps) {
  const { methods, draft, updateDraft } = flow;

  return (
    <section aria-labelledby="withdraw-method-heading" className="flex flex-col gap-ds-3">
      <h2 id="withdraw-method-heading" className="text-base font-semibold text-text-primary">
        Select Method
      </h2>

      <div className="flex flex-col gap-ds-3">
        {methods.map((method) => {
          const selected = draft.methodId === method.id;

          return (
            <button
              key={method.id}
              type="button"
              disabled={!method.connected}
              onClick={() => updateDraft({ methodId: method.id })}
              className={cn("text-left", !method.connected && "opacity-50")}
            >
              <Card
                padding="md"
                interactive
                className={cn(
                  "",
                  transitionFast,
                  focusRing,
                  selected && "border-primary ring-2 ring-ring/20",
                )}
              >
                <div className="flex min-h-[72px] items-center gap-ds-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-ds-lg bg-surface-muted text-sm font-bold text-text-secondary">
                    {method.provider === "bank_account" ? "BA" : "SC"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text-primary">{method.label}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">•••• {method.lastDigits}</p>
                    <p className="mt-ds-1 text-xs text-text-muted">
                      {method.connected ? "Connected" : "Not connected"}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-ds-full border border-border",
                      selected && "border-primary bg-primary",
                    )}
                    aria-hidden
                  >
                    {selected && <span className="h-2 w-2 rounded-ds-full bg-primary-foreground" />}
                  </span>
                </div>
              </Card>
            </button>
          );
        })}
      </div>
    </section>
  );
}
