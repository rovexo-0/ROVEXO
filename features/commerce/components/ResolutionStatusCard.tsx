import {
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
import { formatWalletDate } from "@/lib/wallet/utils";
import type { OrderResolutionSummary } from "@/lib/resolution-engine/types";

type ResolutionStatusCardProps = {
  resolution: OrderResolutionSummary;
  view: "buyer" | "seller";
};

const STATUS_LABELS: Record<string, string> = {
  none: "None",
  OPEN: "Open",
  PROCESSING: "Processing",
  WAITING_CARRIER: "Awaiting carrier",
  WAITING_TRACKING: "Awaiting tracking",
  WAITING_RETURN: "Awaiting return",
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
  const statusLabel = STATUS_LABELS[resolution.status] ?? resolution.status;

  return (
    <CanonicalSection title="Resolution">
      <CanonicalCard variant="list" className="w-full">
        <CanonicalMenuRow title="Status" value={statusLabel} showChevron={false} />
        {resolution.refundAmount != null && resolution.status === "REFUNDED" ? (
          <CanonicalMenuRow
            title="Refund"
            value={`£${resolution.refundAmount.toFixed(2)}`}
            showChevron={false}
          />
        ) : null}
        {resolution.claimStatus ? (
          <CanonicalMenuRow
            title="Carrier claim"
            value={resolution.claimStatus}
            showChevron={false}
          />
        ) : null}
        {resolution.returnStatus ? (
          <CanonicalMenuRow
            title="Return"
            value={resolution.returnStatus}
            showChevron={false}
          />
        ) : null}
        {eta && resolution.status !== "REFUNDED" && resolution.status !== "CLOSED" ? (
          <CanonicalMenuRow
            title={view === "buyer" ? "Est. completion" : "Est. payout"}
            value={eta}
            showChevron={false}
          />
        ) : null}
      </CanonicalCard>
      <CanonicalInfoBlock variant="description" className="mt-ds-2">
        <p>Processed automatically.</p>
      </CanonicalInfoBlock>
    </CanonicalSection>
  );
}
