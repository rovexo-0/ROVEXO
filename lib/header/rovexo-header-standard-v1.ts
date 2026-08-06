/**
 * ROVEXO HEADER STANDARD v1.0 — SSOT
 *
 * Canonical: Orders page header (Back · Title · Close).
 * Applies to all platform pages except Homepage.
 *
 * STATUS: OWNER AUTHORIZED · PLATFORM-WIDE
 */

export const ROVEXO_HEADER_STANDARD_VERSION = "1.0" as const;
export const ROVEXO_HEADER_STANDARD_STATUS = "ACTIVE" as const;
export const ROVEXO_HEADER_STANDARD_DOM = "rovexo-header-standard-v1" as const;

/** Homepage marketplace header is permanently excluded. */
export const ROVEXO_HEADER_STANDARD_EXCLUDED_ROUTES = ["/"] as const;

export const ROVEXO_HEADER_STANDARD_LAYOUT = {
  left: "back",
  center: "title",
  right: "close",
} as const;

/** Exact Orders header tokens (canonical). */
export const ROVEXO_HEADER_STANDARD_TOKENS = {
  barHeightPx: 48,
  grid: "40px 1fr 48px",
  gapPx: 8,
  backSizePx: 40,
  backRadiusPx: 12,
  backIconPx: 22,
  closeSizePx: 48,
  closeIconPx: 22,
  closeRadiusPx: 999,
  titleFontSizePx: 15,
  titleFontWeight: 600,
  titleLetterSpacing: "-0.02em",
  titleColor: "#1a1a1a",
  iconColor: "#111111",
} as const;

export const ROVEXO_HEADER_STANDARD_CLOSE = {
  ariaLabel: "Close",
  /** history.back() when possible, else fallbackHref */
  behavior: "history-back-or-fallback",
  defaultFallbackHref: "/",
} as const;

export const ROVEXO_HEADER_STANDARD_SSOT = {
  referencePage: "features/orders/components/OrdersPage.tsx",
  referenceCss: "styles/rovexo/orders-page-v1.css",
  sharedClose: "components/navigation/RovexoHeaderCloseButton.tsx",
  sharedCss: "styles/rovexo/rovexo-header-standard-v1.css",
  accountHeader: "features/account-canonical/header/AccountCanonicalHeader.tsx",
  pageHeader: "components/navigation/CanonicalPageHeader.tsx",
} as const;
