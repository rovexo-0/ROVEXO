/**
 * RUN #4 — TEMPORARY Internal UI v1.1 pad preview (DESIGN REVIEW ONLY).
 * Target: 16px L/R on authenticated/internal surfaces.
 * Homepage is LOCKED — never override homepage marketing layout.
 * Master Full Width Contract SSOT remains 24px until Owner approval.
 */
export type Run4InternalPad = 24 | 16;

export const RUN4_STORAGE_ACTIVE = "rovexo_run4_internal_pad_active";
export const RUN4_STORAGE_PAD = "rovexo_run4_internal_pad";
export const RUN4_DATA_ATTR = "data-run4-internal-pad";

/** Routes where RUN #4 must NOT apply (Homepage lock). */
export function isRun4HomepagePath(pathname: string): boolean {
  const p = pathname.split("?")[0] || "/";
  return p === "/" || p === "";
}

export function isRun4LocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

/**
 * Horizontal page padding only. Does not touch homepage selectors.
 * Scoped so homepage marketing CSS is never rewritten.
 */
export function run4InternalPadOverrideCss(pad: Run4InternalPad): string {
  return `
/* RUN #4 Internal UI — pad ${pad}px. Homepage excluded via JS (attr removed on /). */
html[${RUN4_DATA_ATTR}="${pad}"] {
  --fw-pad-x: ${pad}px !important;
  --cds-space-page-x: ${pad}px !important;
  --rx-phone-inset-x: ${pad}px !important;
  --uv1-inner-padding: ${pad}px !important;
  --pcu-page-padding-x: ${pad}px !important;
  --wallet-pad-x: ${pad}px !important;
  --conv-pad-x: ${pad}px !important;
  --inbox-pad-x: ${pad}px !important;
}
html[${RUN4_DATA_ATTR}="${pad}"] .account-canonical:has(.inbox-hub) .account-canonical-header__bar--titled,
html[${RUN4_DATA_ATTR}="${pad}"] .account-canonical:has(.wallet-v2) .account-canonical-header__bar--titled {
  padding-left: max(${pad}px, env(safe-area-inset-left, 0px)) !important;
  padding-right: max(${pad}px, env(safe-area-inset-right, 0px)) !important;
}
html[${RUN4_DATA_ATTR}="${pad}"] .cds-layout__content--account-canonical {
  padding-left: ${pad}px !important;
  padding-right: ${pad}px !important;
}
html[${RUN4_DATA_ATTR}="${pad}"] .cds-layout__content--account-canonical:has(.wallet-v2) {
  padding-left: 0 !important;
  padding-right: 0 !important;
}
html[${RUN4_DATA_ATTR}="${pad}"] .wallet-v2 {
  --wallet-pad-x: ${pad}px !important;
  padding-left: ${pad}px !important;
  padding-right: ${pad}px !important;
}
html[${RUN4_DATA_ATTR}="${pad}"] .cds-layout__header,
html[${RUN4_DATA_ATTR}="${pad}"] .cds-layout--account-canonical > .cds-layout__header {
  padding-left: ${pad}px !important;
  padding-right: ${pad}px !important;
}
html[${RUN4_DATA_ATTR}="${pad}"] .account-settings-sticky-action,
html[${RUN4_DATA_ATTR}="${pad}"] .settings-canonical,
html[${RUN4_DATA_ATTR}="${pad}"] .ac-canonical,
html[${RUN4_DATA_ATTR}="${pad}"] .orders-page,
html[${RUN4_DATA_ATTR}="${pad}"] .inbox-hub,
html[${RUN4_DATA_ATTR}="${pad}"] .conv-hub,
html[${RUN4_DATA_ATTR}="${pad}"] .conversation-hub,
html[${RUN4_DATA_ATTR}="${pad}"] .sell-flow-shell,
html[${RUN4_DATA_ATTR}="${pad}"] [data-sell-page],
html[${RUN4_DATA_ATTR}="${pad}"] .checkout-v1-shell,
html[${RUN4_DATA_ATTR}="${pad}"] [data-checkout],
html[${RUN4_DATA_ATTR}="${pad}"] .favourites-v1,
html[${RUN4_DATA_ATTR}="${pad}"] [data-saved-page],
html[${RUN4_DATA_ATTR}="${pad}"] .product-detail-v1,
html[${RUN4_DATA_ATTR}="${pad}"] [data-listing-detail],
html[${RUN4_DATA_ATTR}="${pad}"] .search-page,
html[${RUN4_DATA_ATTR}="${pad}"] [data-search-page],
html[${RUN4_DATA_ATTR}="${pad}"] [data-app-shell="beta"]:not(.rovexo-page-home) main,
html[${RUN4_DATA_ATTR}="${pad}"] .beta-app-shell:not(.rovexo-page-home) main,
html[${RUN4_DATA_ATTR}="${pad}"] [class*="SearchResult"],
html[${RUN4_DATA_ATTR}="${pad}"] [class*="search-results"],
html[${RUN4_DATA_ATTR}="${pad}"] .product-detail-v1,
html[${RUN4_DATA_ATTR}="${pad}"] [data-listing-detail],
html[${RUN4_DATA_ATTR}="${pad}"] .pd-v1,
html[${RUN4_DATA_ATTR}="${pad}"] [data-pd-v1] {
  padding-left: ${pad}px !important;
  padding-right: ${pad}px !important;
  padding-inline: ${pad}px !important;
}
/* Force token-driven search/phone insets on internal (never homepage) */
html[${RUN4_DATA_ATTR}="${pad}"]:not(:has(.rovexo-page-home)) {
  --rx-phone-inset-x: ${pad}px !important;
  --cds-space-page-x: ${pad}px !important;
  --uv1-inner-padding: ${pad}px !important;
}
html[${RUN4_DATA_ATTR}="${pad}"] .conv-hub,
html[${RUN4_DATA_ATTR}="${pad}"] .conversation-hub {
  --conv-pad-x: ${pad}px !important;
}
/* Preserve vertical / component tokens */
html[${RUN4_DATA_ATTR}="${pad}"] {
  --fw-pad-y: 24px !important;
  --fw-section-gap: 24px !important;
  --fw-component-gap: 24px !important;
  --fw-card-padding: 24px !important;
  --fw-header-height: 64px !important;
  --fw-button-height: 56px !important;
  --fw-button-radius: 16px !important;
}
`;
}
