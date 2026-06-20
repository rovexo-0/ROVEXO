import { cn } from "@/lib/cn";
import {
  shadowMediumHover,
  shadowSoft,
  transitionFast,
} from "@/components/ui/tokens";
import type { HTMLAttributes } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingStyles = {
  none: "",
  sm: "p-ds-3",
  md: "p-ds-4",
  lg: "p-ds-6",
} as const;

export function Card({
  interactive = false,
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-ds-lg border border-border bg-surface",
        shadowSoft,
        paddingStyles[padding],
        interactive && cn("cursor-pointer", transitionFast, shadowMediumHover),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
