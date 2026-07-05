import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { getDaysUntilAvailable } from "@/lib/wallet/utils";

type PendingBalanceCardProps = {
  balance: number;
  availableAt: string;
};

export function PendingBalanceCard({ balance, availableAt }: PendingBalanceCardProps) {
  const daysRemaining = getDaysUntilAvailable(availableAt);

  return (
    <Card padding="md" className="">
      <div className="flex flex-col gap-ds-2">
        <p className="text-sm font-medium text-text-secondary">Pending Balance</p>
        <Price amount={balance} size="lg" currency="GBP" locale="en-GB" />
        <p className="text-xs text-text-secondary">
          Becomes available after a short hold ({daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining)
        </p>
      </div>
    </Card>
  );
}
