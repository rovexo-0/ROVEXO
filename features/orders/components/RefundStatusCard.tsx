import { Price } from "@/components/ui/Price";
import {
  CanonicalCard,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
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
    <div className="flex w-full flex-col gap-ds-2">
      <CanonicalSection title="Refund">
        <CanonicalCard variant="list" className="w-full">
          <CanonicalMenuRow
            title="Status"
            value={`${status.emoji} ${status.label}`}
            showChevron={false}
          />
          <CanonicalMenuRow
            title="Refund"
            trailing={<Price amount={refund.amount} size="sm" />}
            showChevron={false}
          />
        </CanonicalCard>
      </CanonicalSection>

      {showProcessingNote ? (
        <p className="text-xs text-text-muted">{BANK_PROCESSING_NOTE}</p>
      ) : null}
    </div>
  );
}
