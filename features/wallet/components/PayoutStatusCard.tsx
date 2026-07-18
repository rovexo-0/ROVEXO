"use client";

import { AnimatedCounter } from "@/features/dashboard/components/AnimatedCounter";
import {
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { formatCurrency } from "@/lib/wallet/utils";

type PayoutStatusCardProps = {
  paidOutBalance: number;
  payoutsEnabled: boolean;
};

export function PayoutStatusCard({ paidOutBalance, payoutsEnabled }: PayoutStatusCardProps) {
  return (
    <CanonicalSection title="Payouts">
      <CanonicalCard variant="list">
        <CanonicalMenuRow
          title="Paid out to bank"
          showChevron={false}
          trailing={
            <span className="cds-menu-row__value">
              <AnimatedCounter
                value={Math.round(paidOutBalance * 100)}
                format={(value) => formatCurrency(value / 100)}
              />
            </span>
          }
        />
        <CanonicalMenuRow
          title="Auto payouts"
          value={payoutsEnabled ? "On" : "Setup required"}
          showChevron={false}
        />
      </CanonicalCard>
      <CanonicalInfoBlock variant="description">
        Earnings transfer to your bank after each order clears the hold period.
      </CanonicalInfoBlock>
    </CanonicalSection>
  );
}
