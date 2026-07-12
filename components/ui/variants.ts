import { cn } from "@/lib/cn";
import { focusRing, transitionFast } from "@/components/ui/tokens";

export const buttonVariants = {
  primary: cn(
    "rx-btn rx-btn--primary bg-[image:var(--ds-gradient-primary)] text-primary-foreground",
    "shadow-[var(--ds-shadow-medium)]",
    "hover:brightness-[1.03]",
    "active:translate-y-0 active:scale-[0.98]",
    focusRing,
    transitionFast,
  ),
  secondary: cn(
    "rx-btn rx-btn--secondary rx-glass text-text-primary",
    "border border-[var(--ds-color-border)] bg-[var(--ds-glass-bg)]",
    "hover:bg-surface-muted/80 hover:-translate-y-px hover:shadow-[var(--ds-shadow-medium)]",
    focusRing,
    transitionFast,
  ),
  outline: cn(
    "rx-btn border border-[var(--ds-color-border)] bg-surface/70 text-text-primary backdrop-blur-md",
    "shadow-[var(--ds-shadow-soft)] hover:border-primary/35 hover:shadow-[var(--ds-shadow-medium)]",
    focusRing,
    transitionFast,
  ),
  ghost: cn(
    "rx-btn rounded-ds-md text-text-secondary hover:bg-secondary/70 hover:text-primary",
    focusRing,
    transitionFast,
  ),
  success: cn(
    "rx-btn rx-btn--success bg-success text-success-foreground shadow-[var(--ds-shadow-soft)]",
    "hover:brightness-105 hover:-translate-y-px",
    focusRing,
    transitionFast,
  ),
  danger: cn(
    "rx-btn rx-btn--danger bg-danger text-danger-foreground shadow-[var(--ds-shadow-soft)]",
    "hover:brightness-105 hover:-translate-y-px",
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
