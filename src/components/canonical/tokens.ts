/**
 * ROVEXO Canonical Design System v1.0 — programmatic tokens.
 * CSS variables live in styles/rovexo/canonical-ds.css.
 */

export const CDS_VERSION = "v1.0" as const;

export const canonicalTokens = {
  version: CDS_VERSION,
  color: {
    primary: "var(--cds-color-primary)",
    primaryHover: "var(--cds-color-primary-hover)",
    primaryForeground: "var(--cds-color-primary-foreground)",
    accent: "var(--cds-color-accent)",
    background: "var(--cds-color-background)",
    surface: "var(--cds-color-surface)",
    surfaceMuted: "var(--cds-color-surface-muted)",
    border: "var(--cds-color-border)",
    divider: "var(--cds-color-divider)",
    textPrimary: "var(--cds-color-text-primary)",
    textSecondary: "var(--cds-color-text-secondary)",
    textMuted: "var(--cds-color-text-muted)",
    info: "var(--cds-color-info)",
    success: "var(--cds-color-success)",
    warning: "var(--cds-color-warning)",
    danger: "var(--cds-color-danger)",
  },
  typography: {
    title: "var(--cds-font-size-title)",
    body: "var(--cds-font-size-body)",
    label: "var(--cds-font-size-label)",
    description: "var(--cds-font-size-description)",
    section: "var(--cds-font-size-section)",
  },
  spacing: {
    pageX: "var(--cds-space-page-x)",
    sectionGap: "var(--cds-space-section-gap)",
    cardPaddingSm: "var(--cds-space-card-padding-sm)",
    cardPaddingMd: "var(--cds-space-card-padding-md)",
    cardPaddingLg: "var(--cds-space-card-padding-lg)",
    safeBottom: "var(--cds-space-safe-bottom)",
    safeTop: "var(--cds-space-safe-top)",
  },
  radius: {
    card: "var(--cds-radius-card)",
    cardLg: "var(--cds-radius-card-lg)",
    input: "var(--cds-radius-input)",
    button: "var(--cds-radius-button)",
    pill: "var(--cds-radius-pill)",
  },
  shadow: {
    card: "var(--cds-shadow-card)",
    modal: "var(--cds-shadow-modal)",
  },
  sizing: {
    touchTarget: "var(--cds-touch-target)",
    headerHeight: "var(--cds-header-height)",
    rowMinHeight: "var(--cds-row-min-height)",
    buttonHeight: "var(--cds-button-height)",
    inputHeight: "var(--cds-input-height)",
    iconSize: "var(--cds-icon-size)",
    iconBox: "var(--cds-icon-box)",
    chevronSize: "var(--cds-chevron-size)",
    pageMaxWidth: "var(--cds-page-max-width)",
  },
  motion: {
    fast: "var(--cds-duration-fast)",
    normal: "var(--cds-duration-normal)",
    ease: "var(--cds-ease)",
  },
} as const;

export type CanonicalCardVariant =
  | "small"
  | "medium"
  | "large"
  | "info"
  | "warning"
  | "success"
  | "danger"
  | "list";

export type CanonicalButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger";

export type CanonicalInputType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "price"
  | "password"
  | "search"
  | "time"
  | "textarea";

export type CanonicalModalVariant =
  | "confirm"
  | "delete"
  | "warning"
  | "success"
  | "information";

export type CanonicalInfoBlockVariant =
  | "info"
  | "success"
  | "error"
  | "warning"
  | "description"
  | "tip";

export type CanonicalSelectorKind =
  | "category"
  | "subcategory"
  | "brand"
  | "model"
  | "colour"
  | "material"
  | "condition"
  | "parcel-size"
  | "country"
  | "region"
  | "currency"
  | "language"
  | "shipping"
  | "payment"
  | "generic";

export type CanonicalSelectorOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type CanonicalSelectorOptionGroup = {
  label: string;
  options: CanonicalSelectorOption[];
};
