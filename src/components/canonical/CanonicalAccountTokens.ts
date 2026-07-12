/**
 * ROVEXO My Account — canonical UI tokens (SSOT).
 * Visual values live in styles/rovexo/account-canonical-v2.css.
 * Settings and future modules must use these class names — never invent new menu styles.
 */

export const CANONICAL_ACCOUNT_VERSION = "v1.0-production" as const;

/** Class names copied 1:1 from the My Account hub (`AccountCenterHome`). */
export const canonicalAccountClasses = {
  page: "ac-canonical",
  menu: "ac-canonical__menu",
  section: "ac-canonical__section",
  sectionSystem: "ac-canonical__section--system",
  sectionTitle: "ac-canonical__section-title",
  sectionCard: "ac-canonical__section-card",
  row: "ac-canonical__row",
  rowComingSoon: "ac-canonical__row--coming-soon",
  menuIcon: "ac-canonical__menu-icon",
  menuLucide: "ac-canonical__menu-lucide",
  rowCopy: "ac-canonical__row-copy",
  rowTitle: "ac-canonical__row-title",
  rowTitleDanger: "ac-canonical__row-title--danger",
  rowSubtitle: "ac-canonical__row-subtitle",
  rowBadge: "ac-canonical__row-badge",
  rowTrailingGroup: "ac-canonical__row-trailing-group",
  rowTrailing: "ac-canonical__row-trailing",
  rowChevron: "ac-canonical__row-chevron",
  verifiedPill: "ac-canonical__verified-pill",
  /** Harmonized intro copy — platform-canonical-ui.css */
  intro: "pcu-intro",
} as const;

export const canonicalAccountTokens = {
  version: CANONICAL_ACCOUNT_VERSION,
  rowMinHeight: "48px",
  rowPaddingX: "14px",
  rowGap: "10px",
  sectionGap: "6px",
  sectionTitleSize: "0.6875rem",
  sectionTitleWeight: "600",
  sectionTitleTracking: "0.06em",
  sectionTitleColor: "#94a3b8",
  rowTitleSize: "0.9375rem",
  rowTitleWeight: "500",
  rowTitleColor: "#111111",
  rowSubtitleSize: "0.75rem",
  rowSubtitleColor: "#94a3b8",
  iconBox: "22px",
  iconSize: "20px",
  chevronSize: "16px",
  chevronColor: "#cbd5e1",
  cardRadius: "14px",
  cardBorder: "rgb(15 23 42 / 0.08)",
  cardShadow: "0 1px 6px rgb(15 23 42 / 0.04)",
  divider: "rgb(15 23 42 / 0.06)",
  pagePaddingX: "16px",
  pagePaddingTop: "8px",
  menuMarginTop: "10px",
} as const;

export type CanonicalAccountClasses = typeof canonicalAccountClasses;
export type CanonicalAccountTokens = typeof canonicalAccountTokens;
