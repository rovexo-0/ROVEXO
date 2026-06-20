"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { formatCurrency } from "@/lib/wallet/utils";
import type { WithdrawFlowController } from "@/features/wallet/hooks/use-withdraw-flow";

type WithdrawAmountStepProps = {
  flow: WithdrawFlowController;
};

export function WithdrawAmountStep({ flow }: WithdrawAmountStepProps) {
  const { availableBalance, draft, parsedAmount, updateDraft } = flow;

  return (
    <section aria-labelledby="withdraw-amount-heading" className="flex flex-col gap-ds-3">
      <h2 id="withdraw-amount-heading" className="text-base font-semibold text-text-primary">
        Enter Amount
      </h2>

      <Card padding="md" className="shadow-ds-soft">
        <div className="flex flex-col gap-ds-4">
          <p className="text-sm text-text-secondary">
            Available: {formatCurrency(availableBalance)}
          </p>

          <label htmlFor="withdraw-amount" className="flex flex-col gap-ds-2">
            <span className="text-sm font-medium text-text-primary">Withdrawal amount</span>
            <input
              id="withdraw-amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={draft.amount}
              onChange={(event) => updateDraft({ amount: event.target.value })}
              className={cn(
                "min-h-ds-7 rounded-ds-md border border-border bg-surface px-ds-3 py-ds-2 text-lg font-semibold tabular-nums text-text-primary",
                focusRing,
              )}
            />
          </label>

          <button
            type="button"
            onClick={() => updateDraft({ amount: availableBalance.toFixed(2) })}
            className={cn(
              "self-start text-sm font-medium text-primary",
              focusRing,
            )}
          >
            Withdraw full balance
          </button>

          {parsedAmount > 0 && (
            <p className="text-sm text-text-secondary">
              You will withdraw {formatCurrency(parsedAmount)}
            </p>
          )}
        </div>
      </Card>
    </section>
  );
}
