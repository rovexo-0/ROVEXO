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
  1: "rx-depth-1",
  2: "rx-depth-2",
  3: "rx-depth-3",
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
        "rx-glass-surface rx-glass",
        depthClass[depth],
        glow && "rx-glow",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
