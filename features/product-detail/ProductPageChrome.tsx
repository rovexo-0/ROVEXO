"use client";

import { usePageBack } from "@/hooks/navigation/usePageBack";
import { ProductReportDialog } from "@/features/product-detail/ProductReportDialog";
import { useProductWatchlist } from "@/features/home/hooks/use-product-watchlist";

type ProductPageChromeProps = {
  productSlug: string;
  productTitle: string;
};

function IconHeart({ filled }: { filled: boolean }) {
  return (
    <svg className="pd-v1__chrome-heart" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 21s-6.7-4.35-9.33-7.6C.5 10.8 1.1 7.05 4.05 5.4 6.2 4.2 8.85 4.75 10.4 6.55L12 8.4l1.6-1.85C15.15 4.75 17.8 4.2 19.95 5.4c2.95 1.65 3.55 5.4 1.38 7.99C18.7 16.65 12 21 12 21Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Product Page chrome ON the gallery image.
 * ← back (left) · ♥ save · ••• menu (right).
 * Save required for RUN #3 LISTING UX certification (same watchlist SSOT as ListingCard).
 */
export function ProductPageChrome({ productSlug, productTitle }: ProductPageChromeProps) {
  const back = usePageBack({ backHref: "/", preferHistory: true, backLabel: "Back" });
  const { isSaved, toggle, isPending } = useProductWatchlist(productSlug);

  return (
    <div className="pd-v1__chrome" data-pd-chrome="v3">
      <button
        type="button"
        className="pd-v1__chrome-btn"
        aria-label={back.label}
        onClick={back.goBack}
      >
        <svg className="pd-v1__chrome-back" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 6 9 12l6 6"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className="pd-v1__chrome-actions">
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
        <ProductReportDialog productSlug={productSlug} productTitle={productTitle} trigger="menu" />
      </div>
    </div>
  );
}
