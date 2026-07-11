"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BottomNavigation, type BottomNavTab } from "@/components/ui/BottomNavigation";
import { RealtimeNotificationProvider } from "@/features/notifications/components/RealtimeNotificationProvider";
import type { MenuItemConfig, PlatformVisualConfig } from "@/lib/platform-visual/types";
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
  menuItems?: MenuItemConfig[];
};

export function BetaAppShell({
  children,
  bottomNavTab,
  showBottomNav = true,
  className,
  initialUnreadCount = 0,
  visualConfig,
  menuItems: menuItemsOverride,
}: BetaAppShellProps) {
  const pathname = usePathname() ?? "";
  const sellFlow = isSellFlowRoute(pathname);
  const bottomNavItems =
    menuItemsOverride ??
    (visualConfig ? resolvePublishedMenuItems(visualConfig.menus, "bottomNav") : undefined);
  const bottomNavVisible =
    !sellFlow &&
    showBottomNav &&
    (visualConfig?.shell.bottomNavigation
      ? visualConfig.shell.bottomNavigation.enabled && visualConfig.shell.bottomNavigation.published
      : true);

  return (
    <RealtimeNotificationProvider initialUnreadCount={initialUnreadCount}>
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
    </RealtimeNotificationProvider>
  );
}
