import { cn } from "@/lib/cn";
import {
  focusRing,
  shadowSoft,
  transitionFast,
} from "@/components/ui/tokens";

export const buttonVariants = {
  primary: cn(
    "bg-primary text-primary-foreground hover:opacity-90",
    shadowSoft,
    focusRing,
    transitionFast,
  ),
  secondary: cn(
    "bg-secondary text-secondary-foreground hover:opacity-90",
    focusRing,
    transitionFast,
  ),
  outline: cn(
    "border border-border bg-surface text-text-primary hover:border-primary/30 hover:bg-surface-muted",
    focusRing,
    transitionFast,
  ),
  ghost: cn(
    "text-text-secondary hover:bg-secondary hover:text-primary",
    focusRing,
    transitionFast,
  ),
} as const;

export const buttonSizes = {
  sm: "h-9 rounded-ds-sm px-ds-3 text-sm font-semibold",
  md: "h-10 rounded-ds-md px-ds-5 text-sm font-semibold",
  lg: "h-11 rounded-ds-lg px-ds-6 text-sm font-semibold",
} as const;

export const iconButtonSizes = {
  sm: "h-9 w-9 rounded-ds-sm",
  md: "h-10 w-10 rounded-ds-md",
  lg: "h-11 w-11 rounded-ds-lg",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;
export type IconButtonSize = keyof typeof iconButtonSizes;
