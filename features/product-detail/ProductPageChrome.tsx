"use client";

import { memo } from "react";
import { PlatformEmoji } from "@/components/icons/PlatformEmoji";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";
import { usePageBack } from "@/hooks/navigation/usePageBack";
import { ProductListingActionsMenu } from "@/features/product-detail/ProductListingActionsMenu";
import { useProductWatchlist } from "@/features/home/hooks/use-product-watchlist";
import type { ProductStatus } from "@/lib/supabase/types/database";

type ProductPageChromeProps = {
  productId: string;
  productSlug: string;
  productTitle: string;
  productStatus: ProductStatus | string;
  sellerId: string;
  sellerName: string;
  sellerUsername: string | null;
  isOwner: boolean;
};

function IconHeart({ filled }: { filled: boolean }) {
  return (
    <PlatformEmoji
      emoji={filled ? PLATFORM_EMOJI.heart : PLATFORM_EMOJI.heartEmpty}
      size={20}
      className="pd-v1__chrome-heart"
    />
  );
}

/**
 * Product Page chrome ON the gallery image (View Item v2.0 mockup).
 * ← Back (left) · ♥ save (buyers) · ••• menu (right).
 * No logo. No extra header.
 */
export const ProductPageChrome = memo(function ProductPageChrome({
  productId,
  productSlug,
  productTitle,
  productStatus,
  sellerId,
  sellerName,
  sellerUsername,
  isOwner,
}: ProductPageChromeProps) {
  const back = usePageBack({ backHref: "/", preferHistory: true, backLabel: "Back" });
  const { isSaved, toggle, isPending } = useProductWatchlist(productSlug);

  return (
    <div className="pd-v1__chrome" data-pd-chrome="v2" data-listing-owner={isOwner ? "true" : "false"}>
      <button
        type="button"
        className="pd-v1__chrome-btn pd-v1__chrome-btn--back"
        aria-label={back.label}
        onClick={back.goBack}
      >
        <PlatformEmoji emoji={PLATFORM_EMOJI.back} size={24} className="pd-v1__chrome-back" />
      </button>
      <div className="pd-v1__chrome-actions">
        {!isOwner ? (
          <button
            type="button"
            className="pd-v1__chrome-btn pd-v1__chrome-save"
            data-active={isSaved ? "true" : "false"}
            aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={isSaved}
            disabled={isPending}
            onClick={() => {
              void toggle();
            }}
          >
            <IconHeart filled={isSaved} />
          </button>
        ) : null}
        <ProductListingActionsMenu
          isOwner={isOwner}
          listingId={productId}
          listingSlug={productSlug}
          listingTitle={productTitle}
          listingStatus={productStatus}
          sellerId={sellerId}
          sellerName={sellerName}
          sellerUsername={sellerUsername}
        />
      </div>
    </div>
  );
});
