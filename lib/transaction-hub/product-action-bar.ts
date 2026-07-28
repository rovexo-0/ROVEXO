/** ROVEXO Product Action Bar — Canonical Freeze (Buy Now + Make Offer ONLY). */

export const PRODUCT_ACTION_BAR_UI_LOCK = true as const;

export const PRODUCT_ACTION_BAR_VERSION = "v1.1-canonical-freeze" as const;

/** Fixed order — Buy Now + Make Offer only. Add to Cart removed forever. */
export const PRODUCT_ACTION_BUTTONS = [
  { id: "buy_now", label: "Buy Now", variant: "primary" as const },
  { id: "make_offer", label: "Make Offer", variant: "offer" as const },
] as const;

export type ProductActionButtonId = (typeof PRODUCT_ACTION_BUTTONS)[number]["id"];

export type ProductActionButtonState = "idle" | "loading" | "success" | "in_cart";

export const PRODUCT_ACTION_BAR_COPY = {
  buyNow: "Buy Now",
  buyNowLoading: "Loading...",
  makeOffer: "Make Offer",
  contactSeller: "Contact Seller",
  /** @deprecated Add to Cart removed forever from Product Page */
  addToCart: "Add to Cart",
  addedToCart: "Added to Cart",
  inCart: "In Cart",
} as const;

/** Responsive engine tokens — no fixed pixel button widths. */
export const PRODUCT_ACTION_BAR_LAYOUT = {
  minTouchTargetPx: 48,
  preferredTouchTargetPx: 52,
  columnCount: 2,
  compactBreakpointPx: 320,
} as const;

/** Absolute Final — solid white bar, no glass/blur. */
export const PRODUCT_ACTION_BAR_VISUAL = {
  backgroundOpacity: 1,
  backdropBlurPx: 0,
  borderColor: "rgba(0, 0, 0, 0.05)",
  shadow: "none",
  pressDurationMs: 100,
  releaseDurationMs: 150,
  stickyEnterDurationMs: 150,
  toastDurationMs: 200,
  iconSizePx: 24,
  buttonRadiusPx: 16,
  buttonHeightPx: 52,
  gapPx: 8,
  padInlinePx: 16,
  fontSizePx: 16,
  fontWeight: 600,
  padBlockPx: 16,
  disabledOpacity: 0.4,
} as const;

export type OfferComposerProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  imageUrl?: string | null;
};
