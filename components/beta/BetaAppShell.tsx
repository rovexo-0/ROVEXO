"use client";

import type { ReactNode } from "react";
import { BottomNavigation, type BottomNavTab } from "@/components/ui/BottomNavigation";
import { cn } from "@/lib/cn";

type BetaAppShellProps = {
  children: ReactNode;
  bottomNavTab?: BottomNavTab;
  showBottomNav?: boolean;
  className?: string;
};

export function BetaAppShell({
  children,
  bottomNavTab,
  showBottomNav = true,
  className,
}: BetaAppShellProps) {
  return (
    <div className={cn("min-h-screen bg-background text-text-primary", className)}>
      {children}
      {showBottomNav && <BottomNavigation active={bottomNavTab} />}
    </div>
  );
}
