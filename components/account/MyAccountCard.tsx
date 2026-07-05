"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AccountIcon, type AccountIconName } from "@/components/account/AccountIcons";
import { usePrefersReducedMotion } from "@/lib/motion/use-prefers-reduced-motion";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

export type MyAccountCardProps = {
  label: string;
  href: string;
  icon: AccountIconName;
  /** Accent colour; also drives the pastel tile wash. */
  color: string;
};

/**
 * Single My Account destination card: pastel rounded icon tile + colourful glyph
 * + title, centered. Hover lifts and softly scales (250ms). Fixed design language
 * from the spec; sizes scale proportionally via clamp() so the fixed 4-column grid
 * stays intact from small phones up to the 480px shell.
 */
export function MyAccountCard({ label, href, icon, color }: MyAccountCardProps) {
  const reduce = usePrefersReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={reduce ? undefined : { y: -4, scale: 1.02 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ type: "tween", duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="acx-card-motion"
    >
      <Link href={href} aria-label={label} className={cn("acx-card", focusRing)}>
        <span
          className="acx-card__tile"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, #ffffff)`, color }}
        >
          <AccountIcon name={icon} className="acx-card__icon" />
        </span>
        <span className="acx-card__label">{label}</span>
      </Link>
    </motion.div>
  );
}
