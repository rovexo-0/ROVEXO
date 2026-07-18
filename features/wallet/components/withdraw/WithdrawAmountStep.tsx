"use client";

import { CanonicalCard, CanonicalInput, CanonicalSection } from "@/src/components/canonical";
import { formatCurrency } from "@/lib/wallet/utils";
import type { WithdrawFlowController } from "@/features/wallet/hooks/use-withdraw-flow";

type WithdrawAmountStepProps = {
  flow: WithdrawFlowController;
};

export function WithdrawAmountStep({ flow }: WithdrawAmountStepProps) {
  const { availableBalance, draft, parsedAmount, updateDraft } = flow;

  return (
    <CanonicalSection title="Amount">
      <CanonicalCard variant="medium" className="flex flex-col gap-ds-4 p-ds-4">
        <p className="cds-menu-row__subtitle">Available {formatCurrency(availableBalance)}</p>

        <CanonicalInput
          id="withdraw-amount"
          label="Withdrawal amount"
          inputType="price"
          placeholder="0.00"
          value={draft.amount}
          onChange={(event) => updateDraft({ amount: event.target.value })}
        />

        <button
          type="button"
          className="account-settings-text-action self-start"
          onClick={() => updateDraft({ amount: availableBalance.toFixed(2) })}
        >
          Withdraw all
        </button>

        {parsedAmount > 0 ? (
          <p className="cds-menu-row__subtitle">You receive {formatCurrency(parsedAmount)}</p>
        ) : null}
      </CanonicalCard>
    </CanonicalSection>
  );
}
