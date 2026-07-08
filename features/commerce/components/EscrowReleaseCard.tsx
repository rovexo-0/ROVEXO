import { Card } from "@/components/ui/Card";
import { formatWalletDate } from "@/lib/wallet/utils";
import type { OrderEscrowState } from "@/lib/commerce-engine/read-model";

type EscrowReleaseCardProps = {
  escrow: OrderEscrowState;
  view: "buyer" | "seller";
};

const STATE_LABELS: Record<OrderEscrowState["state"], string> = {
  none: "Not started",
  pending: "Pending release",
  on_hold: "On hold",
  available: "Available for payout",
  released: "Released",
  refunded: "Refunded",
};

export function EscrowReleaseCard({ escrow, view }: EscrowReleaseCardProps) {
  if (escrow.state === "none" || escrow.state === "refunded") {
    return null;
  }

  const isSeller = view === "seller";
  const releaseLabel = escrow.releaseEligibleAt
    ? formatWalletDate(escrow.releaseEligibleAt)
    : null;

  return (
    <Card padding="lg" className="flex flex-col gap-ds-2">
      <h2 className="text-base font-semibold text-text-primary">
        {isSeller ? "Seller funds" : "Order protection"}
      </h2>
      <p className="text-sm text-text-secondary">
        Status: <span className="font-medium text-text-primary">{STATE_LABELS[escrow.state]}</span>
        {escrow.amount > 0 && isSeller ? ` · ${escrow.amount.toFixed(2)} GBP` : null}
      </p>
      {escrow.state === "pending" && releaseLabel ? (
        <p className="text-sm text-text-muted">
          {isSeller
            ? `Funds release automatically on ${releaseLabel} (24 hours after delivery) unless a claim is opened.`
            : `Seller funds are scheduled to release on ${releaseLabel} if no claim is opened.`}
        </p>
      ) : null}
      {escrow.state === "on_hold" ? (
        <p className="text-sm text-text-muted">
          A claim or refund is open. Payout is paused until the case is resolved.
        </p>
      ) : null}
      {escrow.state === "released" && isSeller ? (
        <p className="text-sm text-text-muted">Funds have been transferred to your connected payout account.</p>
      ) : null}
    </Card>
  );
}
