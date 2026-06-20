import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/wallet/utils";
import type { WithdrawFlowController } from "@/features/wallet/hooks/use-withdraw-flow";

type WithdrawReviewStepProps = {
  flow: WithdrawFlowController;
};

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-ds-3 py-ds-2">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="truncate text-sm font-semibold text-text-primary">{value}</span>
    </div>
  );
}

export function WithdrawReviewStep({ flow }: WithdrawReviewStepProps) {
  const { selectedMethod, parsedAmount } = flow;

  return (
    <section aria-labelledby="withdraw-review-heading" className="flex flex-col gap-ds-3">
      <h2 id="withdraw-review-heading" className="text-base font-semibold text-text-primary">
        Review
      </h2>

      <Card padding="md" className="shadow-ds-soft">
        <ReviewRow label="Method" value={selectedMethod?.label ?? "—"} />
        <div className="border-t border-border">
          <ReviewRow
            label="Account"
            value={selectedMethod ? `•••• ${selectedMethod.lastDigits}` : "—"}
          />
        </div>
        <div className="border-t border-border">
          <ReviewRow label="Amount" value={formatCurrency(parsedAmount)} />
        </div>
        <div className="border-t border-border">
          <ReviewRow label="Fee" value={formatCurrency(0)} />
        </div>
        <div className="border-t border-border">
          <ReviewRow label="You receive" value={formatCurrency(parsedAmount)} />
        </div>
      </Card>
    </section>
  );
}
