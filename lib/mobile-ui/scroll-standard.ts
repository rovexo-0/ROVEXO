/**
 * ROVEXO Mobile Scroll Standard v1 — shared class tokens (SSOT).
 * Pair with styles/rovexo/mobile-scroll-v1.css
 */

/** Document-level page shell inside BetaAppShell / rx-page */
export const RX_PAGE = "rx-page";

/** Scrollable page main — document scroll, safe-area + bottom-nav clearance */
export const RX_SCROLL_PAGE = "rx-scroll-page";

/** Bottom sheet / dialog shell (fixed overlay) */
export const RX_MODAL_SHELL = "rx-modal-shell";

/** Scrollable panel inside a modal shell */
export const RX_MODAL_PANEL = "rx-modal-shell__panel";

/** Full-screen overlay with inner scroll body (Search, Sell pickers) */
export const RX_MODAL_FULLSCREEN = "rx-modal-shell-fullscreen";

/** Scrollable body region inside fullscreen overlay */
export const RX_MODAL_BODY = "rx-modal-shell-fullscreen__body";

export const RX_MODAL_CENTERED = "rx-modal-shell-centered";

export const RX_MODAL_LIGHTBOX = "rx-modal-shell-lightbox";

/** Sticky footer inside scrollable pages (Sell publish bar, checkout) */
export const RX_SCROLL_FOOTER = "rx-scroll-footer";

export const RX_SCROLL_PAGE_WITH_NAV = "rx-scroll-page--with-nav";

export const RX_SCROLL_PAGE_NO_NAV = "rx-scroll-page--no-nav";

/** Canonical bottom clearance — matches --bottom-nav-shell-height in globals.css */
export const BOTTOM_NAV_CLEARANCE = "var(--bottom-nav-shell-height, 52px)";

export const SAFE_AREA_BOTTOM = "env(safe-area-inset-bottom, 0px)";

export const SAFE_AREA_TOP = "env(safe-area-inset-top, 0px)";
