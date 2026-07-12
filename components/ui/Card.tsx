import { cn } from "@/lib/cn";
import { transitionFast } from "@/components/ui/tokens";
import type { HTMLAttributes } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "canonical";
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
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        variant === "canonical"
          ? "rx-surface-card--canonical pcu-card"
          : "rx-surface-card relative border-border/70 bg-surface/90",
        paddingStyles[padding],
        interactive && cn("cursor-pointer", transitionFast),
        className,
      )}
      {...props}
    >
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
