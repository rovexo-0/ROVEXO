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
  sm: "h-9 w-9 [&_svg]:h-4 [&_svg]:w-4",
  md: "h-11 w-11 [&_svg]:h-5 [&_svg]:w-5",
  lg: "h-14 w-14 [&_svg]:h-7 [&_svg]:w-7",
} as const;

export function PremiumIcon({
  children,
  size = "md",
  className,
  float = false,
  glow = false,
  label,
}: PremiumIconProps) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn(
        "premium-icon-3d relative shrink-0",
        sizeStyles[size],
        float && "premium-float",
        glow && "premium-pulse-glow",
        className,
      )}
    >
      <span className="relative z-[1] flex h-full w-full items-center justify-center">{children}</span>
    </span>
  );
}
