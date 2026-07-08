import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { StatusTone } from "@/features/commerce-ui/lib/status";

type CommerceStatusBadgeProps = {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
};

const toneStyles: Record<StatusTone, string> = {
  success: "bg-success/10 text-success",
  info: "bg-primary/10 text-primary",
  muted: "bg-surface-muted text-text-secondary",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

/**
 * Soft, pastel status pill used across commerce surfaces (Paid, In Transit,
 * Preparing Shipment). Token-driven so it adapts to dark mode automatically.
 */
export function CommerceStatusBadge({ tone, children, className }: CommerceStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-ds-full px-ds-3 py-ds-1 text-xs font-semibold",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
