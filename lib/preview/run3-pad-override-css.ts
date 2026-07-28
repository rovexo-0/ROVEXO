/**
 * RUN #3 — TEMPORARY UI pad override CSS (DESIGN REVIEW ONLY).
 * Does NOT change Master Full Width Contract / SSOT (remains 24px).
 * Horizontal page padding only.
 */
export type Run3PreviewPad = 24 | 12;

export const RUN3_STORAGE_ACTIVE = "rovexo_run3_preview_active";
export const RUN3_STORAGE_PAD = "rovexo_run3_preview_pad";
export const RUN3_DATA_ATTR = "data-run3-ui-compare";

export function run3PadOverrideCss(pad: Run3PreviewPad): string {
  return `
html[${RUN3_DATA_ATTR}="${pad}"] {
  --fw-pad-x: ${pad}px !important;
  --cds-space-page-x: ${pad}px !important;
  --rx-phone-inset-x: ${pad}px !important;
  --uv1-inner-padding: ${pad}px !important;
  --pcu-page-padding-x: ${pad}px !important;
  --wallet-pad-x: ${pad}px !important;
  --conv-pad-x: ${pad}px !important;
  --inbox-pad-x: ${pad}px !important;
  --ds-space-4: ${pad}px !important;
  --ds-space-5: ${pad}px !important;
}
html[${RUN3_DATA_ATTR}="${pad}"] .account-canonical:has(.inbox-hub) .account-canonical-header__bar--titled,
html[${RUN3_DATA_ATTR}="${pad}"] .account-canonical:has(.wallet-v2) .account-canonical-header__bar--titled {
  padding-left: max(${pad}px, env(safe-area-inset-left, 0px)) !important;
  padding-right: max(${pad}px, env(safe-area-inset-right, 0px)) !important;
}
html[${RUN3_DATA_ATTR}="${pad}"] .cds-layout__content--account-canonical {
  padding-left: ${pad}px !important;
  padding-right: ${pad}px !important;
}
html[${RUN3_DATA_ATTR}="${pad}"] .cds-layout__content--account-canonical:has(.wallet-v2) {
  padding-left: 0 !important;
  padding-right: 0 !important;
}
html[${RUN3_DATA_ATTR}="${pad}"] .wallet-v2 {
  --wallet-pad-x: ${pad}px !important;
  padding-left: ${pad}px !important;
  padding-right: ${pad}px !important;
}
html[${RUN3_DATA_ATTR}="${pad}"] .cds-layout__header,
html[${RUN3_DATA_ATTR}="${pad}"] .cds-layout--account-canonical > .cds-layout__header {
  padding-left: ${pad}px !important;
  padding-right: ${pad}px !important;
}
html[${RUN3_DATA_ATTR}="${pad}"] .account-settings-sticky-action,
html[${RUN3_DATA_ATTR}="${pad}"] .settings-canonical,
html[${RUN3_DATA_ATTR}="${pad}"] .ac-canonical,
html[${RUN3_DATA_ATTR}="${pad}"] .orders-page {
  padding-left: ${pad}px !important;
  padding-right: ${pad}px !important;
}
html[${RUN3_DATA_ATTR}="${pad}"] .rx4-home,
html[${RUN3_DATA_ATTR}="${pad}"] .rovexo-page-home,
html[${RUN3_DATA_ATTR}="${pad}"] main,
html[${RUN3_DATA_ATTR}="${pad}"] .rx4-section,
html[${RUN3_DATA_ATTR}="${pad}"] .rx4-feed,
html[${RUN3_DATA_ATTR}="${pad}"] .rx4-rail,
html[${RUN3_DATA_ATTR}="${pad}"] .canonical-homepage,
html[${RUN3_DATA_ATTR}="${pad}"] .hp-section,
html[${RUN3_DATA_ATTR}="${pad}"] .rx-fs,
html[${RUN3_DATA_ATTR}="${pad}"] [data-home-section],
html[${RUN3_DATA_ATTR}="${pad}"] .rvx-topbar,
html[${RUN3_DATA_ATTR}="${pad}"] .rx-topbar,
html[${RUN3_DATA_ATTR}="${pad}"] header[class*="home"],
html[${RUN3_DATA_ATTR}="${pad}"] .homepage-header,
html[${RUN3_DATA_ATTR}="${pad}"] [class*="Homepage"] {
  padding-left: ${pad}px !important;
  padding-right: ${pad}px !important;
  padding-inline: ${pad}px !important;
}
html[${RUN3_DATA_ATTR}="${pad}"] .conv-hub,
html[${RUN3_DATA_ATTR}="${pad}"] .conversation-hub {
  --conv-pad-x: ${pad}px !important;
  padding-left: ${pad}px !important;
  padding-right: ${pad}px !important;
}
html[${RUN3_DATA_ATTR}="${pad}"] {
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

export function isRun3LocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}
