"use client";

import { useCallback, useMemo, useState } from "react";
import { CanonicalButton } from "@/src/components/canonical";
import { useToast } from "@/components/ui/Toast";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { CheckoutHubSheet } from "@/features/transaction-hub/CheckoutHubSheet";
import { MakeOfferSheet } from "@/features/transaction-hub/MakeOfferSheet";
import type { ConversationProduct, SenderRole } from "@/lib/messages/types";
import { resolveChatBottomActions } from "@/lib/transaction-hub/chat-actions";
import { TRANSACTION_HUB_COPY } from "@/lib/transaction-hub/canonical";
import {
  trackTransactionHubAddToCart,
  trackTransactionHubShareListing,
} from "@/lib/transaction-hub/analytics";
import { addToCartFromHub } from "@/lib/transaction-hub/cart-engine";
import { transactionHubListingHref } from "@/lib/transaction-hub/inbox-routes";
type TransactionHubBottomActionsProps = {
  conversationId: string;
  viewerRole: SenderRole;
  product: ConversationProduct;
};

export function TransactionHubBottomActions({
  conversationId,
  viewerRole,
  product,
}: TransactionHubBottomActionsProps) {
  const { pushToast } = useToast();
  const { refresh: refreshBadges } = useRealtimeNotifications();
  const [offerOpen, setOfferOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [busy, setBusy] = useState<"cart" | null>(null);

  const actions = useMemo(
    () => resolveChatBottomActions({ viewerRole, product }),
    [product, viewerRole],
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
    setCheckoutOpen(true);
  }, []);

  const handleShareListing = useCallback(async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${transactionHubListingHref(product.slug)}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: product.title, url });
        trackTransactionHubShareListing(analyticsContext);
        return;
      }

      await navigator.clipboard.writeText(url);
      trackTransactionHubShareListing(analyticsContext);
      pushToast({
        title: TRANSACTION_HUB_COPY.linkCopied,
        variant: "success",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;

      try {
        await navigator.clipboard.writeText(url);
        pushToast({
          title: TRANSACTION_HUB_COPY.linkCopied,
          variant: "success",
        });
      } catch {
        pushToast({
          title: "Unable to share listing.",
          variant: "error",
        });
      }
    }
  }, [analyticsContext, product.slug, product.title, pushToast]);

  if (viewerRole === "buyer") {
    if (!actions.buyNow && !actions.makeOffer && !actions.addToCart) {
      return null;
    }

    return (
      <>
        <div className="thub-v1__actions" data-transaction-hub-version="v1.0">
          {actions.buyNow ? (
            <CanonicalButton
              fullWidth
              disabled={busy !== null}
              onClick={handleBuyNow}
            >
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

        <CheckoutHubSheet
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          productSlug={product.slug}
          conversationId={conversationId}
        />
      </>
    );
  }

  return (
    <div className="thub-v1__actions thub-v1__actions--seller" data-transaction-hub-version="v1.0">
      <CanonicalButton fullWidth variant="outline" onClick={() => void handleShareListing()}>
        Share Listing
      </CanonicalButton>
    </div>
  );
}
