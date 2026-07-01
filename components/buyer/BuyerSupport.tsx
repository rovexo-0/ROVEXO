"use client";

import Link from "next/link";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";
import { BuyerSection } from "@/components/buyer/BuyerSection";

const SUPPORT_LINKS = [
  { href: "/help/faq", label: "FAQ", icon: RovexoIcons.dashboard.help },
  { href: "/support", label: "Contact support", icon: RovexoIcons.support.support },
  { href: "/help", label: "Help center", icon: RovexoIcons.dashboard.help },
  { href: "/assistant", label: "Live chat", icon: RovexoIcons.chat.messages },
] as const;

export function BuyerSupport() {
  return (
    <BuyerSection id="buyer-support" title="Support" href="/help">
      <div className="flex flex-col gap-3">
        {SUPPORT_LINKS.map((item) => (
          <Link key={item.label} href={item.href} className="buyer-settings-row">
            <RovexoIcon icon={item.icon} variant="settings" />
            <span className="buyer-list-card__title">{item.label}</span>
          </Link>
        ))}
      </div>
    </BuyerSection>
  );
}
