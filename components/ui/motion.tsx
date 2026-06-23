"use client";

import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

type MotionProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  delay?: number;
};

/** CSS GPU motion primitive (Framer Motion–compatible intent, zero extra bundle). */
export function MotionDiv({ children, className, delay = 0, style, ...props }: MotionProps) {
  return (
    <div
      className={cn("premium-enter", className)}
      style={{
        animationDelay: delay ? `${delay}ms` : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function MotionPress({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button type="button" className={cn("premium-btn", className)} {...props}>
      {children}
    </button>
  );
}
