import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Vertical stack for account/settings page sections — single spacing rhythm. */
export function AccountPageStack({
  children,
  className,
  "aria-label": ariaLabel = "Account",
}: {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      className={cn("flex flex-col gap-[var(--cds-space-section-gap)]", className)}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
