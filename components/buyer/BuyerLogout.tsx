"use client";

import Link from "next/link";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { RovexoIcons } from "@/lib/icons";

export function BuyerLogout() {
  return (
    <Link href="/auth/signout" className="buyer-logout" style={{ gap: 8 }}>
      <RovexoIcon icon={RovexoIcons.security.logout} variant="settings" />
      Log out
    </Link>
  );
}
