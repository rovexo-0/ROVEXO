"use client";

import type { ReactNode } from "react";
import { BottomNavigation, type BottomNavTab } from "@/components/ui/BottomNavigation";
import { MobileHeaderScrollProvider } from "@/components/home/MobileHeaderScrollContext";
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
      <MobileHeaderScrollProvider>
        <div
          className={cn(
            "rx-page min-h-screen bg-background text-text-primary",
            className,
          )}
        >
          {children}
          {showBottomNav && <BottomNavigation active={bottomNavTab} />}
        </div>
      </MobileHeaderScrollProvider>
    </RealtimeNotificationProvider>
  );
}
