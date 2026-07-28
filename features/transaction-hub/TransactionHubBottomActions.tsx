"use client";

/**
 * ROVEXO Canonical Negotiation — Dynamic Action Card (pre-order).
 * UI visibility only. Reuses Make Offer / offer PATCH callers from hub.
 * Offer Accepted + BUY NOW live only on Transaction Status Card — never duplicate here.
 */

import { parseOfferAmount, sanitizeOfferInput } from "@/lib/transaction-hub/make-offer-freeze-v1";
import { formatCurrency } from "@/lib/wallet/utils";
import { resolveChatBottomActions } from "@/lib/transaction-hub/chat-actions";
import { MakeOfferSheet } from "@/features/transaction-hub/MakeOfferSheet";
import type { ConversationProduct, SenderRole } from "@/lib/messages/types";
import { useMemo, useState } from "react";

type PendingOffer = {
  id: string;
  amount: number;
  fromRole: SenderRole;
  parentOfferId?: string | null;
};

type AcceptedOffer = {
  id: string;
  amount: number;
};

type TerminalOffer = {
  id: string;
  amount: number;
  state: "declined" | "expired";
};

type TransactionHubBottomActionsProps = {
  conversationId: string;
  viewerRole: SenderRole;
  product: ConversationProduct;
  acceptedOffer?: AcceptedOffer | null;
  pendingOffer?: PendingOffer | null;
  terminalOffer?: TerminalOffer | null;
  onCancelOffer?: (offerId: string) => void;
  onAcceptOffer?: (offerId: string) => void;
  onDeclineOffer?: (offerId: string) => void;
  onCounterOffer?: (offerId: string, amount: number) => void;
  actionBusy?: string | null;
  outOfStock?: boolean;
  /** Dev-only in-memory fixture — never calls Buy Now checkout APIs. */
  demoMode?: boolean;
  /** Refresh hub offers / badges after a new offer is created. */
  onOfferSent?: () => void;
};

