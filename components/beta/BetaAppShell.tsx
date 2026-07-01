"use client";

import type { ReactNode } from "react";
import { RovexoFooterNavigation, type BottomNavTab } from "@/components/home/RovexoFooterNavigation";
import { RovexoMobileHeaderScrollProvider } from "@/components/home/RovexoMobileHeaderScrollContext";
import { RealtimeNotificationProvider } from "@/features/notifications/components/RealtimeNotificationProvider";
import type { PlatformVisualConfig } from "@/lib/platform-visual/types";
import { resolvePublishedMenuItems } from "@/lib/platform-visual/resolver";
import { cn } from "@/lib/cn";

type BetaAppShellProps = {
  children: ReactNode;
  bottomNavTab?: BottomNavTab;
  showBottomNav?: boolean;
  className?: string;
  initialUnreadCount?: number;
  visualConfig?: PlatformVisualConfig;
};

export function BetaAppShell({
  children,
  bottomNavTab,
  showBottomNav = true,
  className,
  initialUnreadCount = 0,
  visualConfig,
}: BetaAppShellProps) {
  const bottomNavItems = visualConfig
    ? resolvePublishedMenuItems(visualConfig.menus, "bottomNav")
    : undefined;
  const bottomNavVisible =
    showBottomNav &&
    (visualConfig?.shell.bottomNavigation
      ? visualConfig.shell.bottomNavigation.enabled && visualConfig.shell.bottomNavigation.published
      : true);

  return (
    <RealtimeNotificationProvider initialUnreadCount={initialUnreadCount}>
      <RovexoMobileHeaderScrollProvider>
        <div className={cn("rx-page min-h-screen bg-white text-[#111111]", className)}>
          {children}
          {bottomNavVisible ? (
            <RovexoFooterNavigation active={bottomNavTab} menuItems={bottomNavItems} visible={bottomNavVisible} />
          ) : null}
        </div>
      </RovexoMobileHeaderScrollProvider>
    </RealtimeNotificationProvider>
  );
}
