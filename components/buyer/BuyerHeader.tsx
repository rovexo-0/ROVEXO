"use client";

import Link from "next/link";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { Avatar } from "@/components/ui/Avatar";
import { RovexoIcons } from "@/lib/icons";
import { useBuyerDashboard } from "@/hooks/buyer";

export function BuyerHeader() {
  const { data } = useBuyerDashboard();
  const { profile } = data;
  const unreadMessages = data.conversations.reduce((sum, item) => sum + item.unreadCount, 0);
  const unreadNotifications = data.notifications.filter((item) => !item.read).length;

  return (
    <header className="buyer-header">
      <div className="buyer-header__identity">
        <Avatar src={profile.avatarUrl} alt={profile.fullName} name={profile.fullName} size="sm" />
        <div className="min-w-0">
          <p className="buyer-header__greeting">Hi, {profile.fullName.split(" ")[0]}</p>
          {data.trust ? (
            <span className="buyer-header__badge">
              <RovexoIcon icon={RovexoIcons.badges.verified} size={14} />
              {data.trust.progress.current} buyer
            </span>
          ) : null}
        </div>
      </div>
      <div className="buyer-header__actions">
        <Link href="/messages" className="buyer-header__action" aria-label="Messages">
          <RovexoIcon icon={RovexoIcons.chat.messages} variant="header" />
          {unreadMessages > 0 ? <span className="buyer-header__badge-count">{unreadMessages}</span> : null}
        </Link>
        <Link href="/notifications" className="buyer-header__action" aria-label="Notifications">
          <RovexoIcon icon={RovexoIcons.notifications.bell} variant="header" />
          {unreadNotifications > 0 ? (
            <span className="buyer-header__badge-count">{unreadNotifications}</span>
          ) : null}
        </Link>
        <Link href="/account/settings" className="buyer-header__action" aria-label="Settings">
          <RovexoIcon icon={RovexoIcons.settings.settings} variant="header" />
        </Link>
      </div>
    </header>
  );
}
