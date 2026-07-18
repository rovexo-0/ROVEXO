import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

/** Absolute Final — one button system: solid, no glass, no gradient glow. */
export const buttonVariants = {
  primary: cn(
    "rx-btn rx-btn--primary bg-primary text-primary-foreground",
    focusRing,
    transitionFast,
  ),
  secondary: cn(
    "rx-btn rx-btn--secondary border border-border bg-surface text-text-primary",
    "hover:bg-surface-muted",
    focusRing,
    transitionFast,
  ),
  outline: cn(
    "rx-btn border border-border bg-surface text-text-primary",
    "hover:border-primary/35",
    focusRing,
    transitionFast,
  ),
  ghost: cn(
    "rx-btn rounded-ds-md text-text-secondary hover:bg-secondary hover:text-primary",
    focusRing,
    transitionFast,
  ),
  success: cn(
    "rx-btn rx-btn--success bg-success text-success-foreground",
    focusRing,
    transitionFast,
  ),
  danger: cn(
    "rx-btn rx-btn--danger bg-danger text-danger-foreground",
    focusRing,
    transitionFast,
  ),
} as const;

export const buttonSizes = {
  sm: "h-10 rounded-ds-sm px-ds-3 text-sm font-semibold",
  md: "h-11 rounded-ds-md px-ds-5 text-sm font-semibold",
  lg: "h-12 rounded-ds-lg px-ds-6 text-base font-semibold",
  canonical: "min-h-[52px] rounded-[14px] px-ds-6 text-base font-semibold",
} as const;

export const iconButtonSizes = {
  sm: "h-10 w-10 rounded-ds-sm",
  md: "h-11 w-11 rounded-ds-md",
  lg: "h-12 w-12 rounded-ds-lg",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;
export type IconButtonSize = keyof typeof iconButtonSizes;
