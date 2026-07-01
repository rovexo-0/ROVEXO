"use client";

import Link from "next/link";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { SellerSection } from "@/components/seller/SellerSection";

const LINKS = [
  { href: "/help/faq", label: "FAQ", icon: RovexoIcons.dashboard.help },
  { href: "/support", label: "Contact support", icon: RovexoIcons.dashboard.support },
  { href: "/help", label: "Help center", icon: RovexoIcons.misc.help },
  { href: "/messages", label: "Live chat", icon: RovexoIcons.chat.messages },
];

export function SellerSupportCard() {
  return (
    <SellerSection id="seller-support" title="Support">
      <div className="seller-card" style={{ display: "grid", gap: 12 }}>
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="seller-settings-row">
            <RovexoIcon icon={link.icon} variant="settings" />
            <span>{link.label}</span>
          </Link>
        ))}
      </div>
    </SellerSection>
  );
}
