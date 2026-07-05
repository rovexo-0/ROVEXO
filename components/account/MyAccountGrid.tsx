"use client";

import { MyAccountCard } from "@/components/account/MyAccountCard";
import { ACCOUNT_NAV_ITEMS, SUPER_ADMIN_ACCOUNT_NAV_ITEM } from "@/components/account/account-nav";
import type { UserRole } from "@/lib/supabase/types/database";

/**
 * My Account grid — fixed 4-column layout of the 16 spec destinations.
 * Static markup only: framer-motion transforms on grid containers break
 * Android Chrome compositing (duplicated cards, overlapping labels).
 */
export function MyAccountGrid({ role }: { role: UserRole }) {
  const showSuperAdmin = role === "super_admin";

  return (
    <section className="acx-section" aria-labelledby="acx-account-title">
      <h2 id="acx-account-title" className="acx-section__title">
        My Account
      </h2>
      {showSuperAdmin ? (
        <div className="acx-grid acx-grid--super-admin" style={{ marginBottom: "1rem" }}>
          <MyAccountCard
            label={SUPER_ADMIN_ACCOUNT_NAV_ITEM.label}
            href={SUPER_ADMIN_ACCOUNT_NAV_ITEM.href}
            icon={SUPER_ADMIN_ACCOUNT_NAV_ITEM.icon}
            color={SUPER_ADMIN_ACCOUNT_NAV_ITEM.color}
          />
        </div>
      ) : null}
      <div className="acx-grid">
        {ACCOUNT_NAV_ITEMS.map((item) => (
          <MyAccountCard
            key={item.id}
            label={item.label}
            href={item.href}
            icon={item.icon}
            color={item.color}
          />
        ))}
      </div>
    </section>
  );
}
