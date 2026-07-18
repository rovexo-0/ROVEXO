import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type PremiumIconProps = {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  float?: boolean;
  glow?: boolean;
  label?: string;
};

const sizeStyles = {
  sm: "h-5 w-5 [&_svg]:h-5 [&_svg]:w-5",
  md: "h-5 w-5 [&_svg]:h-5 [&_svg]:w-5",
  lg: "h-6 w-6 [&_svg]:h-6 [&_svg]:w-6",
} as const;

/** Absolute Final: plain icon box — float/glow/3D removed. */
export function PremiumIcon({
  children,
  size = "md",
  className,
  float: _float = false,
  glow: _glow = false,
  label,
}: PremiumIconProps) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn("relative inline-flex shrink-0 items-center justify-center", sizeStyles[size], className)}
    >
      {children}
    </span>
  );
}
