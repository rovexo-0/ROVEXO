"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { StickyPageHeader } from "@/components/ui/StickyPageHeader";
import { MobilePremiumCard } from "@/features/mobile-ui/components/MobilePremiumCard";
import { MobilePremiumGrid } from "@/features/mobile-ui";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import { BellIcon, MenuIcon } from "@/features/dashboard/icons";
import type { DashboardMenuItem } from "@/features/dashboard/types";

type DashboardHeaderProps = {
  title: string;
  unreadNotifications: number;
  menuItems: DashboardMenuItem[];
  menuLabel: string;
};

function formatNotificationBadge(count: number): string {
  if (count > 9) return "9+";
  return String(count);
}

export function DashboardHeader({
  title,
  unreadNotifications,
  menuItems,
  menuLabel,
}: DashboardHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <StickyPageHeader>
        <div
          className={cn(
            "grid min-h-[56px] grid-cols-[48px_1fr_48px] items-center gap-ds-2 px-ds-4",
            "pt-[max(env(safe-area-inset-top),var(--ds-space-3))] pb-ds-3",
          )}
        >
          <IconButton
            label={menuOpen ? "Close menu" : "Open menu"}
            variant="ghost"
            size="md"
            className="justify-self-start"
            onClick={() => setMenuOpen((current) => !current)}
          >
            <MenuIcon className="h-5 w-5" />
          </IconButton>

          <h1 className="truncate text-center text-lg font-semibold text-text-primary">{title}</h1>

          <Link
            href="/notifications"
            aria-label={
              unreadNotifications > 0
                ? `Notifications, ${unreadNotifications} unread`
                : "Notifications"
            }
            className={cn(
              "relative inline-flex min-h-ds-7 min-w-ds-7 items-center justify-center justify-self-end rounded-ds-md text-text-primary",
              focusRing,
            )}
          >
            <BellIcon className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-ds-full bg-danger px-1 text-[0.625rem] font-bold text-danger-foreground">
                {formatNotificationBadge(unreadNotifications)}
              </span>
            )}
          </Link>
        </div>
      </StickyPageHeader>

      {menuOpen && (
        <div className="premium-sheet-overlay fixed inset-0 z-[100] overflow-y-auto px-ds-4 pt-[calc(56px+env(safe-area-inset-top))] pb-ds-6">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            aria-label={menuLabel}
            className="relative mx-auto mt-ds-3 max-w-2xl"
            onClick={() => setMenuOpen(false)}
          >
            <MobilePremiumGrid>
              {menuItems.map((item) => (
                <MobilePremiumCard
                  key={item.title}
                  href={item.href ?? "/account"}
                  label={item.title}
                  subtitle="Open"
                  icon={item.icon}
                  badgeCount={item.badge ?? 0}
                />
              ))}
            </MobilePremiumGrid>
          </nav>
        </div>
      )}
    </>
  );
}

export function dashboardMenuIcon(icon: ReactNode) {
  return icon;
}
