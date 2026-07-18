import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type GlassSurfaceProps = {
  as?: ElementType;
  depth?: 1 | 2 | 3;
  glow?: boolean;
  children?: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLElement>;

/** Absolute Final: solid surface only — glass/glow removed platform-wide. */
export function GlassSurface({
  as: Component = "div",
  depth: _depth = 2,
  glow: _glow = false,
  className,
  children,
  ...props
}: GlassSurfaceProps) {
  return (
    <Component className={cn("border border-border bg-surface", className)} {...props}>
      {children}
    </Component>
  );
}
