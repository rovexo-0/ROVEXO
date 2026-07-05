"use client";

import { motion } from "framer-motion";
import { MyAccountCard } from "@/components/account/MyAccountCard";
import { ACCOUNT_NAV_ITEMS, SUPER_ADMIN_ACCOUNT_NAV_ITEM } from "@/components/account/account-nav";
import { usePrefersReducedMotion } from "@/lib/motion/use-prefers-reduced-motion";
import type { UserRole } from "@/lib/supabase/types/database";

/**
 * My Account grid — a fixed 4-column layout (never 2, never 3, never auto) of the
 * 16 spec destinations. Children fade up with a subtle stagger on mount.
 */
export function MyAccountGrid({ role }: { role: UserRole }) {
  const reduce = usePrefersReducedMotion();
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
      <motion.div
        className="acx-grid"
        initial={reduce ? false : "hidden"}
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.03, delayChildren: 0.02 } },
        }}
      >
        {ACCOUNT_NAV_ITEMS.map((item) => (
          <MyAccountCard
            key={item.id}
            label={item.label}
            href={item.href}
            icon={item.icon}
            color={item.color}
          />
        ))}
      </motion.div>
    </section>
  );
}
