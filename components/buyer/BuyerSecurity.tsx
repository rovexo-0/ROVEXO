"use client";

import Link from "next/link";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { BuyerSection } from "@/components/buyer/BuyerSection";

const SECURITY_LINKS = [
  { href: "/account/security", label: "Password", icon: RovexoIcons.security.shield },
  { href: "/account/security", label: "Two-factor authentication", icon: RovexoIcons.security.shield },
  { href: "/account/security", label: "Sessions & devices", icon: RovexoIcons.dashboard.settings },
] as const;

export function BuyerSecurity() {
  return (
    <BuyerSection id="buyer-security" title="Security" href="/account/security">
      <div className="flex flex-col gap-3">
        {SECURITY_LINKS.map((item) => (
          <Link key={item.label} href={item.href} className="buyer-settings-row">
            <RovexoIcon icon={item.icon} variant="settings" />
            <span className="buyer-list-card__title">{item.label}</span>
          </Link>
        ))}
      </div>
    </BuyerSection>
  );
}
