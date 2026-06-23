import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type GlassSurfaceProps = {
  as?: ElementType;
  depth?: 1 | 2 | 3;
  glow?: boolean;
  children?: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLElement>;

const depthClass = {
  1: "premium-depth-1",
  2: "premium-depth-2",
  3: "premium-depth-3",
} as const;

export function GlassSurface({
  as: Component = "div",
  depth = 2,
  glow = false,
  className,
  children,
  ...props
}: GlassSurfaceProps) {
  return (
    <Component
      className={cn(
        "glass-surface-2026 premium-glass",
        depthClass[depth],
        glow && "premium-glow",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
