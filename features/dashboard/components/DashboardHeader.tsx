"use client";

import { useState } from "react";
import Link from "next/link";
import { IconButton } from "@/components/ui/IconButton";
import { ModalBody, ModalContainer } from "@/components/ui/ModalContainer";
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
      <header className="rx-dash-header">
        <div className="rx-dash-header__row">
          <IconButton
            label={menuOpen ? "Close menu" : "Open menu"}
            variant="ghost"
            size="md"
            className="rx-dash-header__action shrink-0"
            onClick={() => setMenuOpen((current) => !current)}
          >
            <DashboardIcon3D type="categories" size={28} />
          </IconButton>

          <h1 className="rx-dash-header__title text-center">{title}</h1>

          <div className="rx-dash-header__actions">
            <NotificationBell />
            <Link
              href={settingsHref}
              aria-label="Settings"
              className={cn("rx-dash-header__action", focusRing)}
            >
              <DashboardIcon3D type="settings" size={28} />
            </Link>
          </div>
        </div>
      </header>

      <ModalContainer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        variant="fullscreen"
        zIndex={100}
        ariaLabel={menuLabel}
        className="bg-overlay"
      >
        <ModalBody className="px-5 pt-[calc(72px+env(safe-area-inset-top))] pb-6">
          <div
            className="relative mx-auto mt-3 max-w-2xl"
            role="presentation"
            onClick={() => setMenuOpen(false)}
          >
            <MobileHubNavigator profile={profile} defaultHub={defaultHub} />
          </div>
        </ModalBody>
      </ModalContainer>
    </>
  );
}
