import {
  CanonicalCard,
  CanonicalInfoBlock,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";
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

function getEscrowNote(
  escrow: OrderEscrowState,
  view: "buyer" | "seller",
  releaseLabel: string | null,
): string | null {
  if (escrow.state === "pending" && releaseLabel) {
    return view === "seller"
      ? `Auto-release on ${releaseLabel} unless a claim is opened.`
      : `Seller funds release on ${releaseLabel} if no claim is opened.`;
  }
  if (escrow.state === "on_hold") {
    return "Payout paused while the case is open.";
  }
  if (escrow.state === "released" && view === "seller") {
    return "Transferred to your payout account.";
  }
  return null;
}

export function EscrowReleaseCard({ escrow, view }: EscrowReleaseCardProps) {
  if (escrow.state === "none" || escrow.state === "refunded") {
    return null;
  }

  const isSeller = view === "seller";
  const releaseLabel = escrow.releaseEligibleAt
    ? formatWalletDate(escrow.releaseEligibleAt)
    : null;
  const note = getEscrowNote(escrow, view, releaseLabel);

  return (
    <CanonicalSection title={isSeller ? "Seller funds" : "Order protection"}>
      <CanonicalCard variant="list" className="w-full">
        <CanonicalMenuRow
          title="Status"
          value={STATE_LABELS[escrow.state]}
          showChevron={false}
        />
        {escrow.amount > 0 && isSeller ? (
          <CanonicalMenuRow
            title="Amount"
            value={`£${escrow.amount.toFixed(2)}`}
            showChevron={false}
          />
        ) : null}
        {escrow.state === "pending" && releaseLabel ? (
          <CanonicalMenuRow title="Release" value={releaseLabel} showChevron={false} />
        ) : null}
      </CanonicalCard>
      {note ? (
        <CanonicalInfoBlock variant="description" className="mt-ds-2">
          <p>{note}</p>
        </CanonicalInfoBlock>
      ) : null}
    </CanonicalSection>
  );
}
