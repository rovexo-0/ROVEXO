import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export type TooltipProps = HTMLAttributes<HTMLSpanElement> & {
  label: string;
};

export function Tooltip({ label, className, children, ...props }: TooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)} {...props}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-ds-2 -translate-x-1/2 whitespace-nowrap rounded-ds-sm bg-text-primary px-ds-2 py-ds-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
