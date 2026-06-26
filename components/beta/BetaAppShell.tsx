"use client";

import type { ReactNode } from "react";
import { BottomNavigation, type BottomNavTab } from "@/components/ui/BottomNavigation";
import { RealtimeNotificationProvider } from "@/features/notifications/components/RealtimeNotificationProvider";
import { cn } from "@/lib/cn";

type BetaAppShellProps = {
  children: ReactNode;
  bottomNavTab?: BottomNavTab;
  showBottomNav?: boolean;
  className?: string;
  initialUnreadCount?: number;
};

export function BetaAppShell({
  children,
  bottomNavTab,
  showBottomNav = true,
  className,
  initialUnreadCount = 0,
}: BetaAppShellProps) {
  return (
    <RealtimeNotificationProvider initialUnreadCount={initialUnreadCount}>
      <div
        className={cn(
          "min-h-screen bg-background text-text-primary",
          "bg-[radial-gradient(ellipse_120%_80%_at_50%_-30%,rgb(37_99_235/0.08),transparent)]",
          className,
        )}
      >
        {children}
        {showBottomNav && <BottomNavigation active={bottomNavTab} />}
      </div>
    </RealtimeNotificationProvider>
  );
}
