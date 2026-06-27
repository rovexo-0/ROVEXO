/**
 * ROVEXO v1.0 — Design System token references for programmatic use.
 * All visual values live in styles/tokens.css as CSS variables.
 */
export const designTokens = {
  color: {
    primary: "var(--ds-color-primary)",
    accent: "var(--ds-color-accent)",
    secondary: "var(--ds-color-secondary)",
    success: "var(--ds-color-success)",
    warning: "var(--ds-color-warning)",
    danger: "var(--ds-color-danger)",
    background: "var(--ds-color-background)",
    surface: "var(--ds-color-surface)",
    surfaceMuted: "var(--ds-color-surface-muted)",
    border: "var(--ds-color-border)",
    textPrimary: "var(--ds-color-text-primary)",
    textSecondary: "var(--ds-color-text-secondary)",
    textMuted: "var(--ds-color-text-muted)",
  },
  typography: {
    display: "text-display",
    heading: "text-heading",
    title: "text-title",
    subtitle: "text-subtitle",
    body: "text-body",
    caption: "text-caption",
  },
  space: {
    1: "var(--ds-space-1)",
    2: "var(--ds-space-2)",
    3: "var(--ds-space-3)",
    4: "var(--ds-space-4)",
    5: "var(--ds-space-5)",
    6: "var(--ds-space-6)",
    7: "var(--ds-space-7)",
    8: "var(--ds-space-8)",
    9: "var(--ds-space-9)",
  },
  radius: {
    sm: "var(--ds-radius-sm)",
    md: "var(--ds-radius-md)",
    lg: "var(--ds-radius-lg)",
    xl: "var(--ds-radius-xl)",
    "2xl": "var(--ds-radius-2xl)",
    full: "var(--ds-radius-full)",
  },
  shadow: {
    soft: "var(--ds-shadow-soft)",
    medium: "var(--ds-shadow-medium)",
    floating: "var(--ds-shadow-floating)",
    premium: "var(--ds-shadow-premium)",
  },
  duration: {
    fast: "var(--ds-duration-fast)",
    normal: "var(--ds-duration-normal)",
    slow: "var(--ds-duration-slow)",
  },
} as const;

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const shadowSoft = "shadow-ds-soft";
export const shadowMedium = "shadow-ds-medium";
export const shadowFloating = "shadow-ds-floating";
export const shadowPremium = "shadow-ds-premium";
export const shadowMediumHover = "hover:shadow-ds-medium";

export const transitionFast = "transition-all duration-ds-fast ease-ds";
export const transitionNormal = "transition-all duration-ds-normal ease-ds";
export const transitionSlow = "transition-all duration-ds-slow ease-ds";
export const transitionSpring =
  "transition-transform duration-ds-fast ease-ds-spring will-change-transform";
export const rxPageHeader = "rx-page-header sticky top-0 z-50";
export const rxFormSection = "rx-form-section";
export const rxInput = "rx-input";
export const rxFooterBar = "rx-footer-bar";
export const rxChip = "rx-chip";
export const rxSurfacePanel = "rx-panel";

/** @deprecated Use rxPageHeader */
export const premiumPageHeader = rxPageHeader;
/** @deprecated Use rxFormSection */
export const premiumFormSection = rxFormSection;
/** @deprecated Use rxInput */
export const premiumInput = rxInput;
/** @deprecated Use rxFooterBar */
export const premiumFooterBar = rxFooterBar;
/** @deprecated Use rxChip */
export const premiumChip = rxChip;
/** @deprecated Use rxSurfacePanel */
export const premiumSurfacePanel = rxSurfacePanel;
