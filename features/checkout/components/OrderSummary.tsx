import { Price } from "@/components/ui/Price";
import { Card } from "@/components/ui/Card";
import type { OrderTotals } from "@/lib/orders/types";

type OrderSummaryProps = {
  totals: OrderTotals;
  title?: string;
};

function SummaryRow({
  label,
  amount,
  emphasis = false,
}: {
  label: string;
  amount: number;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-ds-3 text-sm">
      <span className={emphasis ? "font-semibold text-text-primary" : "text-text-secondary"}>
        {label}
      </span>
      <Price
        amount={amount}
        size={emphasis ? "md" : "sm"}
        className={
          emphasis
            ? "[&_span]:text-lg [&_span]:font-bold [&_span]:text-text-primary"
            : "[&_span]:font-medium [&_span]:text-text-primary"
        }
      />
    </div>
  );
}

export function OrderSummary({ totals, title = "Order Summary" }: OrderSummaryProps) {
  return (
    <Card padding="lg" className="flex flex-col gap-ds-4 shadow-ds-soft">
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>

      <div className="flex flex-col gap-ds-3">
        <SummaryRow label="Item" amount={totals.itemPrice} />
        <SummaryRow label="Delivery" amount={totals.delivery} />
        <SummaryRow label="Buyer Protection Fee" amount={totals.protectedFee} />
      </div>

      <div className="border-t border-border pt-ds-4">
        <SummaryRow label="Total" amount={totals.total} emphasis />
      </div>
    </Card>
  );
}
