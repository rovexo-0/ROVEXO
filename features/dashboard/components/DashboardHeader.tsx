"use client";

import { useState } from "react";
import Link from "next/link";
import { IconButton } from "@/components/ui/IconButton";
import { DashboardIcon3D } from "@/components/icons/DashboardIcon3D";
import { MobileHubNavigator } from "@/features/mobile-ui";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";
import type { MobilePrimaryHubId } from "@/lib/mobile-ui/types";
import type { UserProfile } from "@/lib/profile/types";

type DashboardHeaderProps = {
  title: string;
  menuLabel: string;
  profile: UserProfile;
  defaultHub?: MobilePrimaryHubId;
  settingsHref?: string;
};

export function DashboardHeader({
  title,
  menuLabel,
  profile,
  defaultHub,
  settingsHref = "/account/settings",
}: DashboardHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="dash-v1-header">
        <div className="dash-v1-header__row">
          <IconButton
            label={menuOpen ? "Close menu" : "Open menu"}
            variant="ghost"
            size="md"
            className="dash-v1-header__action shrink-0"
            onClick={() => setMenuOpen((current) => !current)}
          >
            <DashboardIcon3D type="categories" size={28} />
          </IconButton>

          <h1 className="dash-v1-header__title text-center">{title}</h1>

          <div className="dash-v1-header__actions">
            <NotificationBell />
            <Link
              href={settingsHref}
              aria-label="Settings"
              className={cn("dash-v1-header__action", focusRing)}
            >
              <DashboardIcon3D type="settings" size={28} />
            </Link>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="premium-sheet-overlay fixed inset-0 z-[100] overflow-y-auto bg-white/95 px-5 pt-[calc(72px+env(safe-area-inset-top))] pb-6">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="relative mx-auto mt-3 max-w-2xl"
            role="dialog"
            aria-label={menuLabel}
            onClick={() => setMenuOpen(false)}
          >
            <MobileHubNavigator profile={profile} defaultHub={defaultHub} />
          </div>
        </div>
      ) : null}
    </>
  );
}
