"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AnimatedCounter } from "@/features/dashboard/components/AnimatedCounter";
import { formatCurrency } from "@/lib/wallet/utils";

type PayoutStatusCardProps = {
  paidOutBalance: number;
  payoutsEnabled: boolean;
};

export function PayoutStatusCard({ paidOutBalance, payoutsEnabled }: PayoutStatusCardProps) {
  return (
    <Card padding="lg" className="">
      <div className="flex flex-col gap-ds-4">
        <div className="flex items-start justify-between gap-ds-3">
          <div>
            <p className="text-sm font-medium text-text-secondary">Paid out to Stripe</p>
            <p className="mt-ds-2 text-3xl font-bold tabular-nums text-text-primary">
              <AnimatedCounter
                value={Math.round(paidOutBalance * 100)}
                format={(value) => formatCurrency(value / 100)}
              />
            </p>
          </div>
          <Badge variant={payoutsEnabled ? "success" : "warning"}>
            {payoutsEnabled ? "Auto payouts on" : "Setup required"}
          </Badge>
        </div>

        <p className="text-sm text-text-secondary">
          After each order is confirmed and the hold period ends, ROVEXO automatically transfers
          your earnings to Stripe Connect. Stripe Express then deposits to your bank.
        </p>
      </div>
    </Card>
  );
}
