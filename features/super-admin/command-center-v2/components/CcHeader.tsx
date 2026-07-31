"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountIcon } from "@/components/account/AccountIcons";
import { BrowseCategoriesLineIcon, SearchLineIcon } from "@/components/icons/RvxLineIcons";
import type {
  CommandCenterAdminIdentity,
  CommandCenterNotification,
} from "@/lib/super-admin/command-center-v1/types";

function CcUtcClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "UTC",
          hour12: false,
        }) + " UTC",
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return <time className="cc2-header__clock">{time}</time>;
}

type CcHeaderProps = {
  notifications: CommandCenterNotification[];
  messageCount: number;
  admin: CommandCenterAdminIdentity;
};

export function CcHeader({ notifications, messageCount, admin }: CcHeaderProps) {
  return (
    <header className="cc2-header">
      <div className="cc2-header__left">
        <div>
          <div className="cc2-header__title-row">
            <h1 className="cc2-header__title">Command Center</h1>
            <span className="cc2-live-pill">
              <span className="cc2-live-pill__dot" />
              LIVE
            </span>
          </div>
          <p className="cc2-header__subtitle">Real-time overview of ROVEXO Marketplace</p>
        </div>
      </div>

      <div className="cc2-header__right">
        <CcUtcClock />

        <Link href="/super-admin/search" className="cc2-header__icon-btn" aria-label="Search">
          <SearchLineIcon className="h-[18px] w-[18px]" />
        </Link>
        <Link href="/super-admin/monitoring" className="cc2-header__icon-btn" aria-label="Notifications">
          <AccountIcon name="notifications" className="h-[18px] w-[18px]" />
          {notifications.length > 0 ? <span className="cc2-header__badge">{notifications.length}</span> : null}
        </Link>
        <Link href="/super-admin/messages-engine" className="cc2-header__icon-btn" aria-label="Messages">
          <AccountIcon name="messages" className="h-[18px] w-[18px]" />
          {messageCount > 0 ? <span className="cc2-header__badge">{messageCount}</span> : null}
        </Link>
        <Link href="/super-admin/platform" className="cc2-header__icon-btn" aria-label="Apps">
          <BrowseCategoriesLineIcon className="h-[18px] w-[18px]" />
        </Link>

        <Link href="/super-admin/staff" className="cc2-header__profile" title="Account settings">
          <span className="cc2-header__avatar" aria-hidden>
            {admin.initials}
          </span>
          <div>
            <strong>{admin.name}</strong>
            <span>{admin.roleLabel}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
