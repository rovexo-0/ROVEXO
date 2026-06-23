/**
 * ROVEXO Design System — token references for programmatic use.
 * All visual values live in styles/tokens.css as CSS variables.
 */
export const designTokens = {
  color: {
    primary: "var(--ds-color-primary)",
    secondary: "var(--ds-color-secondary)",
    success: "var(--ds-color-success)",
    warning: "var(--ds-color-warning)",
    danger: "var(--ds-color-danger)",
    background: "var(--ds-color-background)",
    surface: "var(--ds-color-surface)",
    border: "var(--ds-color-border)",
    textPrimary: "var(--ds-color-text-primary)",
    textSecondary: "var(--ds-color-text-secondary)",
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
  },
  radius: {
    sm: "var(--ds-radius-sm)",
    md: "var(--ds-radius-md)",
    lg: "var(--ds-radius-lg)",
    xl: "var(--ds-radius-xl)",
    full: "var(--ds-radius-full)",
  },
  shadow: {
    soft: "var(--ds-shadow-soft)",
    medium: "var(--ds-shadow-medium)",
    floating: "var(--ds-shadow-floating)",
  },
  duration: {
    fast: "var(--ds-duration-fast)",
    normal: "var(--ds-duration-normal)",
    slow: "var(--ds-duration-slow)",
  },
} as const;

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const shadowSoft = "shadow-ds-soft";
export const shadowMedium = "shadow-ds-medium";
export const shadowFloating = "shadow-ds-floating";
export const shadowMediumHover = "hover:shadow-ds-medium";

export const transitionFast = "transition-all duration-ds-fast ease-ds";
export const transitionNormal = "transition-all duration-ds-normal ease-ds";
export const transitionSlow = "transition-all duration-ds-slow ease-ds";
export const transitionSpring =
  "transition-transform duration-ds-fast ease-ds-spring will-change-transform";
export const premiumPageHeader = "premium-page-header sticky top-0 z-50";
export const premiumFormSection = "premium-form-section";
export const premiumInput = "premium-input";
export const premiumFooterBar = "premium-footer-bar";
export const premiumChip = "premium-chip";
export const premiumSurfacePanel = "premium-surface-panel";
