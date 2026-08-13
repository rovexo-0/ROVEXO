"use client";

import { useState } from "react";
import {
  CanonicalButton,
  CanonicalInfoBlock,
  CanonicalMenuRow,
} from "@/src/components/canonical";
import { ModalContainer } from "@/components/ui/ModalContainer";
import { BanLineIcon } from "@/components/icons/RvxLineIcons";
import {
  BUYER_CANCELLATION_REASON_OPTIONS,
  type BuyerCancellationReasonId,
} from "@/lib/orders/cancellation";
import { formatCurrency } from "@/lib/wallet/utils";
import type { Order } from "@/lib/orders/types";
import "@/styles/rovexo/buyer-cancel-order-v1.css";
import "@/styles/rovexo/order-detail-action-cards-v1.css";

type BuyerCancelOrderCardProps = {
  order: Order;
  canCancel: boolean;
  disabledReason?: string;
  onCancelled: (order: Order) => void;
};

type CancelStep = "closed" | "reason" | "confirm";

/**
 * Compact Cancel order action card (IMAGE 2) + existing reason/confirm flow.
 */
export function BuyerCancelOrderCard({
  order,
  canCancel,
  disabledReason,
  onCancelled,
}: BuyerCancelOrderCardProps) {
  const [step, setStep] = useState<CancelStep>("closed");
  const [reasonId, setReasonId] = useState<BuyerCancellationReasonId | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canCancel || order.status === "cancelled") {
    return null;
  }

  const refundAmount = order.paidAt ? order.totals.total : 0;
  const modalOpen = step === "reason" || step === "confirm";
  const blocked = Boolean(disabledReason);

  function closeFlow() {
    if (isSubmitting) return;
    setStep("closed");
    setReasonId(null);
    setError(null);
  }

  async function submitCancel() {
    if (!reasonId) {
      setError("Select a reason to continue.");
      setStep("reason");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          cancellationReasonId: reasonId,
        }),
      });

      const payload = (await response.json()) as { order?: Order; error?: string };
      if (!response.ok || !payload.order) {
        throw new Error(payload.error ?? "Unable to cancel order.");
      }

      setStep("closed");
      setReasonId(null);
      onCancelled(payload.order);
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Unable to cancel order.");
      setStep("confirm");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="w-full" data-buyer-cancel-order="v1.0">
        <div
          className="order-detail-action-card order-detail-action-card--cancel"
          data-order-detail-action="cancel"
        >
          <CanonicalMenuRow
            title="Cancel order"
            description="Cancel your purchase before the seller ships the item."
            icon={<BanLineIcon />}
            destructive
            disabled={blocked || isSubmitting}
            onClick={() => {
              if (blocked) return;
              setError(null);
              setStep("reason");
            }}
          />
        </div>
        {disabledReason ? (
          <p className="order-detail-action-blocked">{disabledReason}</p>
        ) : null}
      </div>

      <ModalContainer
        open={modalOpen}
        onClose={closeFlow}
        variant="sheet"
        zIndex={140}
        ariaLabel="Cancel order"
        panelClassName="buyer-cancel-order__panel"
      >
        <div className="buyer-cancel-order__sheet" data-buyer-cancel-flow="v1.0">
          <header className="buyer-cancel-order__header">
            <h2 className="buyer-cancel-order__title">Cancel order</h2>
          </header>

          {step === "reason" ? (
            <div className="buyer-cancel-order__body">
              <p className="buyer-cancel-order__question">Why do you want to cancel?</p>
              <ul className="buyer-cancel-order__reasons" role="listbox" aria-label="Cancellation reason">
                {BUYER_CANCELLATION_REASON_OPTIONS.map((option) => {
                  const selected = reasonId === option.id;
                  return (
                    <li key={option.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={
                          selected
                            ? "buyer-cancel-order__reason buyer-cancel-order__reason--selected"
                            : "buyer-cancel-order__reason"
                        }
                        onClick={() => {
                          setReasonId(option.id);
                          setError(null);
                        }}
                      >
                        {option.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {error ? <CanonicalInfoBlock variant="error">{error}</CanonicalInfoBlock> : null}
              <div className="buyer-cancel-order__actions">
                <CanonicalButton
                  fullWidth
                  disabled={!reasonId}
                  onClick={() => {
                    if (!reasonId) {
                      setError("Select a reason to continue.");
                      return;
                    }
                    setError(null);
                    setStep("confirm");
                  }}
                >
                  Continue
                </CanonicalButton>
                <CanonicalButton variant="outline" fullWidth onClick={closeFlow}>
                  Go back
                </CanonicalButton>
              </div>
            </div>
          ) : null}

          {step === "confirm" ? (
            <div className="buyer-cancel-order__body">
              <p className="buyer-cancel-order__question">Cancel this order?</p>
              {refundAmount > 0 ? (
                <div className="buyer-cancel-order__refund">
                  <p className="buyer-cancel-order__refund-label">You will receive a refund of</p>
                  <p className="buyer-cancel-order__refund-amount">{formatCurrency(refundAmount)}</p>
                  <p className="buyer-cancel-order__refund-note">
                    Your payment will be refunded according to the order&apos;s cancellation terms.
                  </p>
                </div>
              ) : (
                <p className="buyer-cancel-order__refund-note">
                  No payment was taken for this order.
                </p>
              )}
              {error ? <CanonicalInfoBlock variant="error">{error}</CanonicalInfoBlock> : null}
              <div className="buyer-cancel-order__actions">
                <CanonicalButton
                  variant="danger"
                  fullWidth
                  loading={isSubmitting}
                  disabled={isSubmitting || !reasonId}
                  onClick={() => void submitCancel()}
                >
                  Cancel order
                </CanonicalButton>
                <CanonicalButton
                  variant="outline"
                  fullWidth
                  disabled={isSubmitting}
                  onClick={() => {
                    setError(null);
                    setStep("closed");
                    setReasonId(null);
                  }}
                >
                  Keep order
                </CanonicalButton>
              </div>
            </div>
          ) : null}
        </div>
      </ModalContainer>
    </>
  );
}
