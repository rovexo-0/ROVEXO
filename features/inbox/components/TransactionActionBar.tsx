"use client";

/**
 * ROVEXO v1.0 — Dynamic Transaction Action Bar
 * Canonical Negotiation UI: lives above the composer (footer).
 * Pre-order reuses TransactionHubBottomActions.
 * Post-order renders status panel + max two buttons from buildDynamicActions.
 */

import { AccountIcon } from "@/components/account/AccountIcons";
import { TransactionHubBottomActions } from "@/features/transaction-hub/TransactionHubBottomActions";
import { cn } from "@/lib/cn";
import type {
  ConversationActionBarPanel,
  ConversationDynamicAction,
} from "@/lib/inbox/conversation-view";
import type { ConversationProduct, SenderRole } from "@/lib/messages/types";

type PendingOffer = {
  id: string;
  amount: number;
  fromRole: SenderRole;
  parentOfferId?: string | null;
};
type AcceptedOffer = { id: string; amount: number };
type TerminalOffer = { id: string; amount: number; state: "declined" | "expired" };

export type TransactionActionBarProps = {
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
  /** True once an order exists — never fall back to Buy Now sticky. */
  hasOrder: boolean;
  /** Post-order sticky actions (max 2). Empty → pre-order branch when no panel. */
  dynamicActions: ConversationDynamicAction[];
  actionBarPanel: ConversationActionBarPanel | null;
  actionBusy: string | null;
  onAction: (actionId: string) => void;
  /** Checkout capture — Action Bar hidden (MES state 6). */
  hidden?: boolean;
  /** Dev-only in-memory fixture — never mutates live offers/checkout. */
  demoMode?: boolean;
  /** Called after Make Offer succeeds so the hub can refresh offers without remount. */
  onOfferSent?: () => void;
  /** False until order/offers resolve — suppresses incorrect OUT OF STOCK first paint. */
  relatedReady?: boolean;
};

export function TransactionActionBar({
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
  hasOrder,
  dynamicActions,
  actionBarPanel,
  actionBusy,
  onAction,
  hidden = false,
  demoMode = false,
  onOfferSent,
  relatedReady = true,
}: TransactionActionBarProps) {
  if (hidden) return null;

  const showPostOrder =
    hasOrder || Boolean(actionBarPanel) || dynamicActions.length > 0;

  /* Offer Accepted presentation is Transaction Status Card only — no footer duplicate. */
  if (!showPostOrder && acceptedOffer) {
    return null;
  }

  if (!showPostOrder) {
    /* Until related order/offers resolve, never paint OUT OF STOCK for sold listings. */
    if (!relatedReady && product.status === "sold") {
      return null;
    }
    return (
      <div className="conv-hub__hub-actions" data-transaction-action-bar="v1.1">
        <TransactionHubBottomActions
          conversationId={conversationId}
          viewerRole={viewerRole}
          product={product}
          acceptedOffer={acceptedOffer}
          pendingOffer={pendingOffer}
          terminalOffer={terminalOffer}
          onCancelOffer={onCancelOffer}
          onAcceptOffer={onAcceptOffer}
          onDeclineOffer={onDeclineOffer}
          onCounterOffer={onCounterOffer}
          actionBusy={actionBusy}
          outOfStock={relatedReady && product.status === "sold" && !hasOrder}
          demoMode={demoMode}
          onOfferSent={onOfferSent}
        />
      </div>
    );
  }

  if (!actionBarPanel && dynamicActions.length === 0) {
    return null;
  }

  return (
    <div className="conv-hub__order-actions" data-transaction-action-bar="v1.1">
      {actionBarPanel ? (
        <div
          className={cn(
            "conv-hub__action-panel",
            `conv-hub__action-panel--${actionBarPanel.tone}`,
          )}
          role="status"
        >
          <span className="conv-hub__action-panel-icon" aria-hidden>
            <AccountIcon name="shipping" className="conv-hub__action-panel-icon-svg" />
          </span>
          <div className="conv-hub__action-panel-copy">
            <p className="conv-hub__action-panel-title">{actionBarPanel.title}</p>
            {actionBarPanel.subtitle ? (
              <p className="conv-hub__action-panel-sub">{actionBarPanel.subtitle}</p>
            ) : null}
            {actionBarPanel.meta ? (
              <p className="conv-hub__action-panel-meta">{actionBarPanel.meta}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {dynamicActions.slice(0, 2).map((action, index) => {
        const isPrimary = action.primary === true || (action.primary !== false && index === 0);
        return (
          <button
            key={action.id}
            type="button"
            className={cn(
              "conv-hub__order-action",
              isPrimary && "conv-hub__order-action--primary",
            )}
            disabled={actionBusy === action.id}
            onClick={() => onAction(action.id)}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
