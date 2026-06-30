import type { CSSProperties } from "react";
import type { HomepageComponentStyle, PlatformThemeTokens } from "@/lib/platform-visual/types";

export function componentStyleToInlineStyle(style: HomepageComponentStyle = {}): CSSProperties {
  const css: CSSProperties & Record<string, string | number> = {};

  if (style.width != null) css.width = style.width;
  if (style.height != null) css.height = style.height;
  if (style.minWidth != null) css.minWidth = style.minWidth;
  if (style.maxWidth != null) css.maxWidth = style.maxWidth;
  if (style.padding != null) css.padding = style.padding;
  if (style.margin != null) css.margin = style.margin;
  if (style.gap != null) css.gap = style.gap;
  if (style.borderRadius != null) css.borderRadius = style.borderRadius;
  if (style.opacity != null) css.opacity = style.opacity;
  if (style.rotation != null) css.transform = `rotate(${style.rotation}deg)`;
  if (style.fontSize != null) css.fontSize = style.fontSize;
  if (style.spacing != null) css.rowGap = style.spacing;
  if (style.alignment != null) css.alignItems = style.alignment;
  if (style.columns != null) css["--rx-visual-columns"] = String(style.columns);
  if (style.iconSize != null) css["--rx-visual-icon-size"] = `${style.iconSize}px`;
  if (style.imageSize != null) css["--rx-visual-image-size"] = `${style.imageSize}px`;
  if (style.shadow != null) css.boxShadow = `0 ${style.shadow * 4}px ${style.shadow * 12}px rgba(15, 23, 42, 0.12)`;

  return css;
}

export function themeTokensToCssVars(theme: PlatformThemeTokens): CSSProperties {
  const css: Record<string, string | number> = {};

  if (theme.primary) css["--rx-visual-primary"] = theme.primary;
  if (theme.primaryDeep) css["--rx-visual-primary-deep"] = theme.primaryDeep;
  if (theme.background) css["--rx-visual-background"] = theme.background;
  if (theme.surface) css["--rx-visual-surface"] = theme.surface;
  if (theme.textPrimary) css["--rx-visual-text-primary"] = theme.textPrimary;
  if (theme.textSecondary) css["--rx-visual-text-secondary"] = theme.textSecondary;
  if (theme.radius != null) css["--rx-visual-radius"] = `${theme.radius}px`;
  if (theme.fontScale != null) css["--rx-visual-font-scale"] = theme.fontScale;
  if (theme.shadow != null) css["--rx-visual-shadow-strength"] = theme.shadow;

  return css as CSSProperties;
}
