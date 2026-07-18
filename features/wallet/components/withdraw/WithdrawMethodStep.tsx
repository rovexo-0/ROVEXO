"use client";

import { CanonicalCard, CanonicalMenuRow, CanonicalSection } from "@/src/components/canonical";
import type { WithdrawFlowController } from "@/features/wallet/hooks/use-withdraw-flow";

type WithdrawMethodStepProps = {
  flow: WithdrawFlowController;
};

export function WithdrawMethodStep({ flow }: WithdrawMethodStepProps) {
  const { methods, draft, updateDraft } = flow;

  return (
    <CanonicalSection title="Method">
      <CanonicalCard variant="list">
        {methods.map((method) => {
          const selected = draft.methodId === method.id;

          return (
            <CanonicalMenuRow
              key={method.id}
              title={method.label}
              description={`•••• ${method.lastDigits}`}
              value={
                !method.connected
                  ? "Not connected"
                  : selected
                    ? "Selected"
                    : undefined
              }
              disabled={!method.connected}
              showChevron={false}
              onClick={() => updateDraft({ methodId: method.id })}
            />
          );
        })}
      </CanonicalCard>
    </CanonicalSection>
  );
}
