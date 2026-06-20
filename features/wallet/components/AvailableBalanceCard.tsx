"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AnimatedCounter } from "@/features/dashboard/components/AnimatedCounter";
import { formatCurrency } from "@/lib/wallet/utils";

type AvailableBalanceCardProps = {
  balance: number;
};

export function AvailableBalanceCard({ balance }: AvailableBalanceCardProps) {
  return (
    <Card padding="lg" className="shadow-ds-soft">
      <div className="flex flex-col gap-ds-4">
        <div className="flex items-start justify-between gap-ds-3">
          <div>
            <p className="text-sm font-medium text-text-secondary">Available Balance</p>
            <p className="mt-ds-2 text-3xl font-bold tabular-nums text-text-primary">
              <AnimatedCounter
                value={Math.round(balance * 100)}
                format={(value) => formatCurrency(value / 100)}
              />
            </p>
          </div>
          <Badge variant="success">Available</Badge>
        </div>

        <Link href="/seller/wallet/withdraw" className="block">
          <Button variant="primary" fullWidth size="md" className="min-h-ds-7 rounded-ds-lg">
            Withdraw
          </Button>
        </Link>
      </div>
    </Card>
  );
}
