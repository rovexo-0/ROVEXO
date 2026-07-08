import { Card } from "@/components/ui/Card";
import { formatWalletDate } from "@/lib/wallet/utils";
import type { OrderResolutionSummary } from "@/lib/resolution-engine/types";

type ResolutionStatusCardProps = {
  resolution: OrderResolutionSummary;
  view: "buyer" | "seller";
};

const STATUS_LABELS: Record<string, string> = {
  none: "No active resolution",
  OPEN: "Open",
  PROCESSING: "Processing automatically",
  WAITING_CARRIER: "Waiting on carrier",
  WAITING_TRACKING: "Waiting on tracking",
  WAITING_RETURN: "Waiting for return",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REFUNDED: "Refunded",
  CLOSED: "Closed",
};

export function ResolutionStatusCard({ resolution, view }: ResolutionStatusCardProps) {
  if (resolution.status === "none" && !resolution.claimStatus && !resolution.returnStatus) {
    return null;
  }

  const eta = resolution.estimatedCompletionAt
    ? formatWalletDate(resolution.estimatedCompletionAt)
    : null;

  return (
    <Card padding="lg" className="flex flex-col gap-ds-2">
      <h2 className="text-base font-semibold text-text-primary">Resolution status</h2>
      <p className="text-sm text-text-secondary">
        Status:{" "}
        <span className="font-medium text-text-primary">
          {STATUS_LABELS[resolution.status] ?? resolution.status}
        </span>
      </p>
      {resolution.refundAmount != null && resolution.status === "REFUNDED" ? (
        <p className="text-sm text-text-muted">
          Refund issued: £{resolution.refundAmount.toFixed(2)}
        </p>
      ) : null}
      {resolution.claimStatus ? (
        <p className="text-sm text-text-muted">Carrier claim: {resolution.claimStatus}</p>
      ) : null}
      {resolution.returnStatus ? (
        <p className="text-sm text-text-muted">Return: {resolution.returnStatus}</p>
      ) : null}
      {eta && resolution.status !== "REFUNDED" && resolution.status !== "CLOSED" ? (
        <p className="text-sm text-text-muted">
          {view === "buyer"
            ? `Estimated completion: ${eta}`
            : `Estimated payout resolution: ${eta}`}
        </p>
      ) : null}
      <p className="text-xs text-text-muted">
        All cases are processed automatically — no manual review required.
      </p>
    </Card>
  );
}