export function TransactionHubBottomActions({
  conversationId,
  viewerRole,
  product,
  acceptedOffer = null,
  pendingOffer = null,
  terminalOffer = null,
  onCancelOffer,
  onAcceptOffer,
  onDeclineOffer,
  onCounterOffer,
  actionBusy = null,
  outOfStock = false,
  demoMode: _demoMode = false,
  onOfferSent,
}: TransactionHubBottomActionsProps) {
  void _demoMode;
  const [offerOpen, setOfferOpen] = useState(false);
  const [busy, setBusy] = useState<"cancel" | null>(null);
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");

  const hasAcceptedOffer = acceptedOffer != null;
  /* Parent owns sold vs order-loading truth — never flash OUT OF STOCK while Hub hydrates. */
  const listingOutOfStock = outOfStock;

  const actions = useMemo(
    () =>
      resolveChatBottomActions({
        viewerRole,
        product,
        hasAcceptedOffer,
      }),
    [hasAcceptedOffer, product, viewerRole],
  );

  const makeOfferSheet = (
    <MakeOfferSheet
      open={offerOpen}
      onClose={() => setOfferOpen(false)}
      conversationId={conversationId}
      product={product}
      onOfferSent={() => {
        onOfferSent?.();
      }}
    />
  );

  if (listingOutOfStock && !hasAcceptedOffer) {
    return (
      <div
        className="thub-v1__actions thub-v1__actions--card"
        data-transaction-hub-version="v1.0"
        data-offer-action="out_of_stock"
      >
        <button type="button" className="thub-v1__btn thub-v1__btn--disabled" disabled>
          OUT OF STOCK
        </button>
      </div>
    );
  }

  /* Canonical Offer Accepted + BUY NOW = Transaction Status Card only. */
  if (hasAcceptedOffer) {
    return null;
  }

  if (pendingOffer) {
    const awaitingOther = pendingOffer.fromRole === viewerRole;
    const canRespond = pendingOffer.fromRole !== viewerRole;
    const isCounter = Boolean(pendingOffer.parentOfferId) || pendingOffer.fromRole === "seller";

    if (viewerRole === "seller" && awaitingOther) {
      return (
        <div
          className="thub-v1__actions thub-v1__actions--card thub-v1__actions--pending"
          data-offer-action="seller_waiting"
        >
          <div className="thub-v1__status-row">
            <p className="thub-v1__status-title">Offer Pending</p>
            <p className="thub-v1__status-amount">{formatCurrency(pendingOffer.amount)}</p>
          </div>
        </div>
      );
    }

    if (viewerRole === "buyer" && awaitingOther) {
      return (
        <div
          className="thub-v1__actions thub-v1__actions--card thub-v1__actions--pending"
          data-offer-action="buyer_pending"
        >
          <div className="thub-v1__status-row">
            <p className="thub-v1__status-title">Offer Pending</p>
            <p className="thub-v1__status-amount">{formatCurrency(pendingOffer.amount)}</p>
          </div>
          <button
            type="button"
            className="thub-v1__btn thub-v1__btn--secondary thub-v1__btn--full thub-v1__btn--cancel"
            disabled={busy !== null || Boolean(actionBusy)}
            onClick={() => {
              setBusy("cancel");
              onCancelOffer?.(pendingOffer.id);
              setBusy(null);
            }}
          >
            Cancel Offer
          </button>
        </div>
      );
    }

    if (canRespond) {
      return (
        <div
          className={cnOfferPanel(isCounter)}
          data-offer-action={isCounter ? "seller_counter" : "buyer_offer"}
        >
          <div className="thub-v1__status-row">
            <p className="thub-v1__status-title">{isCounter ? "Counter Offer" : "Offer Pending"}</p>
            <p className="thub-v1__status-amount">{formatCurrency(pendingOffer.amount)}</p>
          </div>
          {counterOpen ? (
            <div className="thub-v1__counter-row">
              <input
                className="thub-v1__counter-input"
                inputMode="decimal"
                placeholder="Counter amount"
                aria-label="Counter offer amount"
                value={counterAmount}
                disabled={Boolean(actionBusy)}
                onChange={(event) => setCounterAmount(sanitizeOfferInput(event.target.value))}
              />
              <button
                type="button"
                className="thub-v1__btn thub-v1__btn--secondary"
                disabled={Boolean(actionBusy)}
                onClick={() => {
                  const amount = parseOfferAmount(counterAmount);
                  if (amount == null) return;
                  onCounterOffer?.(pendingOffer.id, amount);
                  setCounterOpen(false);
                  setCounterAmount("");
                }}
              >
                Send
              </button>
            </div>
          ) : (
            <div className="thub-v1__btn-row thub-v1__btn-row--triple">
              <button
                type="button"
                className="thub-v1__btn thub-v1__btn--primary"
                disabled={Boolean(actionBusy)}
                onClick={() => onAcceptOffer?.(pendingOffer.id)}
              >
                Accept
              </button>
              <button
                type="button"
                className="thub-v1__btn thub-v1__btn--secondary"
                disabled={Boolean(actionBusy)}
                onClick={() => setCounterOpen(true)}
              >
                Counter
              </button>
              <button
                type="button"
                className="thub-v1__btn thub-v1__btn--danger"
                disabled={Boolean(actionBusy)}
                onClick={() => onDeclineOffer?.(pendingOffer.id)}
              >
                Decline
              </button>
            </div>
          )}
        </div>
      );
    }
  }

  if (terminalOffer && viewerRole === "buyer" && actions.makeOffer) {
    /** Declined → conversation only (mockup). Expired → Make New Offer. */
    if (terminalOffer.state === "declined") {
      return null;
    }
    return (
      <>
        <div
          className="thub-v1__actions thub-v1__actions--card thub-v1__actions--expired"
          data-offer-action="expired"
        >
          <div className="thub-v1__status-row">
            <p className="thub-v1__status-title">Offer Expired</p>
            <p className="thub-v1__status-amount">{formatCurrency(terminalOffer.amount)}</p>
          </div>
          <button
            type="button"
            className="thub-v1__btn thub-v1__btn--secondary thub-v1__btn--full"
            onClick={() => setOfferOpen(true)}
          >
            Make New Offer
          </button>
        </div>
        {makeOfferSheet}
      </>
    );
  }

  if (viewerRole === "seller") {
    return null;
  }

  if (!actions.makeOffer) {
    return null;
  }

  return (
    <>
      <div className="thub-v1__actions thub-v1__actions--card" data-offer-action="idle">
        <button
          type="button"
          className="thub-v1__btn thub-v1__btn--secondary thub-v1__btn--full"
          disabled={busy !== null}
          onClick={() => setOfferOpen(true)}
        >
          Make Offer
        </button>
      </div>
      {makeOfferSheet}
    </>
  );
}

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function cnOfferPanel(isCounter: boolean): string {
  return cn(
    "thub-v1__actions thub-v1__actions--card",
    isCounter ? "thub-v1__actions--countered" : "thub-v1__actions--pending",
  );
}
