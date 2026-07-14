"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CanonicalButton } from "@/src/components/canonical";
import { useToast } from "@/components/ui/Toast";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { MakeOfferSheet } from "@/features/transaction-hub/MakeOfferSheet";
import type { ConversationProduct, SenderRole } from "@/lib/messages/types";
import { resolveChatBottomActions } from "@/lib/transaction-hub/chat-actions";
import { TRANSACTION_HUB_COPY } from "@/lib/transaction-hub/canonical";
import { trackTransactionHubAddToCart } from "@/lib/transaction-hub/analytics";
import { addToCartFromHub } from "@/lib/transaction-hub/cart-engine";
import { formatCurrency } from "@/lib/wallet/utils";

type PendingOffer = {
  id: string;
  amount: number;
};

type AcceptedOffer = {
  id: string;
  amount: number;
};

type TransactionHubBottomActionsProps = {
  conversationId: string;
  viewerRole: SenderRole;
  product: ConversationProduct;
  /** Accepted offer — show Buy Now only; hide Make Offer / Add to Cart. */
  acceptedOffer?: AcceptedOffer | null;
  /** Buyer open offer — show pending + cancel instead of make offer. */
  pendingOffer?: PendingOffer | null;
  onCancelOffer?: (offerId: string) => void;
};

export function TransactionHubBottomActions({
  conversationId,
  viewerRole,
  product,
  acceptedOffer = null,
  pendingOffer = null,
  onCancelOffer,
}: TransactionHubBottomActionsProps) {
  const router = useRouter();
  const { pushToast } = useToast();
  const { refresh: refreshBadges } = useRealtimeNotifications();
  const [offerOpen, setOfferOpen] = useState(false);
  const [busy, setBusy] = useState<"cart" | "cancel" | null>(null);

  const hasAcceptedOffer = acceptedOffer != null;

  const actions = useMemo(
    () =>
      resolveChatBottomActions({
        viewerRole,
        product,
        hasAcceptedOffer,
      }),
    [hasAcceptedOffer, product, viewerRole],
  );

  const analyticsContext = useMemo(
    () => ({
      conversationId,
      productSlug: product.slug,
      productId: product.id,
    }),
    [conversationId, product.id, product.slug],
  );

  const handleAddToCart = useCallback(async () => {
    setBusy("cart");
    try {
      const result = await addToCartFromHub(product.slug);

      if (!result.success) {
        pushToast({
          title: result.error,
          variant: "error",
        });
        return;
      }

      trackTransactionHubAddToCart(analyticsContext);
      void refreshBadges();
      pushToast({
        title: TRANSACTION_HUB_COPY.addedToCart,
        variant: "success",
      });
    } finally {
      setBusy(null);
    }
  }, [analyticsContext, product.slug, pushToast, refreshBadges]);

  const handleBuyNow = useCallback(() => {
    const params = new URLSearchParams({
      conversationId,
    });
    if (acceptedOffer?.id) {
      params.set("offerId", acceptedOffer.id);
    }
    router.push(`/checkout/${product.slug}?${params.toString()}`);
  }, [acceptedOffer, conversationId, product.slug, router]);

  const handleCancelOffer = useCallback(async () => {
    if (!pendingOffer || !onCancelOffer) return;
    setBusy("cancel");
    try {
      onCancelOffer(pendingOffer.id);
    } finally {
      setBusy(null);
    }
  }, [onCancelOffer, pendingOffer]);

  if (viewerRole !== "buyer") {
    return null;
  }

  if (hasAcceptedOffer) {
    return (
      <div className="thub-v1__actions" data-transaction-hub-version="v1.0">
        <CanonicalButton fullWidth disabled={busy !== null} onClick={handleBuyNow}>
          Buy Now
          {acceptedOffer ? ` · ${formatCurrency(acceptedOffer.amount)}` : ""}
        </CanonicalButton>
      </div>
    );
  }

  if (pendingOffer) {
    return (
      <div className="thub-v1__actions" data-transaction-hub-version="v1.0">
        <p className="thub-v1__pending-label">Offer Pending</p>
        <p className="thub-v1__pending-amount">{formatCurrency(pendingOffer.amount)}</p>
        <CanonicalButton
          fullWidth
          variant="outline"
          disabled={busy !== null}
          onClick={() => void handleCancelOffer()}
        >
          {busy === "cancel" ? "Cancelling…" : "Cancel Offer"}
        </CanonicalButton>
      </div>
    );
  }

  if (!actions.buyNow && !actions.makeOffer && !actions.addToCart) {
    return null;
  }

  return (
    <>
      <div className="thub-v1__actions" data-transaction-hub-version="v1.0">
        {actions.buyNow ? (
          <CanonicalButton fullWidth disabled={busy !== null} onClick={handleBuyNow}>
            Buy Now
          </CanonicalButton>
        ) : null}
        {actions.makeOffer ? (
          <CanonicalButton
            fullWidth
            variant="outline"
            disabled={busy !== null}
            onClick={() => setOfferOpen(true)}
          >
            Make Offer
          </CanonicalButton>
        ) : null}
        {actions.addToCart ? (
          <button
            type="button"
            className="thub-v1__action-tertiary"
            disabled={busy !== null}
            onClick={() => void handleAddToCart()}
          >
            {busy === "cart" ? "Adding…" : "Add to Cart"}
          </button>
        ) : null}
      </div>

      <MakeOfferSheet
        open={offerOpen}
        onClose={() => setOfferOpen(false)}
        conversationId={conversationId}
        product={product}
      />
    </>
  );
}
