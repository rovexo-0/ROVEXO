import { cn } from "@/lib/cn";
import {
  focusRing,
  transitionFast,
} from "@/components/ui/tokens";

export const buttonVariants = {
  primary: cn(
    "premium-btn bg-[image:var(--ds-gradient-primary)] text-primary-foreground",
    "shadow-[var(--ds-depth-2),inset_0_1px_0_rgb(255_255_255/0.35)]",
    "hover:brightness-105 hover:-translate-y-px hover:shadow-[var(--ds-glow-primary)]",
    "active:translate-y-0 active:scale-[0.98]",
    focusRing,
    transitionFast,
  ),
  secondary: cn(
    "premium-btn bg-secondary text-secondary-foreground premium-depth-1",
    "hover:brightness-[0.98] hover:-translate-y-px",
    focusRing,
    transitionFast,
  ),
  outline: cn(
    "premium-btn border border-border/80 bg-surface/80 text-text-primary backdrop-blur-md",
    "shadow-[var(--ds-depth-1)] hover:border-primary/40 hover:bg-surface-muted hover:shadow-[var(--ds-glow-primary)]",
    focusRing,
    transitionFast,
  ),
  ghost: cn(
    "premium-btn rounded-ds-md text-text-secondary hover:bg-secondary/80 hover:text-primary",
    focusRing,
    transitionFast,
  ),
} as const;

export const buttonSizes = {
  sm: "h-9 rounded-ds-sm px-ds-3 text-sm font-semibold",
  md: "h-11 rounded-ds-md px-ds-5 text-sm font-semibold",
  lg: "h-12 rounded-ds-lg px-ds-6 text-base font-semibold",
} as const;

export const iconButtonSizes = {
  sm: "h-9 w-9 rounded-ds-sm",
  md: "h-10 w-10 rounded-ds-md",
  lg: "h-11 w-11 rounded-ds-lg",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;
export type IconButtonSize = keyof typeof iconButtonSizes;
