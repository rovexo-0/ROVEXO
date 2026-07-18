"use client";

import { CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";
import { formatCurrency } from "@/lib/wallet/utils";
import type { WithdrawFlowController } from "@/features/wallet/hooks/use-withdraw-flow";

type WithdrawReviewStepProps = {
  flow: WithdrawFlowController;
};

export function WithdrawReviewStep({ flow }: WithdrawReviewStepProps) {
  const { selectedMethod, parsedAmount } = flow;

  return (
    <CanonicalSection title="Review">
      <CanonicalCard variant="list">
        <CanonicalMenuRow
          title="Method"
          value={selectedMethod?.label ?? "—"}
          showChevron={false}
        />
        <CanonicalMenuRow
          title="Account"
          value={selectedMethod ? `•••• ${selectedMethod.lastDigits}` : "—"}
          showChevron={false}
        />
        <CanonicalMenuRow title="Amount" value={formatCurrency(parsedAmount)} showChevron={false} />
        <CanonicalMenuRow title="Fee" value={formatCurrency(0)} showChevron={false} />
        <CanonicalMenuRow title="You receive" value={formatCurrency(parsedAmount)} showChevron={false} />
      </CanonicalCard>
    </CanonicalSection>
  );
}
