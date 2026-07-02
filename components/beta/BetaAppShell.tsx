"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BottomNavigation, type BottomNavTab } from "@/components/ui/BottomNavigation";
import { MobileHeaderScrollProvider } from "@/components/home/MobileHeaderScrollContext";
import { RealtimeNotificationProvider } from "@/features/notifications/components/RealtimeNotificationProvider";
import type { PlatformVisualConfig } from "@/lib/platform-visual/types";
import { resolvePublishedMenuItems } from "@/lib/platform-visual/resolver";
import { isSellFlowRoute } from "@/lib/navigation/sell-flow-routes";
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
  const pathname = usePathname() ?? "";
  const sellFlow = isSellFlowRoute(pathname);
  const bottomNavItems = visualConfig
    ? resolvePublishedMenuItems(visualConfig.menus, "bottomNav")
    : undefined;
  const bottomNavVisible =
    !sellFlow &&
    showBottomNav &&
    (visualConfig?.shell.bottomNavigation
      ? visualConfig.shell.bottomNavigation.enabled && visualConfig.shell.bottomNavigation.published
      : true);

  return (
    <RealtimeNotificationProvider initialUnreadCount={initialUnreadCount}>
      <MobileHeaderScrollProvider>
        <div
          className={cn(
            "rx-page min-h-screen bg-background text-text-primary",
            sellFlow && "sell-flow-shell",
            className,
          )}
        >
          {children}
          {bottomNavVisible ? (
            <BottomNavigation active={bottomNavTab} menuItems={bottomNavItems} visible={bottomNavVisible} />
          ) : null}
        </div>
      </MobileHeaderScrollProvider>
    </RealtimeNotificationProvider>
  );
}
