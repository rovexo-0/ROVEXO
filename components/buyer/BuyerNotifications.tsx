"use client";

import Link from "next/link";
import { BuyerEmptyState } from "@/components/buyer/BuyerEmptyState";
import { BuyerSection } from "@/components/buyer/BuyerSection";
import { useBuyerDashboard } from "@/hooks/buyer";

export function BuyerNotifications() {
  const { data } = useBuyerDashboard();
  const latest = data.notifications;

  return (
    <BuyerSection id="buyer-notifications" title="Notifications" href="/notifications">
      {latest.length === 0 ? (
        <BuyerEmptyState title="No notifications" />
      ) : (
        <div className="flex flex-col gap-3">
          {latest.map((notification) => (
            <Link key={notification.id} href={`/notifications/${notification.id}`} className="buyer-list-card">
              <div className="min-w-0 flex-1">
                <p className="buyer-list-card__title">{notification.title}</p>
                <p className="buyer-list-card__meta">{notification.subtitle}</p>
              </div>
              {!notification.read ? <span className="buyer-status-badge">New</span> : null}
            </Link>
          ))}
        </div>
      )}
    </BuyerSection>
  );
}
