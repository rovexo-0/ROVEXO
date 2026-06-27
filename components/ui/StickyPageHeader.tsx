import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type StickyPageHeaderProps = {
  children: ReactNode;
  className?: string;
};

/** Shared sticky page header — Premium 2026 glass chrome. */
export function StickyPageHeader({ children, className }: StickyPageHeaderProps) {
  return (
    <header className={cn("rx-page-header sticky top-0 z-50", className)}>
      {children}
    </header>
  );
}
