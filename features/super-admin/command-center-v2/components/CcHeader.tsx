"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  Grid3X3,
  Mail,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/cn";
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
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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
        <div className="cc2-theme-toggle" role="group" aria-label="Theme">
          <button
            type="button"
            className={cn("cc2-theme-toggle__btn", !isDark && "cc2-theme-toggle__btn--active")}
            onClick={() => setTheme("light")}
            aria-pressed={!isDark}
          >
            <Sun size={14} />
          </button>
          <button
            type="button"
            className={cn("cc2-theme-toggle__btn", isDark && "cc2-theme-toggle__btn--active")}
            onClick={() => setTheme("dark")}
            aria-pressed={isDark}
          >
            <Moon size={14} />
          </button>
        </div>

        <CcUtcClock />

        <Link href="/super-admin/search" className="cc2-header__icon-btn" aria-label="Search">
          <Search size={18} />
        </Link>
        <Link href="/super-admin/monitoring" className="cc2-header__icon-btn" aria-label="Notifications">
          <Bell size={18} />
          {notifications.length > 0 ? <span className="cc2-header__badge">{notifications.length}</span> : null}
        </Link>
        <Link href="/super-admin/messages-engine" className="cc2-header__icon-btn" aria-label="Messages">
          <Mail size={18} />
          {messageCount > 0 ? <span className="cc2-header__badge">{messageCount}</span> : null}
        </Link>
        <Link href="/super-admin/platform" className="cc2-header__icon-btn" aria-label="Apps">
          <Grid3X3 size={18} />
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
