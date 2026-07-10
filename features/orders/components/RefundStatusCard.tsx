import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";
import { buildOrderRefundView } from "@/lib/orders/refund-status";
import type { Order } from "@/lib/orders/types";

type RefundStatusCardProps = {
  order: Order;
};

const BANK_PROCESSING_NOTE =
  "Refunds are usually returned within 3–5 business days. Some banks may take up to 10 business days.";

function getBuyerRefundStatusLabel(status: string): { emoji: string; label: string } {
  if (status === "completed") {
    return { emoji: "🟢", label: "Refunded" };
  }
  if (status === "failed") {
    return { emoji: "🔴", label: "Failed" };
  }
  return { emoji: "🟡", label: "Initiated" };
}

export function RefundStatusCard({ order }: RefundStatusCardProps) {
  const refund = buildOrderRefundView(order);
  if (!refund) return null;

  const status = getBuyerRefundStatusLabel(refund.status);
  const showProcessingNote = refund.status !== "completed" && refund.status !== "failed";

  return (
    <div className="flex flex-col gap-ds-3">
      <Card padding="lg" className="flex flex-col gap-ds-4">
        <h2 className="text-base font-semibold text-text-primary">Refund</h2>

        <div className="flex flex-col gap-ds-1">
          <p className="text-sm text-text-secondary">Status</p>
          <p className="text-sm font-semibold text-text-primary">
            {status.emoji} {status.label}
          </p>
        </div>

        <div className="flex flex-col gap-ds-1">
          <p className="text-sm text-text-secondary">Refund</p>
          <p className="text-sm font-semibold text-text-primary">
            <Price amount={refund.amount} size="sm" />
          </p>
        </div>
      </Card>

      {showProcessingNote ? (
        <p className="text-xs text-text-muted">{BANK_PROCESSING_NOTE}</p>
      ) : null}
    </div>
  );
}
