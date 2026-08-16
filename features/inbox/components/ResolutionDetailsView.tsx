"use client";

/**
 * Resolution / Dispute Details — presentation only.
 * Separate from Order Details. Reuses canonical rows.
 * Seller compact is the same component — no parallel view.
 */

import { useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  validatePartialRefundAmount,
  type CanonicalResolutionActionId,
} from "@/lib/inbox/canonical-buyer-seller-resolution-v1";
import type { ResolutionDetailsModel } from "@/lib/inbox/resolution-details-v1";
import {
  CanonicalCard,
  CanonicalInput,
  CanonicalMenuRow,
  CanonicalSection,
} from "@/src/components/canonical";

export function ResolutionDetailsView({
  model,
  onAction,
}: {
  model: ResolutionDetailsModel;
  onAction?: (actionId: CanonicalResolutionActionId, amount?: number) => void;
}) {
  const [partialRefundOpen, setPartialRefundOpen] = useState(false);
  const [partialRefundAmount, setPartialRefundAmount] = useState("");
  const [partialRefundError, setPartialRefundError] = useState<string | null>(null);
  const actions =
    model.sellerActions.length > 0 ? model.sellerActions : model.buyerOfferActions;
  const showBuyerEvidence = model.evidenceUrls.length > 0;
  const showSellerEvidence = model.sellerEvidenceUrls.length > 0;
  const rows = (
    <>
      <CanonicalMenuRow
        title={model.statusTitle}
        description={model.statusDescription}
        showChevron={false}
      />
      {model.reason ? (
        <CanonicalMenuRow
          title={model.reason.label}
          value={model.reason.value}
          showChevron={false}
        />
      ) : null}
      {model.description ? (
        <CanonicalMenuRow
          title={model.description.label}
          description={model.description.value}
          showChevron={false}
        />
      ) : null}
      {model.orderReference ? (
        <CanonicalMenuRow
          title={model.orderReference.label}
          value={model.orderReference.value}
          showChevron={false}
        />
      ) : null}
      {model.tracking ? (
        <CanonicalMenuRow
          title={model.tracking.label}
          description={model.tracking.value}
          showChevron={false}
        />
      ) : null}
      {model.dispute ? (
        <CanonicalMenuRow
          title={model.dispute.label}
          value={model.dispute.value}
          showChevron={false}
        />
      ) : null}
      {model.resolution ? (
        <CanonicalMenuRow
          title={model.resolution.label}
          value={model.resolution.value}
          showChevron={false}
        />
      ) : null}
      {model.nextStep ? (
        <CanonicalMenuRow
          title={model.nextStep.label}
          description={model.nextStep.value}
          showChevron={false}
        />
      ) : null}
      {model.returnStatus ? (
        <CanonicalMenuRow
          title={model.returnStatus.label}
          value={model.returnStatus.value}
          showChevron={false}
        />
      ) : null}
      {model.refundStatus ? (
        <CanonicalMenuRow
          title={model.refundStatus.label}
          value={model.refundStatus.value}
          showChevron={false}
        />
      ) : null}
      {model.sellerFinancials ? (
        <>
          <CanonicalMenuRow
            title={model.sellerFinancials.sellingPrice.label}
            value={model.sellerFinancials.sellingPrice.value}
            showChevron={false}
          />
          <CanonicalMenuRow
            title={model.sellerFinancials.receivable.label}
            value={model.sellerFinancials.receivable.value}
            showChevron={false}
          />
          <CanonicalMenuRow
            title={model.sellerFinancials.payout.label}
            value={model.sellerFinancials.payout.value}
            showChevron={false}
          />
        </>
      ) : null}
      {model.proposedRefund ? (
        <CanonicalMenuRow
          title={model.proposedRefund.label}
          value={model.proposedRefund.value}
          showChevron={false}
        />
      ) : null}
    </>
  );

  return (
    <div
      className={
        model.compactSeller
          ? "ac-canonical conv-hub__resolution-details conv-hub__resolution-details--seller-compact"
          : "ac-canonical flex w-full flex-col gap-ds-4"
      }
      data-resolution-details-view="v1.0"
      data-resolution-details-seller={model.compactSeller ? "compact" : undefined}
    >
      {model.compactSeller ? (
        <CanonicalCard variant="list">
          {rows}
        </CanonicalCard>
      ) : (
        <CanonicalSection title={model.statusTitle}>
          <CanonicalCard variant="list">{rows}</CanonicalCard>
        </CanonicalSection>
      )}

      {showBuyerEvidence ? (
        <CanonicalSection title={model.evidenceLabel}>
          <div className="conv-hub__resolution-evidence" data-resolution-evidence="v1.0">
            {model.evidenceUrls.map((src, index) => (
              <SafeImage
                key={`${src}:${index}`}
                src={src}
                alt={`${model.evidenceLabel} ${index + 1}`}
                width={96}
                height={96}
                className="conv-hub__resolution-evidence-image"
                unoptimized={src.startsWith("data:")}
              />
            ))}
          </div>
        </CanonicalSection>
      ) : null}

      {showSellerEvidence ? (
        <CanonicalSection title={model.sellerEvidenceLabel}>
          <div className="conv-hub__resolution-evidence" data-seller-resolution-evidence="v1.0">
            {model.sellerEvidenceUrls.map((src, index) => (
              <SafeImage
                key={`${src}:${index}`}
                src={src}
                alt={`${model.sellerEvidenceLabel} ${index + 1}`}
                width={96}
                height={96}
                className="conv-hub__resolution-evidence-image"
                unoptimized={src.startsWith("data:")}
              />
            ))}
          </div>
        </CanonicalSection>
      ) : null}

      {partialRefundOpen ? (
        <form
          className="conv-hub__resolution-partial-refund"
          data-resolution-partial-refund="v1.0"
          onSubmit={(event) => {
            event.preventDefault();
            const amount = Number.parseFloat(partialRefundAmount);
            const check = validatePartialRefundAmount({
              amount,
              eligibleAmount: model.eligibleRefundAmount,
            });
            if (!check.ok) {
              setPartialRefundError("Enter an amount greater than 0 and within the eligible refund.");
              return;
            }
            setPartialRefundError(null);
            setPartialRefundOpen(false);
            onAction?.("propose_partial_refund", amount);
          }}
        >
          <CanonicalInput
            id="seller-partial-refund-amount"
            name="partialRefundAmount"
            label="Amount"
            inputType="price"
            inputMode="decimal"
            value={partialRefundAmount}
            error={partialRefundError ?? undefined}
            onChange={(event) => {
              setPartialRefundAmount(event.target.value);
              setPartialRefundError(null);
            }}
          />
          <div className="conv-hub__resolution-actions conv-hub__resolution-actions--partial">
            <button type="submit" className="conv-hub__resolution-action" data-resolution-action="submit_partial_refund">
              Submit
            </button>
            <button
              type="button"
              className="conv-hub__resolution-action"
              data-resolution-action="cancel_partial_refund"
              onClick={() => {
                setPartialRefundOpen(false);
                setPartialRefundAmount("");
                setPartialRefundError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : actions.length > 0 ? (
        <div className="conv-hub__resolution-actions" data-resolution-actions="v1.0">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="conv-hub__resolution-action"
              data-resolution-action={action.id}
              onClick={() => {
                if (action.id === "propose_partial_refund") {
                  setPartialRefundOpen(true);
                  return;
                }
                onAction?.(action.id);
              }}
            >
              <span>{action.label}</span>
              {action.hint ? <small>{action.hint}</small> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
