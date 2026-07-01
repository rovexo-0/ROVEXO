"use client";

import Link from "next/link";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { SellerSection } from "@/components/seller/SellerSection";
import { useSellerDashboard } from "@/hooks/seller";

export function SellerSettingsShortcut() {
  const { data } = useSellerDashboard();

  return (
    <SellerSection id="seller-settings" title="Settings">
      <div style={{ display: "grid", gap: 12 }}>
        {data.settingsLinks.map((link) => (
          <Link key={link.id} href={link.href} className="seller-settings-row">
            <RovexoIcon icon={link.icon} variant="settings" />
            <span>{link.label}</span>
          </Link>
        ))}
      </div>
    </SellerSection>
  );
}
